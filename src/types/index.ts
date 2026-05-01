/**
 * Types - Centrala TypeScript-interfaces för hela projektet
 *
 * Alla delade typer definieras här för konsekvent datastruktur
 * genom hela backend-applikationen.
 */

// ============================================================
// DynamoDB-modeller (hur data lagras i våra tabeller)
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

// ============================================================
// Externa API-typer (TheSportsDB response-format)
// ============================================================

/**
 * SportsDBEvent - Rå matchdata från TheSportsDB API
 *
 * Detta är formatet vi får från API:t. Vi mappar om det till
 * vårt Match-interface i fetchMatches innan det sparas.
 *
 * Notera: Alla värden är strängar från API:t (även siffror).
 */
export interface SportsDBEvent {
  idEvent: string;              // Match-ID
  strHomeTeam: string;          // Hemmalag
  strAwayTeam: string;          // Bortalag
  dateEvent: string;            // Datum (YYYY-MM-DD)
  strTime: string;              // Tid (HH:MM:SS)
  intHomeScore: string | null;  // Hemmamål som sträng (null om ej spelad)
  intAwayScore: string | null;  // Bortamål som sträng (null om ej spelad)
  strStatus: string;            // Status
  intRound: string;             // Omgång som sträng
  strVenue: string;             // Arena
}
