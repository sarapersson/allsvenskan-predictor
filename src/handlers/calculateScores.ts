import { docClient } from "../utils/dynamodb";
import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Match, Prediction } from "../types";

interface ScoredPrediction extends Prediction {
  scored?: boolean;
}

const getOutcome = (home: number, away: number): string => {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
};

const calculatePoints = (prediction: Prediction, match: Match): number => {
  if (match.homeScore === null || match.awayScore === null) return 0;

  // Exakt resultat = 3 poäng
  if (
    prediction.predictedHome === match.homeScore &&
    prediction.predictedAway === match.awayScore
  ) {
    return 3;
  }

  const predictedOutcome = getOutcome(prediction.predictedHome, prediction.predictedAway);
  const actualOutcome = getOutcome(match.homeScore, match.awayScore);

  // Rätt utfall (1X2) = 1 poäng
  if (predictedOutcome === actualOutcome) {
    return 1;
  }

  return 0;
};

export const handler = async (): Promise<void> => {
  console.log("🔄 Starting calculateScores...");

  try {
    const matchesResult = await docClient.send(
      new ScanCommand({ TableName: process.env.MATCHES_TABLE })
    );
    const matches = (matchesResult.Items || []) as Match[];
    const finishedMatches = matches.filter(
      (m) => m.homeScore !== null && m.awayScore !== null
    );

    console.log(`📊 Found ${matches.length} total matches, ${finishedMatches.length} finished`);

    const predictionsResult = await docClient.send(
      new ScanCommand({
        TableName: process.env.PREDICTIONS_TABLE,
        FilterExpression: "attribute_not_exists(scored) OR scored = :false",
        ExpressionAttributeValues: {
          ":false": false,
        },
      })
    );
    const predictions = (predictionsResult.Items || []) as ScoredPrediction[];

    console.log(`🎯 Found ${predictions.length} unscored predictions`);

    if (predictions.length === 0) {
      console.log("✅ No predictions to score, done!");
      return;
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const prediction of predictions) {
      const match = finishedMatches.find((m) => m.matchId === prediction.matchId);

      if (!match) {
        skipped++;
        continue;
      }

      try {
        const points = calculatePoints(prediction, match);

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
        console.error(`❌ Failed to update prediction ${prediction.predictionId}:`, updateError);
        errors++;
      }
    }

    console.log(`✅ calculateScores complete: ${updated} scored, ${skipped} skipped, ${errors} errors`);
  } catch (error) {
    console.error("❌ calculateScores failed:", error);
    throw error;
  }
};
