import { describe, expect, it } from "vitest";
import { clamp, computeScore, timeScore } from "../src/scoring";

describe("clamp", () => {
  it("clamps below the minimum", () => {
    expect(clamp(-5, 0, 1)).toBe(0);
  });
  it("clamps above the maximum", () => {
    expect(clamp(5, 0, 1)).toBe(1);
  });
  it("passes through values already in range", () => {
    expect(clamp(0.4, 0, 1)).toBe(0.4);
  });
});

describe("timeScore", () => {
  it("is 1 at or below t_fast", () => {
    expect(timeScore({ solveTimeMs: 10_000, tFastMs: 20_000, tSlowMs: 60_000 })).toBe(1);
    expect(timeScore({ solveTimeMs: 20_000, tFastMs: 20_000, tSlowMs: 60_000 })).toBe(1);
  });
  it("is 0 at or above t_slow", () => {
    expect(timeScore({ solveTimeMs: 60_000, tFastMs: 20_000, tSlowMs: 60_000 })).toBe(0);
    expect(timeScore({ solveTimeMs: 90_000, tFastMs: 20_000, tSlowMs: 60_000 })).toBe(0);
  });
  it("interpolates linearly between t_fast and t_slow", () => {
    expect(timeScore({ solveTimeMs: 40_000, tFastMs: 20_000, tSlowMs: 60_000 })).toBeCloseTo(0.5);
  });
  it("falls back to a fast/slow binary when the reference window is degenerate", () => {
    expect(timeScore({ solveTimeMs: 5_000, tFastMs: 10_000, tSlowMs: 10_000 })).toBe(1);
    expect(timeScore({ solveTimeMs: 15_000, tFastMs: 10_000, tSlowMs: 10_000 })).toBe(0);
  });
});

describe("computeScore", () => {
  const weights = { wE: 0.5, wT: 0.5 };

  it("gives 100 for a perfect, instant, hint-free solve", () => {
    const score = computeScore({
      efficiency: 1,
      solveTimeMs: 10_000,
      tFastMs: 10_000,
      tSlowMs: 30_000,
      hintsUsed: 0,
      weights,
      solved: true
    });
    expect(score.points).toBe(100);
  });

  it("applies a 15-point penalty per hint", () => {
    const score = computeScore({
      efficiency: 1,
      solveTimeMs: 10_000,
      tFastMs: 10_000,
      tSlowMs: 30_000,
      hintsUsed: 2,
      weights,
      solved: true
    });
    expect(score.hintPenalty).toBe(30);
    expect(score.points).toBe(70);
  });

  it("floors a solved attempt at 10 points even under heavy hint penalties", () => {
    const score = computeScore({
      efficiency: 0,
      solveTimeMs: 30_000,
      tFastMs: 10_000,
      tSlowMs: 30_000,
      hintsUsed: 5,
      weights,
      solved: true
    });
    expect(score.rawPoints).toBeLessThan(10);
    expect(score.points).toBe(10);
  });

  it("gives 0 points for an unsolved attempt regardless of efficiency/time", () => {
    const score = computeScore({
      efficiency: 1,
      solveTimeMs: 10_000,
      tFastMs: 10_000,
      tSlowMs: 30_000,
      hintsUsed: 0,
      weights,
      solved: false
    });
    expect(score.points).toBe(0);
  });

  it("rounds 100 * (wE*E + wT*T) before subtracting the hint penalty", () => {
    const score = computeScore({
      efficiency: 0.5,
      solveTimeMs: 10_000,
      tFastMs: 10_000,
      tSlowMs: 30_000,
      hintsUsed: 0,
      weights: { wE: 0.3, wT: 0.7 },
      solved: true
    });
    // 100 * (0.3*0.5 + 0.7*1) = 100 * 0.85 = 85
    expect(score.rawPoints).toBe(85);
    expect(score.points).toBe(85);
  });
});
