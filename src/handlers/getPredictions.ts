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
  console.log("🔄 getPredictions called");

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: process.env.PREDICTIONS_TABLE,
      })
    );

    console.log(`✅ Returning ${result.Count} predictions`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        predictions: result.Items,
        count: result.Count,
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
