/**
 * getMatches - Hämtar alla matcher från DynamoDB
 *
 * Denna Lambda triggas av GET /matches via API Gateway.
 * Den returnerar alla matcher sorterade efter datum.
 * Hanterar DynamoDB-paginering om datan överstiger 1 MB.
 *
 * Response:
 * {
 *   "matches": [...],
 *   "count": 240
 * }
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { docClient } from "../utils/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Match } from "../types";

// CORS-headers som krävs för frontend-anrop
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log("🔄 getMatches called", {
    path: event.rawPath || "unknown",
    method: event.requestContext?.http?.method || "unknown",
  });

  // Validera att miljövariabler finns
  if (!process.env.MATCHES_TABLE) {
    console.error("❌ Missing environment variable: MATCHES_TABLE");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Server configuration error" }),
    };
  }

  try {
    // Hämta ALLA matcher med paginering (DynamoDB returnerar max 1 MB per Scan)
    const allMatches: Match[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const result = await docClient.send(
        new ScanCommand({
          TableName: process.env.MATCHES_TABLE,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );

      const items = (result.Items || []) as Match[];
      allMatches.push(...items);

      // Om LastEvaluatedKey finns betyder det att det finns mer data att hämta
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Sortera matcher efter datum (äldst först)
    const sortedMatches = allMatches.sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      return dateA.localeCompare(dateB);
    });

    console.log(`✅ Returning ${sortedMatches.length} matches`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        matches: sortedMatches,
        count: sortedMatches.length,
      }),
    };
  } catch (error) {
    console.error("❌ getMatches failed:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Failed to fetch matches" }),
    };
  }
};
