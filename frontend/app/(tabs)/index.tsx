import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from "react-native";
import { getMatches, getPredictions, createPrediction } from "../../services/api";

type Match = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  round: string;
};

type Prediction = {
  matchId: string;
  predictedHome: number;
  predictedAway: number;
  points?: number;
};

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [inputs, setInputs] = useState<Record<string, { home: string; away: string }>>({});
  const [activeTab, setActiveTab] = useState<"upcoming" | "finished">("upcoming");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [matchData, predData] = await Promise.all([getMatches(), getPredictions()]);
    const sorted = (matchData.matches || []).sort((a: Match, b: Match) => {
      const roundDiff = parseInt(a.round) - parseInt(b.round);
      if (roundDiff !== 0) return roundDiff;
      return a.date.localeCompare(b.date);
    });
    setMatches(sorted);
    setPredictions(predData.predictions || []);
  };

  const submitPrediction = async (matchId: string) => {
    const input = inputs[matchId];
    if (!input?.home || !input?.away) return;

    await createPrediction(matchId, parseInt(input.home), parseInt(input.away));
    await loadData();
    setInputs((prev) => ({ ...prev, [matchId]: { home: "", away: "" } }));
  };

  const getPrediction = (matchId: string) =>
    predictions.find((p) => p.matchId === matchId);

  const upcoming = matches.filter((m) => m.homeScore === null);
  const finished = matches.filter((m) => m.homeScore !== null);
  const displayedMatches = activeTab === "upcoming" ? upcoming : finished;

  const totalPoints = predictions.reduce((sum, p) => sum + (p.points || 0), 0);
  const scored = predictions.filter((p) => p.points !== undefined);
  const exact = scored.filter((p) => p.points === 3).length;
  const correct1X2 = scored.filter((p) => p.points === 1).length;
  const misses = scored.filter((p) => p.points === 0).length;

  const renderMatch = ({ item }: { item: Match }) => {
    const prediction = getPrediction(item.matchId);
    const isFinished = item.homeScore !== null;

    return (
      <View style={styles.card}>
        <Text style={styles.round}>Omgång {item.round} • {item.date}</Text>
        <Text style={styles.teams}>
          {item.homeTeam} vs {item.awayTeam}
        </Text>

        {isFinished && (
          <Text style={styles.result}>Slutresultat: {item.homeScore} - {item.awayScore}</Text>
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
            <Pressable style={styles.button} onPress={() => submitPrediction(item.matchId)}>
              <Text style={styles.buttonText}>Tippa</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.score}>🏆 Totalpoäng: {totalPoints}p</Text>
      <Text style={styles.scoreSubtitle}>
        Tippa resultatet på varje match.{"\n"}
        Exakt rätt resultat = 3p • Rätt utgång (1/X/2) = 1p • Fel = 0p{"\n"}
        {scored.length} matcher bedömda • {exact} exakta • {correct1X2} rätt utgång • {misses} miss
      </Text>

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

      <FlatList
        data={displayedMatches}
        renderItem={renderMatch}
        keyExtractor={(m) => m.matchId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  score: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
  scoreSubtitle: { fontSize: 12, color: "#666", textAlign: "center", marginBottom: 16, lineHeight: 18 },
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
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  round: { fontSize: 12, color: "#666" },
  teams: { fontSize: 18, fontWeight: "bold", marginVertical: 4 },
  result: { fontSize: 14, color: "#333", marginTop: 4 },
  prediction: { fontSize: 14, color: "#2e7d32", marginTop: 4, fontWeight: "600" },
  inputRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 4, width: 40, textAlign: "center", padding: 8 },
  dash: { marginHorizontal: 8, fontSize: 18 },
  button: { backgroundColor: "#1a73e8", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4, marginLeft: 12 },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
