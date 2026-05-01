import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { docClient } from "../utils/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log("🔄 getMatches called");

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: process.env.MATCHES_TABLE,
      })
    );

    console.log(`✅ Returning ${result.Count} matches`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        matches: result.Items,
        count: result.Count,
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
