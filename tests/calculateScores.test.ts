import { describe, it, expect } from "vitest";
import { getOutcome, calculatePoints } from "../src/handlers/calculateScores";
import { Match, Prediction } from "../shared/types";

// Hjälpfunktion för att skapa en match
const makeMatch = (homeScore: number | null, awayScore: number | null): Match => ({
  matchId: "123",
  homeTeam: "Malmö FF",
  awayTeam: "AIK",
  date: "2026-05-01",
  time: "19:00:00",
  homeScore,
  awayScore,
  status: homeScore !== null ? "Match Finished" : "Not Started",
  round: "10",
  venue: "Eleda Stadion",
});

// Hjälpfunktion för att skapa ett tips
const makePrediction = (predictedHome: number, predictedAway: number): Prediction => ({
  predictionId: "pred-1",
  matchId: "123",
  predictedHome,
  predictedAway,
  scored: false,
  createdAt: "2026-04-30T12:00:00Z",
});

describe("getOutcome", () => {
  it("returns 'home' when home score is higher", () => {
    expect(getOutcome(2, 1)).toBe("home");
    expect(getOutcome(5, 0)).toBe("home");
  });

  it("returns 'away' when away score is higher", () => {
    expect(getOutcome(0, 1)).toBe("away");
    expect(getOutcome(1, 3)).toBe("away");
  });

  it("returns 'draw' when scores are equal", () => {
    expect(getOutcome(0, 0)).toBe("draw");
    expect(getOutcome(2, 2)).toBe("draw");
  });
});

describe("calculatePoints", () => {
  it("returns 3 for exact correct score", () => {
    const match = makeMatch(2, 1);
    const prediction = makePrediction(2, 1);
    expect(calculatePoints(prediction, match)).toBe(3);
  });

  it("returns 1 for correct outcome but wrong score (home win)", () => {
    const match = makeMatch(3, 0);
    const prediction = makePrediction(2, 1);
    expect(calculatePoints(prediction, match)).toBe(1);
  });

  it("returns 1 for correct outcome but wrong score (draw)", () => {
    const match = makeMatch(1, 1);
    const prediction = makePrediction(0, 0);
    expect(calculatePoints(prediction, match)).toBe(1);
  });

  it("returns 1 for correct outcome but wrong score (away win)", () => {
    const match = makeMatch(0, 2);
    const prediction = makePrediction(1, 3);
    expect(calculatePoints(prediction, match)).toBe(1);
  });

  it("returns 0 for completely wrong prediction", () => {
    const match = makeMatch(0, 1);
    const prediction = makePrediction(2, 0);
    expect(calculatePoints(prediction, match)).toBe(0);
  });

  it("returns 0 when match has no score yet", () => {
    const match = makeMatch(null, null);
    const prediction = makePrediction(1, 1);
    expect(calculatePoints(prediction, match)).toBe(0);
  });
});
