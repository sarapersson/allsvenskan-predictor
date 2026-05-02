/**
 * components/score-summary.tsx - Poängsammanfattning
 *
 * Visar totalpoäng och statistik: antal bedömda matcher,
 * exakta rätt, rätt utgång (1X2) och missar.
 */

import { View, Text, StyleSheet } from "react-native";
import { Prediction } from "../types";

interface ScoreSummaryProps {
  predictions: Prediction[];
}

export default function ScoreSummary({ predictions }: ScoreSummaryProps) {
  const totalPoints = predictions.reduce((sum, p) => sum + (p.points || 0), 0);
  const scored = predictions.filter((p) => p.points !== undefined);
  const exact = scored.filter((p) => p.points === 3).length;
  const correct1X2 = scored.filter((p) => p.points === 1).length;
  const misses = scored.filter((p) => p.points === 0).length;

  return (
    <View>
      <Text style={styles.score}>🏆 Totalpoäng: {totalPoints}p</Text>
      <Text style={styles.scoreSubtitle}>
        Tippa resultatet på varje match.{"\n"}
        Exakt rätt resultat = 3p • Rätt utgång (1/X/2) = 1p • Fel = 0p{"\n"}
        {scored.length} matcher bedömda • {exact} exakta • {correct1X2} rätt utgång • {misses} miss
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  score: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
  scoreSubtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
});
