import { docClient } from "../utils/dynamodb";
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { SportsDBEvent } from "../types";

interface SportsDBResponse {
  events: SportsDBEvent[] | null;
}

const LEAGUE_ID = "4347";
const SEASON = "2026";
const TOTAL_ROUNDS = 30;

export const handler = async (): Promise<void> => {
  console.log("🔄 Starting fetchMatches...");

  try {
    let totalSaved = 0;
    let failedRounds: number[] = [];
    const allMatches: any[] = [];

    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
      try {
        const url = `https://www.thesportsdb.com/api/v1/json/3/eventsround.php?id=${LEAGUE_ID}&r=${round}&s=${SEASON}`;
        const res = await fetch(url);

        if (!res.ok) {
          console.warn(`⚠️ Round ${round}: API returned ${res.status}`);
          failedRounds.push(round);
          continue;
        }

        const data = (await res.json()) as SportsDBResponse;

        if (!data.events) {
          console.log(`ℹ️ Round ${round}: No events found`);
          continue;
        }

        for (const event of data.events) {
          allMatches.push({
            matchId: event.idEvent,
            homeTeam: event.strHomeTeam,
            awayTeam: event.strAwayTeam,
            date: event.dateEvent,
            time: event.strTime,
            homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : null,
            awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : null,
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

    // BatchWrite max 25 items åt gången
    const batches = [];
    for (let i = 0; i < allMatches.length; i += 25) {
      batches.push(allMatches.slice(i, i + 25));
    }

    for (const batch of batches) {
      const result = await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [process.env.MATCHES_TABLE!]: batch.map((item) => ({
              PutRequest: { Item: item },
            })),
          },
        })
      );

      const unprocessed = result.UnprocessedItems?.[process.env.MATCHES_TABLE!];
      if (unprocessed && unprocessed.length > 0) {
        console.warn(`⚠️ ${unprocessed.length} items were not processed in batch`);
      }

      totalSaved += batch.length;
    }

    console.log(`✅ fetchMatches complete: ${totalSaved} matches saved in ${batches.length} batches`);

    if (failedRounds.length > 0) {
      console.warn(`⚠️ Failed rounds: ${failedRounds.join(", ")}`);
    }
  } catch (error) {
    console.error("❌ fetchMatches failed:", error);
    throw error;
  }
};
