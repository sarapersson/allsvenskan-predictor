/**
 * Types - Centrala TypeScript-interfaces för frontend
 *
 * Alla delade typer definieras här för konsekvent datastruktur
 * genom hela frontend-applikationen.
 * Matchar backend-modellerna i DynamoDB.
 */

// ============================================================
// Datamodeller (matchar backend DynamoDB-tabeller)
// ============================================================

/**
 * Match - En Allsvenskan-match
 *
 * homeScore/awayScore är null tills matchen är spelad.
 */
export interface Match {
  matchId: string;          // Unikt ID från TheSportsDB
  homeTeam: string;         // Hemmalag (t.ex. "Malmö FF")
  awayTeam: string;         // Bortalag (t.ex. "AIK")
  date: string;             // Matchdatum (t.ex. "2026-04-05")
  time: string;             // Avsparkstid (t.ex. "19:00:00")
  homeScore: number | null; // Hemmamål (null om ej spelad)
  awayScore: number | null; // Bortamål (null om ej spelad)
  status: string;           // Matchstatus (t.ex. "Match Finished", "Not Started")
  round: string;            // Omgång (t.ex. "1", "30")
  venue: string;            // Arena (t.ex. "Eleda Stadion")
}

/**
 * Prediction - Ett användartips
 *
 * Poängsystem: 3p = exakt rätt, 1p = rätt utfall, 0p = fel
 */
export interface Prediction {
  predictionId: string;     // Unikt UUID
  matchId: string;          // Referens till Match.matchId
  predictedHome: number;    // Tippat antal hemmamål
  predictedAway: number;    // Tippat antal bortamål
  scored: boolean;          // Om tipset har poängberäknats
  points?: number;          // Beräknad poäng (0, 1, eller 3)
  createdAt: string;        // ISO-timestamp när tipset skapades
}

// ============================================================
// API-hjälptyper
// ============================================================

/**
 * ApiError - Felformat från backend
 */
export interface ApiError {
  statusCode: number;       // HTTP-statuskod
  message: string;          // Felbeskrivning
}
