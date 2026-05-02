/**
 * getPredictions - Hämtar alla tips från DynamoDB
 *
 * Denna Lambda triggas av GET /predictions via API Gateway.
 * Den returnerar alla tips sorterade efter skapelsedatum (nyast först).
 * Hanterar DynamoDB-paginering om datan överstiger 1 MB.
 *
 * Response:
 * {
 *   "predictions": [...],
 *   "count": 50
 * }
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { docClient } from "../utils/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Prediction } from "../types";

// Headers hanteras av API Gateway CORS-config i serverless.yml
const headers = {
  "Content-Type": "application/json",
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log("🔄 getPredictions called", {
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
    // Hämta ALLA tips med paginering (DynamoDB returnerar max 1 MB per Scan)
    const allPredictions: Prediction[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const result = await docClient.send(
        new ScanCommand({
          TableName: process.env.PREDICTIONS_TABLE,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );

      const items = (result.Items || []) as Prediction[];
      allPredictions.push(...items);

      // Om LastEvaluatedKey finns betyder det att det finns mer data att hämta
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Sortera tips efter skapelsedatum (nyast först)
    const sortedPredictions = allPredictions.sort((a, b) => {
      const dateA = a.createdAt || "";
      const dateB = b.createdAt || "";
      return dateB.localeCompare(dateA);
    });

    console.log(`✅ Returning ${sortedPredictions.length} predictions`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        predictions: sortedPredictions,
        count: sortedPredictions.length,
      }),
    };
  } catch (error) {
    console.error("❌ getPredictions failed:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Failed to fetch predictions" }),
    };
  }
};
