import { describe, expect, it } from "vitest";
import { starfield, solveStarfield } from "../src/puzzles/starfield";
import type { StarfieldPayload } from "../src/puzzles/starfield";

// Quadrant-free 4x4 layout (see gen-vectors.ts SF_A) with a known valid star permutation.
const PAYLOAD: StarfieldPayload = {
  size: 4,
  regions: [
    [0, 0, 0, 1],
    [2, 0, 1, 1],
    [2, 2, 3, 1],
    [2, 3, 3, 3]
  ]
};
const SOLUTION: Array<[number, number]> = [
  [0, 1],
  [1, 3],
  [2, 0],
  [3, 2]
];

describe("starfield", () => {
  it("rejects out-of-bounds moves", () => {
    const state = starfield.init(PAYLOAD);
    expect(() => starfield.applyMove(state, { type: "setMark", row: 4, col: 0, mark: "star" })).toThrow();
  });

  it("is not solved with fewer than N stars", () => {
    let state = starfield.init(PAYLOAD);
    state = starfield.applyMove(state, { type: "setMark", row: 0, col: 1, mark: "star" });
    expect(starfield.isSolved(state)).toBe(false);
  });

  it("is not solved when two stars share a row", () => {
    let state = starfield.init(PAYLOAD);
    state = starfield.applyMove(state, { type: "setMark", row: 0, col: 0, mark: "star" });
    state = starfield.applyMove(state, { type: "setMark", row: 0, col: 2, mark: "star" });
    state = starfield.applyMove(state, { type: "setMark", row: 2, col: 0, mark: "star" });
    state = starfield.applyMove(state, { type: "setMark", row: 3, col: 2, mark: "star" });
    expect(starfield.isSolved(state)).toBe(false);
  });

  it("is not solved when two stars touch diagonally", () => {
    // (0,0) and (1,1) touch diagonally even though rows/cols/regions could otherwise line up.
    let state = starfield.init(PAYLOAD);
    state = starfield.applyMove(state, { type: "setMark", row: 0, col: 0, mark: "star" });
    state = starfield.applyMove(state, { type: "setMark", row: 1, col: 1, mark: "star" });
    expect(starfield.isSolved(state)).toBe(false);
  });

  it("X marks never affect solved state or efficiency", () => {
    let state = starfield.init(PAYLOAD);
    for (let c = 0; c < 4; c++) {
      if (c !== 1) state = starfield.applyMove(state, { type: "setMark", row: 0, col: c, mark: "x" });
    }
    for (const [row, col] of SOLUTION) {
      state = starfield.applyMove(state, { type: "setMark", row, col, mark: "star" });
    }
    expect(starfield.isSolved(state)).toBe(true);
    expect(state.wrongStars).toBe(0);
  });

  it("hint() returns null once solved", () => {
    let state = starfield.init(PAYLOAD);
    for (const [row, col] of SOLUTION) {
      state = starfield.applyMove(state, { type: "setMark", row, col, mark: "star" });
    }
    expect(starfield.hint(state)).toBeNull();
  });

  it("hint() respects a star the player already placed correctly", () => {
    let state = starfield.init(PAYLOAD);
    state = starfield.applyMove(state, { type: "setMark", row: 0, col: 1, mark: "star" });
    const hint = starfield.hint(state);
    expect(hint).not.toBeNull();
    expect([hint!.row, hint!.col]).not.toEqual([0, 1]);
  });

  it("solveStarfield returns null when the player's marks make the board unsolvable", () => {
    const marks = Array.from({ length: 4 }, () => Array<"empty" | "x" | "star">(4).fill("empty"));
    // Two forced stars that touch diagonally can never be part of a valid solution.
    marks[0][0] = "star";
    marks[1][1] = "star";
    expect(solveStarfield(4, PAYLOAD.regions, marks)).toBeNull();
  });
});
