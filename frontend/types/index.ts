/**
 * Types - Frontend TypeScript-interfaces
 *
 * Delade typer (Match, Prediction) importeras från shared/.
 * Frontend-specifika typer (ApiError) definieras här.
 */

// Re-exportera delade typer
export { Match, Prediction } from "@shared/types";

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
