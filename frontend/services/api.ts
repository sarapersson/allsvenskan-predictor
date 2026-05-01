/**
 * services/api.ts - API-kommunikation med backend
 *
 * Centraliserad modul för alla HTTP-anrop mot Allsvenskan Predictor API.
 * Hanterar autentisering (API-nyckel), felhantering och typade responses.
 *
 * Alla funktioner:
 * - Kastar Error vid misslyckade anrop (icke-2xx responses)
 * - Loggar request/response för debugging
 * - Returnerar typade objekt
 */

import { Match, Prediction } from "../types";

// --- Konfiguration ---
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || "";

// --- API Response-typer (hur backend faktiskt svarar) ---
interface MatchesResponse {
  matches: Match[];
}

interface PredictionsResponse {
  predictions: Prediction[];
}

/**
 * Generisk fetch-wrapper med felhantering och loggning
 *
 * Varför en wrapper?
 * - Undviker duplicering av headers, felhantering och loggning
 * - Ger konsekvent beteende för alla API-anrop
 * - Gör det enkelt att lägga till t.ex. retry-logik senare
 */
const apiRequest = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const method = options?.method || "GET";
  console.log(`🌐 API ${method} ${endpoint}`);

  if (!BASE_URL) {
    throw new Error("❌ EXPO_PUBLIC_API_URL saknas i miljövariabler");
  }
  if (!API_KEY) {
    throw new Error("❌ EXPO_PUBLIC_API_KEY saknas i miljövariabler");
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`❌ API ${method} ${endpoint} failed:`, {
        status: res.status,
        body: errorBody,
      });
      throw new Error(
        `API-fel ${res.status}: ${errorBody || res.statusText}`
      );
    }

    const data = await res.json();
    console.log(`✅ API ${method} ${endpoint} succeeded`);
    return data as T;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Network request failed") {
      console.error(`❌ Nätverksfel: Kunde inte nå ${BASE_URL}${endpoint}`);
      throw new Error(
        "Kunde inte ansluta till servern. Kontrollera din internetanslutning."
      );
    }
    throw error;
  }
};

// --- Publika API-funktioner ---

/**
 * Hämta alla matcher
 * Packar upp { matches: [...] } och returnerar ren array
 */
export const getMatches = async (): Promise<Match[]> => {
  const data = await apiRequest<MatchesResponse>("/matches");
  console.log(`📊 Hämtade ${data.matches.length} matcher`);
  return data.matches;
};

/**
 * Hämta alla tips
 * Packar upp { predictions: [...] } och returnerar ren array
 */
export const getPredictions = async (): Promise<Prediction[]> => {
  const data = await apiRequest<PredictionsResponse>("/predictions");
  console.log(`🎯 Hämtade ${data.predictions.length} tips`);
  return data.predictions;
};

/**
 * Skapa ett nytt tips för en match
 * Validerar input innan anrop skickas.
 */
export const createPrediction = async (
  matchId: string,
  predictedHome: number,
  predictedAway: number
): Promise<Prediction> => {
  if (!matchId) {
    throw new Error("matchId krävs för att skapa ett tips");
  }
  if (predictedHome < 0 || predictedAway < 0) {
    throw new Error("Antal mål kan inte vara negativt");
  }
  if (!Number.isInteger(predictedHome) || !Number.isInteger(predictedAway)) {
    throw new Error("Antal mål måste vara heltal");
  }

  console.log(`📝 Skapar tips: Match ${matchId}, ${predictedHome}-${predictedAway}`);

  const prediction = await apiRequest<Prediction>("/predictions", {
    method: "POST",
    body: JSON.stringify({ matchId, predictedHome, predictedAway }),
  });

  console.log(`✅ Tips skapat: ${prediction.predictionId}`);
  return prediction;
};
