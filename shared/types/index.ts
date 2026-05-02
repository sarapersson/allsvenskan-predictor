/**
 * Shared Types - Delade TypeScript-interfaces mellan backend och frontend
 *
 * Alla typer som används av BÅDA sidor definieras här.
 * Backend och frontend importerar härifrån för att undvika type drift.
 */

// ============================================================
// DynamoDB-modeller
// ============================================================

/**
 * Match - En Allsvenskan-match lagrad i DynamoDB
 *
 * Hämtas från TheSportsDB via fetchMatches och sparas i MATCHES_TABLE.
 * homeScore/awayScore är null tills matchen är spelad.
 */
export interface Match {
  matchId: string;          // Unikt ID från TheSportsDB (t.ex. "1234567")
  homeTeam: string;         // Hemmalag (t.ex. "Malmö FF")
  awayTeam: string;         // Bortalag (t.ex. "AIK")
  date: string;             // Matchdatum (t.ex. "2026-04-05")
  time: string;             // Avsparkstid (t.ex. "19:00:00")
  homeScore: number | null; // Hemmamål (null om matchen inte spelats)
  awayScore: number | null; // Bortamål (null om matchen inte spelats)
  status: string;           // Matchstatus (t.ex. "Match Finished", "Not Started")
  round: string;            // Omgång (t.ex. "1", "30")
  venue: string;            // Arena (t.ex. "Eleda Stadion")
}

/**
 * Prediction - Ett användartips lagrat i DynamoDB
 *
 * Skapas via createPrediction och poängsätts av calculateScores.
 * Poängsystem: 3p = exakt rätt, 1p = rätt utfall, 0p = fel
 */
export interface Prediction {
  predictionId: string;     // Unikt UUID genererat vid skapande
  matchId: string;          // Referens till matchens matchId
  predictedHome: number;    // Tippat antal hemmamål
  predictedAway: number;    // Tippat antal bortamål
  scored: boolean;          // Om tipset har poängberäknats
  points?: number;          // Beräknad poäng (0, 1, eller 3) - sätts av calculateScores
  createdAt: string;        // ISO-timestamp när tipset skapades
}
