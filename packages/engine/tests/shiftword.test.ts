import { describe, expect, it } from "vitest";
import { shiftword } from "../src/puzzles/shiftword";
import type { ShiftwordPayload } from "../src/puzzles/shiftword";

const PAYLOAD: ShiftwordPayload = {
  size: 3,
  grid: [
    ["T", "C", "A"],
    ["O", "D", "G"],
    ["I", "P", "G"]
  ],
  par: 3,
  dictionary: ["CAT", "DOG", "PIG"]
};

describe("shiftword", () => {
  it("shiftRow wraps the trailing letter around on a left shift", () => {
    let state = shiftword.init(PAYLOAD);
    state = shiftword.applyMove(state, { type: "shiftRow", row: 0, dir: "left" });
    expect(state.grid[0]).toEqual(["C", "A", "T"]);
  });

  it("shiftRow wraps the leading letter around on a right shift", () => {
    let state = shiftword.init(PAYLOAD);
    state = shiftword.applyMove(state, { type: "shiftRow", row: 0, dir: "right" });
    expect(state.grid[0]).toEqual(["A", "T", "C"]);
  });

  it("shiftCol moves letters between rows in the same column", () => {
    let state = shiftword.init(PAYLOAD);
    state = shiftword.applyMove(state, { type: "shiftCol", col: 0, dir: "up" });
    expect(state.grid.map((r) => r[0])).toEqual(["O", "I", "T"]);
  });

  it("every move increments the move counter, including a manual undo (re-applied inverse)", () => {
    let state = shiftword.init(PAYLOAD);
    state = shiftword.applyMove(state, { type: "shiftRow", row: 0, dir: "left" });
    state = shiftword.applyMove(state, { type: "shiftRow", row: 0, dir: "right" }); // undo
    expect(state.moves).toBe(2);
    expect(state.grid).toEqual(PAYLOAD.grid);
  });

  it("isSolved accepts any dictionary arrangement, not just the intended solution", () => {
    let state = shiftword.init({ ...PAYLOAD, dictionary: ["TCA", "ODG", "IPG"] });
    // Already "solved" relative to this (contrived) dictionary without any moves.
    expect(shiftword.isSolved(state)).toBe(true);
  });

  it("rejects an out-of-bounds row", () => {
    const state = shiftword.init(PAYLOAD);
    expect(() => shiftword.applyMove(state, { type: "shiftRow", row: 5, dir: "left" })).toThrow();
  });

  it("efficiency is min(1, par/moves)", () => {
    expect(shiftword.efficiency({ par: 3, moves: 3 })).toBe(1);
    expect(shiftword.efficiency({ par: 3, moves: 6 })).toBeCloseTo(0.5);
    expect(shiftword.efficiency({ par: 3, moves: 1 })).toBe(1); // clamped, not >1
    expect(shiftword.efficiency({ par: 3, moves: 0 })).toBe(0);
  });

  it("hint() returns null without a solutionGrid", () => {
    const state = shiftword.init(PAYLOAD); // no solutionGrid provided
    expect(shiftword.hint(state)).toBeNull();
  });

  it("hint() returns null once solved", () => {
    const solutionGrid = [
      ["C", "A", "T"],
      ["D", "O", "G"],
      ["P", "I", "G"]
    ];
    // Start already at the solution - isSolved() only cares about the current grid,
    // not how it was reached, so this exercises hint()'s solved short-circuit directly.
    const state = shiftword.init({ ...PAYLOAD, grid: solutionGrid, solutionGrid });
    expect(shiftword.isSolved(state)).toBe(true);
    expect(shiftword.hint(state)).toBeNull();
  });
});
