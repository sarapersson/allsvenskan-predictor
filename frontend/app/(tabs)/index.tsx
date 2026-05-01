/**
 * app/(tabs)/index.tsx - Hemskärm för Allsvenskan Predictor
 *
 * Visar alla matcher uppdelade i "Kommande" och "Spelade" flikar.
 * Användaren kan tippa resultat på kommande matcher och se poäng
 * på redan spelade matcher.
 *
 * Poängsystem: 3p = exakt rätt, 1p = rätt utfall (1X2), 0p = fel
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { getMatches, getPredictions, createPrediction } from "../../services/api";
import { Match, Prediction } from "../../types";

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

  /** Hitta tips för en specifik match */
  const getPrediction = (matchId: string) =>
    predictions.find((p) => p.matchId === matchId);

  // --- Filtrering och statistik ---
  const upcoming = matches.filter((m) => m.homeScore === null);
  const finished = matches.filter((m) => m.homeScore !== null);
  const displayedMatches = activeTab === "upcoming" ? upcoming : finished;

  const totalPoints = predictions.reduce((sum, p) => sum + (p.points || 0), 0);
  const scored = predictions.filter((p) => p.points !== undefined);
  const exact = scored.filter((p) => p.points === 3).length;
  const correct1X2 = scored.filter((p) => p.points === 1).length;
  const misses = scored.filter((p) => p.points === 0).length;

  // --- Render: Match-kort ---
  const renderMatch = ({ item }: { item: Match }) => {
    const prediction = getPrediction(item.matchId);
    const isFinished = item.homeScore !== null;
    const isSubmitting = submitting === item.matchId;

    return (
      <View style={styles.card}>
        <Text style={styles.round}>Omgång {item.round} • {item.date}</Text>
        <Text style={styles.teams}>
          {item.homeTeam} vs {item.awayTeam}
        </Text>

        {isFinished && (
          <Text style={styles.result}>
            Slutresultat: {item.homeScore} - {item.awayScore}
          </Text>
        )}

        {prediction ? (
          <Text style={styles.prediction}>
            Din tipp: {prediction.predictedHome} - {prediction.predictedAway}
            {prediction.points !== undefined && ` (${prediction.points}p)`}
          </Text>
        ) : !isFinished ? (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="H"
              value={inputs[item.matchId]?.home || ""}
              onChangeText={(v) =>
                setInputs((prev) => ({
                  ...prev,
                  [item.matchId]: { ...prev[item.matchId], home: v },
                }))
              }
            />
            <Text style={styles.dash}>-</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="B"
              value={inputs[item.matchId]?.away || ""}
              onChangeText={(v) =>
                setInputs((prev) => ({
                  ...prev,
                  [item.matchId]: { ...prev[item.matchId], away: v },
                }))
              }
            />
            <Pressable
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={() => submitPrediction(item.matchId)}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? "..." : "Tippa"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  };

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
      <Text style={styles.score}>🏆 Totalpoäng: {totalPoints}p</Text>
      <Text style={styles.scoreSubtitle}>
        Tippa resultatet på varje match.{"\n"}
        Exakt rätt resultat = 3p • Rätt utgång (1/X/2) = 1p • Fel = 0p{"\n"}
        {scored.length} matcher bedömda • {exact} exakta • {correct1X2} rätt utgång • {misses} miss
      </Text>

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
  score: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
  scoreSubtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
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
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  round: { fontSize: 12, color: "#666" },
  teams: { fontSize: 18, fontWeight: "bold", marginVertical: 4 },
  result: { fontSize: 14, color: "#333", marginTop: 4 },
  prediction: { fontSize: 14, color: "#2e7d32", marginTop: 4, fontWeight: "600" },
  inputRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    width: 40,
    textAlign: "center",
    padding: 8,
  },
  dash: { marginHorizontal: 8, fontSize: 18 },
  button: {
    backgroundColor: "#1a73e8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  buttonDisabled: { backgroundColor: "#93b8f0" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  emptyText: { textAlign: "center", color: "#666", marginTop: 32, fontSize: 16 },
});
