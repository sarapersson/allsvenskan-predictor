/**
 * createPrediction - Skapar ett nytt tips för en match
 *
 * Denna Lambda triggas av POST /predictions via API Gateway.
 * Den validerar input, sparar tipset i DynamoDB och skickar
 * ett event till EventBridge så att andra tjänster (t.ex. logPrediction)
 * kan reagera på det nya tipset.
 *
 * Förväntat request body:
 * {
 *   "matchId": "abc123",
 *   "predictedHome": 2,
 *   "predictedAway": 1
 * }
 */

import { docClient } from "../utils/dynamodb";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { randomUUID } from "crypto";

const eventBridge = new EventBridgeClient({});

// Headers hanteras av API Gateway CORS-config i serverless.yml
const headers = {
  "Content-Type": "application/json",
};

export const handler = async (event: any) => {
  console.log("🔄 createPrediction called", {
    path: event.rawPath || "unknown",
    method: event.requestContext?.http?.method || "unknown",
  });

  // Validera att miljövariabler finns
  if (!process.env.PREDICTIONS_TABLE) {
    console.error("❌ Missing environment variable: PREDICTIONS_TABLE");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Server configuration error" }),
    };
  }

  try {
    // --- Steg 1: Validera att request body finns ---
    if (!event.body) {
      console.warn("⚠️ Denied: No request body provided");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Request body is required" }),
      };
    }

    // --- Steg 2: Parsa och validera fälten ---
    let body: any;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      console.warn("⚠️ Denied: Invalid JSON in request body");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Invalid JSON in request body" }),
      };
    }

    const { matchId, predictedHome, predictedAway } = body;

    if (!matchId || predictedHome === undefined || predictedAway === undefined) {
      console.warn("⚠️ Denied: Missing required fields", { matchId, predictedHome, predictedAway });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Missing required fields: matchId, predictedHome, predictedAway",
        }),
      };
    }

    // Validera att matchId är en rimlig sträng
    if (typeof matchId !== "string" || matchId.length === 0 || matchId.length > 50) {
      console.warn("⚠️ Denied: Invalid matchId", { matchId });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "matchId must be a string (max 50 characters)" }),
      };
    }

    // Validera att poängen är rimliga tal
    if (
      !Number.isInteger(predictedHome) || !Number.isInteger(predictedAway) ||
      predictedHome < 0 || predictedAway < 0 ||
      predictedHome > 99 || predictedAway > 99
    ) {
      console.warn("⚠️ Denied: Invalid score values", { predictedHome, predictedAway });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "predictedHome and predictedAway must be integers between 0-99",
        }),
      };
    }

    // --- Steg 3: Kolla om det redan finns ett tips för denna match ---
    const existing = await docClient.send(
      new QueryCommand({
        TableName: process.env.PREDICTIONS_TABLE,
        IndexName: "matchId-index",
        KeyConditionExpression: "matchId = :matchId",
        ExpressionAttributeValues: { ":matchId": matchId },
        Limit: 1,
      })
    );

    if (existing.Items && existing.Items.length > 0) {
      console.warn(`⚠️ Denied: Prediction already exists for match ${matchId}`);
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ message: "A prediction already exists for this match" }),
      };
    }

    // --- Steg 4: Skapa och spara tipset i DynamoDB ---
    const prediction = {
      predictionId: randomUUID(),
      matchId,
      predictedHome,
      predictedAway,
      scored: false,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.PREDICTIONS_TABLE,
        Item: prediction,
      })
    );

    console.log(`📝 Prediction saved: ${prediction.predictionId} (match: ${matchId}, tip: ${predictedHome}-${predictedAway})`);

    // --- Steg 5: Skicka event till EventBridge ---
    try {
      await eventBridge.send(
        new PutEventsCommand({
          Entries: [
            {
              Source: "allsvenskan.predictions",
              DetailType: "PredictionCreated",
              EventBusName: "allsvenskan-prediction-bus",
              Detail: JSON.stringify(prediction),
            },
          ],
        })
      );

      console.log(`📣 EventBridge event sent: PredictionCreated`);
    } catch (eventError) {
      // EventBridge-fel ska INTE hindra responsen – tipset är redan sparat
      console.error("⚠️ EventBridge send failed (prediction still saved):", eventError);
    }

    // --- Steg 6: Returnera framgångsrikt svar ---
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(prediction),
    };
  } catch (error) {
    console.error("❌ createPrediction failed:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Failed to create prediction" }),
    };
  }
};
