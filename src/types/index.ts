/**
 * Types - Backend TypeScript-interfaces
 *
 * Delade typer (Match, Prediction) importeras från shared/.
 * Backend-specifika typer (SportsDBEvent) definieras här.
 */

// Re-exportera delade typer
export { Match, Prediction } from "@shared/types";

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
