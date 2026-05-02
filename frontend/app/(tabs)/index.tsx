/**
 * app/(tabs)/index.tsx - Hemskärm för Allsvenskan Predictor
 *
 * Visar alla matcher uppdelade i "Kommande" och "Spelade" flikar.
 * Användaren kan tippa resultat på kommande matcher och se poäng
 * på redan spelade matcher.
 *
 * Poängsystem: 3p = exakt rätt, 1p = rätt utfall (1X2), 0p = fel
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { getMatches, getPredictions, createPrediction } from "../../services/api";
import { Match, Prediction } from "../../types";
import MatchCard from "../../components/match-card";
import ScoreSummary from "../../components/score-summary";

export default function Home() {
  // --- State ---
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [inputs, setInputs] = useState<Record<string, { home: string; away: string }>>({});
  const [activeTab, setActiveTab] = useState<"upcoming" | "finished">("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // --- Ladda data vid mount ---
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Hämta matcher och tips från backend
   * Sorterar matcher efter omgång och datum
   */
  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);

      const [matchData, predData] = await Promise.all([
        getMatches(),
        getPredictions(),
      ]);

      // Sortera: lägst omgång först, sedan datum inom samma omgång
      const sorted = matchData.sort((a, b) => {
        const roundDiff = parseInt(a.round) - parseInt(b.round);
        if (roundDiff !== 0) return roundDiff;
        return a.date.localeCompare(b.date);
      });

      setMatches(sorted);
      setPredictions(predData);
      console.log(`📊 Laddade ${sorted.length} matcher, ${predData.length} tips`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Något gick fel";
      console.error("❌ Kunde inte ladda data:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Skicka ett tips för en match
   * Validerar input, skickar till backend och laddar om data
   */
  const submitPrediction = async (matchId: string) => {
    const input = inputs[matchId];
    if (!input?.home || !input?.away) return;

    try {
      setSubmitting(matchId);
      setError(null);

      await createPrediction(matchId, parseInt(input.home), parseInt(input.away));

      // Ladda om data och rensa input
      await loadData();
      setInputs((prev) => ({ ...prev, [matchId]: { home: "", away: "" } }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte spara tips";
      console.error("❌ Kunde inte skapa tips:", message);
      setError(message);
    } finally {
      setSubmitting(null);
    }
  };

  // --- Hjälpfunktioner ---

  /** Lookup map för tips per match (O(1) istället för O(n)) */
  const predictionMap = useMemo(
    () => new Map(predictions.map((p) => [p.matchId, p])),
    [predictions]
  );

  // --- Filtrering ---
  const upcoming = matches.filter((m) => m.homeScore === null);
  const finished = matches.filter((m) => m.homeScore !== null);
  const displayedMatches = activeTab === "upcoming" ? upcoming : finished;

  // --- Callbacks (stabila referenser för att undvika omrenderingar) ---

  const handleInputChange = useCallback(
    (matchId: string, field: "home" | "away", value: string) => {
      setInputs((prev) => ({
        ...prev,
        [matchId]: { ...prev[matchId], home: prev[matchId]?.home || "", away: prev[matchId]?.away || "", [field]: value },
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    (matchId: string) => submitPrediction(matchId),
    [inputs]
  );

  // --- Render: Match-kort ---
  const renderMatch = useCallback(
    ({ item }: { item: Match }) => (
      <MatchCard
        match={item}
        prediction={predictionMap.get(item.matchId)}
        input={inputs[item.matchId]}
        isSubmitting={submitting === item.matchId}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    ),
    [predictionMap, inputs, submitting, handleInputChange, handleSubmit]
  );

  // --- Render: Loading/Error states ---
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Laddar matcher...</Text>
      </View>
    );
  }

  // --- Render: Huvudvy ---
  return (
    <View style={styles.container}>
      {/* Felmeddelande */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Pressable onPress={loadData}>
            <Text style={styles.retryText}>Försök igen</Text>
          </Pressable>
        </View>
      )}

      {/* Poängsammanfattning */}
      <ScoreSummary predictions={predictions} />

      {/* Flikar */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, activeTab === "upcoming" && styles.tabActive]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text style={[styles.tabText, activeTab === "upcoming" && styles.tabTextActive]}>
            🔮 Kommande ({upcoming.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "finished" && styles.tabActive]}
          onPress={() => setActiveTab("finished")}
        >
          <Text style={[styles.tabText, activeTab === "finished" && styles.tabTextActive]}>
            ✅ Spelade ({finished.length})
          </Text>
        </Pressable>
      </View>

      {/* Matchlista */}
      <FlatList
        data={displayedMatches}
        renderItem={renderMatch}
        keyExtractor={(m) => m.matchId}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {activeTab === "upcoming"
              ? "Inga kommande matcher just nu"
              : "Inga spelade matcher ännu"}
          </Text>
        }
      />
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
  errorBanner: {
    backgroundColor: "#fdecea",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: { color: "#d32f2f", fontSize: 14, flex: 1 },
  retryText: { color: "#1a73e8", fontWeight: "bold", marginLeft: 12 },
  tabRow: { flexDirection: "row", marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#ddd",
  },
  tabActive: { borderBottomColor: "#1a73e8" },
  tabText: { fontSize: 16, color: "#666" },
  tabTextActive: { color: "#1a73e8", fontWeight: "bold" },
  emptyText: { textAlign: "center", color: "#666", marginTop: 32, fontSize: 16 },
});
