/**
 * fetchMatches - Hämtar matchdata från TheSportsDB och sparar i DynamoDB
 *
 * Denna Lambda triggas av EventBridge på schema (t.ex. varje dag).
 * Den loopar igenom alla omgångar i Allsvenskan, hämtar matchdata
 * från det externa API:t och sparar i DynamoDB med BatchWrite.
 *
 * Datakälla: TheSportsDB (gratis API, max 100 requests/dag på free tier)
 */

import { docClient } from "../utils/dynamodb";
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { SportsDBEvent } from "../types";

interface SportsDBResponse {
  events: SportsDBEvent[] | null;
}

// Allsvenskan-specifika konstanter
const LEAGUE_ID = "4347";   // TheSportsDB ID för Allsvenskan
const SEASON = "2026";       // Aktuell säsong
const TOTAL_ROUNDS = 30;    // Allsvenskan har 30 omgångar
const BATCH_SIZE = 25;      // DynamoDB BatchWrite max 25 items per anrop
const MAX_RETRIES = 3;      // Max antal retry-försök

// Hjälpfunktion: fetch med exponential backoff
async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res;
    if (res.status >= 500 && attempt < retries - 1) {
      const delay = Math.pow(2, attempt) * 500;
      console.warn(`⚠️ Retry ${attempt + 1}/${retries} after ${delay}ms (status ${res.status})`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    return res; // Return non-retryable errors (4xx) or final attempt
  }
  throw new Error(`fetchWithRetry exhausted all ${retries} attempts for ${url}`);
}

// Hjälpfunktion: säker parseInt som returnerar null vid ogiltiga värden
function safeParseScore(value: string | null | undefined): number | null {
  if (value == null) return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export const handler = async () => {
  console.log("🔄 fetchMatches started", { league: LEAGUE_ID, season: SEASON, rounds: TOTAL_ROUNDS });

  // Validera att miljövariabler finns
  if (!process.env.MATCHES_TABLE) {
    console.error("❌ Missing environment variable: MATCHES_TABLE");
    throw new Error("Missing required environment variable: MATCHES_TABLE");
  }

  try {
    const allMatches: any[] = [];
    const failedRounds: number[] = [];

    // --- Steg 1: Hämta matchdata från API för varje omgång ---
    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
      try {
        const url = `https://www.thesportsdb.com/api/v1/json/3/eventsround.php?id=${LEAGUE_ID}&r=${round}&s=${SEASON}`;
        const res = await fetchWithRetry(url);

        // API svarade med felkod efter alla retries
        if (!res.ok) {
          console.warn(`⚠️ Round ${round}: API returned ${res.status} after retries`);
          failedRounds.push(round);
          continue;
        }

        const data = (await res.json()) as SportsDBResponse;

        // Omgången har inga matcher (kan hända för framtida omgångar)
        if (!data.events) {
          continue;
        }

        // Mappa API-data till vårt format
        for (const event of data.events) {
          allMatches.push({
            matchId: event.idEvent,
            homeTeam: event.strHomeTeam,
            awayTeam: event.strAwayTeam,
            date: event.dateEvent,
            time: event.strTime,
            homeScore: safeParseScore(event.intHomeScore),
            awayScore: safeParseScore(event.intAwayScore),
            status: event.strStatus,
            round: event.intRound,
            venue: event.strVenue,
          });
        }
      } catch (roundError) {
        console.error(`❌ Round ${round} failed:`, roundError);
        failedRounds.push(round);
      }
    }

    console.log(`📊 Fetched ${allMatches.length} matches from API (${failedRounds.length} rounds failed)`);

    // Om inga matcher hämtades alls - något är fel
    if (allMatches.length === 0) {
      throw new Error("No matches fetched from API - possible API outage or config error");
    }

    // --- Steg 2: Spara i DynamoDB med BatchWrite (max 25 per anrop) ---
    let totalSaved = 0;
    let unprocessedTotal = 0;

    const batches = [];
    for (let i = 0; i < allMatches.length; i += BATCH_SIZE) {
      batches.push(allMatches.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      try {
        let itemsToWrite = batch.map((item) => ({
          PutRequest: { Item: item },
        }));

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          const result = await docClient.send(
            new BatchWriteCommand({
              RequestItems: {
                [process.env.MATCHES_TABLE]: itemsToWrite,
              },
            })
          );

          // Kolla om DynamoDB inte hann bearbeta alla items
          const unprocessed = result.UnprocessedItems?.[process.env.MATCHES_TABLE];
          if (!unprocessed || unprocessed.length === 0) {
            totalSaved += itemsToWrite.length;
            break;
          }

          // Retry unprocessed items med backoff
          totalSaved += itemsToWrite.length - unprocessed.length;
          itemsToWrite = unprocessed as typeof itemsToWrite;

          if (attempt < MAX_RETRIES - 1) {
            const delay = Math.pow(2, attempt) * 200;
            console.warn(`⚠️ ${unprocessed.length} unprocessed items, retrying in ${delay}ms`);
            await new Promise((r) => setTimeout(r, delay));
          } else {
            console.warn(`⚠️ ${unprocessed.length} items still unprocessed after ${MAX_RETRIES} attempts`);
            unprocessedTotal += unprocessed.length;
          }
        }
      } catch (batchError) {
        console.error(`❌ BatchWrite failed for ${batch.length} items:`, batchError);
        unprocessedTotal += batch.length;
      }
    }

    // --- Steg 3: Sammanfattning ---
    const summary = {
      fetched: allMatches.length,
      saved: totalSaved,
      unprocessed: unprocessedTotal,
      failedRounds,
    };

    console.log("✅ fetchMatches complete:", summary);

    // Om för många fel, markera Lambda som failed
    if (failedRounds.length > TOTAL_ROUNDS / 2) {
      throw new Error(`Too many failed rounds (${failedRounds.length}/${TOTAL_ROUNDS}) - possible API issue`);
    }

    if (unprocessedTotal > 0) {
      throw new Error(`${unprocessedTotal} items failed to save to DynamoDB`);
    }

    return summary;
  } catch (error) {
    console.error("❌ fetchMatches failed:", error);
    throw error;
  }
};
