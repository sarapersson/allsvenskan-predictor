/**
 * Authorizer - Validerar API-nycklar för alla inkommande requests
 *
 * Denna Lambda-funktion körs INNAN själva endpoint-handlern.
 * Den kontrollerar att requesten innehåller en giltig API-nyckel
 * i headern "x-api-key".
 *
 * Returnerar { isAuthorized: true/false } till API Gateway.
 */

export const handler = async (event: any) => {
  console.log("🔐 Authorizer called", {
    path: event.rawPath || "unknown",
    method: event.requestContext?.http?.method || "unknown",
  });

  // Hämta den giltiga nyckeln från miljövariabler (sätts i serverless.yml)
  const validKey = process.env.API_KEY;

  // Säkerhetskoll: Om API_KEY inte är konfigurerad i miljön, neka alla requests
  if (!validKey) {
    console.error("❌ API_KEY environment variable is not set - denying all requests");
    return { isAuthorized: false };
  }

  // Hämta API-nyckeln från request-headern
  const apiKey = event.headers?.["x-api-key"];

  // Fall 1: Ingen API-nyckel skickades med
  if (!apiKey) {
    console.warn("⚠️ Denied: No API key provided");
    return { isAuthorized: false };
  }

  // Fall 2: Nyckeln matchar - ge åtkomst
  if (apiKey === validKey) {
    console.log("✅ Authorized");
    return { isAuthorized: true };
  }

  // Fall 3: Felaktig nyckel - neka åtkomst
  console.warn("⚠️ Denied: Invalid API key");
  return { isAuthorized: false };
};
