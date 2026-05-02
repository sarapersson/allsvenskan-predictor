/**
 * components/match-card.tsx - Matchkort-komponent
 *
 * Visar en enskild match med lag, datum och omgång.
 * Beroende på matchens status visas:
 * - Kommande match utan tips: Inputfält för att tippa
 * - Kommande match med tips: Ditt tips
 * - Spelad match: Slutresultat och poäng
 *
 * Wrappas med React.memo för att undvika onödiga omrenderingar.
 */

import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Match, Prediction } from "../types";
import React from "react";

interface MatchCardProps {
  match: Match;
  prediction: Prediction | undefined;
  input: { home: string; away: string } | undefined;
  isSubmitting: boolean;
  onInputChange: (matchId: string, field: "home" | "away", value: string) => void;
  onSubmit: (matchId: string) => void;
}

function MatchCard({
  match,
  prediction,
  input,
  isSubmitting,
  onInputChange,
  onSubmit,
}: MatchCardProps) {
  const isFinished = match.homeScore !== null;

  return (
    <View style={styles.card}>
      <Text style={styles.round}>Omgång {match.round} • {match.date}</Text>
      <Text style={styles.teams}>
        {match.homeTeam} vs {match.awayTeam}
      </Text>

      {isFinished && (
        <Text style={styles.result}>
          Slutresultat: {match.homeScore} - {match.awayScore}
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
            value={input?.home || ""}
            onChangeText={(v) => onInputChange(match.matchId, "home", v)}
          />
          <Text style={styles.dash}>-</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="B"
            value={input?.away || ""}
            onChangeText={(v) => onInputChange(match.matchId, "away", v)}
          />
          <Pressable
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={() => onSubmit(match.matchId)}
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
}

export default React.memo(MatchCard);

const styles = StyleSheet.create({
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
});
