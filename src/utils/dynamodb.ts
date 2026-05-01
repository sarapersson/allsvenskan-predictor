/**
 * DynamoDB Client - Delad DynamoDB Document Client för alla handlers
 *
 * Skapas en gång per Lambda cold start och återanvänds mellan anrop.
 * Document Client konverterar automatiskt mellan JavaScript-objekt
 * och DynamoDB:s interna attributformat (AttributeValue).
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Konfigurera DynamoDB-klienten
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-north-1",
});

// Document Client med förnuftiga marshalling-inställningar
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Ta bort undefined-fält istället för att kasta error
  },
});
