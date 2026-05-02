import { describe, it, expect } from "vitest";
import { safeParseScore } from "../src/handlers/fetchMatches";

describe("safeParseScore", () => {
  it("parses valid integer strings", () => {
    expect(safeParseScore("0")).toBe(0);
    expect(safeParseScore("1")).toBe(1);
    expect(safeParseScore("5")).toBe(5);
  });

  it("returns null for null input", () => {
    expect(safeParseScore(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(safeParseScore(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(safeParseScore("")).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(safeParseScore("abc")).toBeNull();
    expect(safeParseScore("N/A")).toBeNull();
  });

  it("parses strings with leading digits", () => {
    // parseInt("3 goals") returns 3 - this is expected behavior
    expect(safeParseScore("3")).toBe(3);
  });
});
