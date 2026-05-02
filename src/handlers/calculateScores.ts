/**
 * calculateScores - Beräknar poäng för alla obesvarade tips
 *
 * Denna Lambda triggas av ett MatchesUpdated-event från fetchMatches
 * när matcher med slutresultat har sparats i DynamoDB.
 * Den hämtar alla avslutade matcher och alla tips som inte fått poäng ännu,
 * jämför tipsen mot faktiska resultat och uppdaterar poängen i DynamoDB.
 *
 * Poängsystem:
 * - 3p = Exakt rätt resultat (t.ex. tippat 2-1, slutresultat 2-1)
 * - 1p = Rätt utgång (t.ex. tippat 2-1, slutresultat 3-0 = hemmaseger)
 * - 0p = Fel
 */

import { docClient } from "../utils/dynamodb";
import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Match, Prediction } from "../types";

/**
 * Bestämmer utgången av en match baserat på mål
 * @returns "home" (hemmaseger), "away" (bortaseger), eller "draw" (oavgjort)
 */
export const getOutcome = (home: number, away: number): string => {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
};

/**
 * Beräknar poäng för ett enskilt tips jämfört med matchresultatet
 * @returns 3 (exakt rätt), 1 (rätt utgång), eller 0 (fel)
 */
export const calculatePoints = (prediction: Prediction, match: Match): number => {
  // Matchen saknar resultat - kan inte beräkna
  if (match.homeScore === null || match.awayScore === null) return 0;

  // Exakt resultat = 3 poäng
  if (
    prediction.predictedHome === match.homeScore &&
    prediction.predictedAway === match.awayScore
  ) {
    return 3;
  }

  // Jämför utgång (hemmaseger / oavgjort / bortaseger)
  const predictedOutcome = getOutcome(prediction.predictedHome, prediction.predictedAway);
  const actualOutcome = getOutcome(match.homeScore, match.awayScore);

  // Rätt utgång (1X2) = 1 poäng
  if (predictedOutcome === actualOutcome) {
    return 1;
  }

  // Helt fel = 0 poäng
  return 0;
};

export const handler = async () => {
  console.log("🔄 calculateScores started");

  // Validera att miljövariabler finns
  if (!process.env.MATCHES_TABLE || !process.env.PREDICTIONS_TABLE) {
    console.error("❌ Missing environment variables: MATCHES_TABLE or PREDICTIONS_TABLE");
    throw new Error("Missing required environment variables");
  }

  try {
    // --- Steg 1: Hämta alla matcher från DynamoDB ---
    const matchesResult = await docClient.send(
      new ScanCommand({ TableName: process.env.MATCHES_TABLE })
    );
    const matches = (matchesResult.Items || []) as Match[];

    // Filtrera ut bara matcher som har slutresultat
    const finishedMatches = matches.filter(
      (m) => m.homeScore !== null && m.awayScore !== null
    );

    console.log(`📊 Matches: ${finishedMatches.length} finished of ${matches.length} total`);

    // Om inga matcher är klara finns inget att beräkna
    if (finishedMatches.length === 0) {
      console.log("✅ No finished matches yet, nothing to score");
      return { updated: 0, skipped: 0, errors: 0 };
    }

    // --- Steg 2: Hämta alla tips som INTE fått poäng ännu ---
    const predictionsResult = await docClient.send(
      new ScanCommand({
        TableName: process.env.PREDICTIONS_TABLE,
        FilterExpression: "scored = :false",
        ExpressionAttributeValues: {
          ":false": false,
        },
      })
    );
    const predictions = (predictionsResult.Items || []) as Prediction[];

    console.log(`🎯 Unscored predictions: ${predictions.length}`);

    // Inget att göra om alla tips redan har poäng
    if (predictions.length === 0) {
      console.log("✅ All predictions already scored");
      return { updated: 0, skipped: 0, errors: 0 };
    }

    // --- Steg 3: Loopa igenom varje tips och beräkna poäng ---
    let updated = 0;  // Tips som fick poäng
    let skipped = 0;  // Tips vars match inte är klar ännu
    let errors = 0;   // Misslyckade uppdateringar

    for (const prediction of predictions) {
      // Hitta matchande avslutad match för detta tips
      const match = finishedMatches.find((m) => m.matchId === prediction.matchId);

      // Matchen är inte klar ännu - hoppa över
      if (!match) {
        skipped++;
        continue;
      }

      try {
        const points = calculatePoints(prediction, match);

        // Uppdatera tipset med poäng och markera som beräknat
        await docClient.send(
          new UpdateCommand({
            TableName: process.env.PREDICTIONS_TABLE,
            Key: { predictionId: prediction.predictionId },
            UpdateExpression: "SET points = :points, scored = :scored",
            ExpressionAttributeValues: {
              ":points": points,
              ":scored": true,
            },
          })
        );

        updated++;
      } catch (updateError) {
        console.error(`❌ Failed to score prediction ${prediction.predictionId}:`, updateError);
        errors++;
      }
    }

    // --- Steg 4: Sammanfattning ---
    const summary = { updated, skipped, errors };
    console.log("✅ calculateScores complete:", summary);

    // Om det fanns errors, kasta fel så Lambda markeras som failed
    if (errors > 0) {
      throw new Error(
        `calculateScores finished with ${errors} errors (${updated} updated, ${skipped} skipped)`
      );
    }

    return summary;
  } catch (error) {
    console.error("❌ calculateScores failed:", error);
    throw error;
  }
};
