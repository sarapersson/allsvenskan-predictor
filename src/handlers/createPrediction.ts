import { docClient } from "../utils/dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { randomUUID } from "crypto";

const eventBridge = new EventBridgeClient({});

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

export const handler = async (event: any) => {
  console.log("🔄 createPrediction called");

  try {
    if (!event.body) {
      console.warn("⚠️ No request body provided");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Request body is required" }),
      };
    }

    const body = JSON.parse(event.body);
    const { matchId, predictedHome, predictedAway } = body;

    if (!matchId || predictedHome === undefined || predictedAway === undefined) {
      console.warn("⚠️ Missing required fields:", { matchId, predictedHome, predictedAway });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Missing required fields: matchId, predictedHome, predictedAway",
        }),
      };
    }

    const prediction = {
      predictionId: randomUUID(),
      matchId,
      predictedHome,
      predictedAway,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.PREDICTIONS_TABLE,
        Item: prediction,
      })
    );

    console.log(`📝 Prediction saved: ${prediction.predictionId}`);

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

    console.log(`✅ EventBridge event sent for prediction ${prediction.predictionId}`);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ message: "Prediction created", prediction }),
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
