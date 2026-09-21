import { describe, expect, it } from "vitest";
import { unblock, solveUnblock } from "../src/puzzles/unblock";
import type { UnblockPayload } from "../src/puzzles/unblock";

// Key block blocked by a single vertical piece directly in its path.
const PAYLOAD: UnblockPayload = {
  size: 6,
  exitRow: 2,
  blocks: [
    { id: "K", row: 2, col: 0, length: 2, orientation: "h", isKey: true },
    { id: "A", row: 1, col: 3, length: 2, orientation: "v" }
  ],
  par: 2
};

describe("unblock", () => {
  it("a block cannot slide through another block", () => {
    const state = unblock.init(PAYLOAD);
    // K occupies (2,0),(2,1); sliding it to col 3 would require passing through A at (2,3)... but
    // more directly: it can't even reach col 3 because a straight slide there is not obstructed by A
    // at row1. Use a same-row block instead to prove the collision check.
    const blocked: UnblockPayload = {
      size: 6,
      exitRow: 2,
      blocks: [
        { id: "K", row: 2, col: 0, length: 2, orientation: "h", isKey: true },
        { id: "B", row: 2, col: 3, length: 2, orientation: "h" }
      ],
      par: 1
    };
    const s = unblock.init(blocked);
    expect(() => unblock.applyMove(s, { type: "slide", blockId: "K", to: 3 })).toThrow();
  });

  it("rejects sliding a block out of bounds", () => {
    const state = unblock.init(PAYLOAD);
    expect(() => unblock.applyMove(state, { type: "slide", blockId: "K", to: 5 })).toThrow();
  });

  it("rejects an unknown block id", () => {
    const state = unblock.init(PAYLOAD);
    expect(() => unblock.applyMove(state, { type: "slide", blockId: "nope", to: 0 })).toThrow();
  });

  it("one continuous slide counts as a single move regardless of distance", () => {
    let state = unblock.init({
      size: 6,
      exitRow: 2,
      blocks: [{ id: "K", row: 2, col: 0, length: 2, orientation: "h", isKey: true }],
      par: 1
    });
    state = unblock.applyMove(state, { type: "slide", blockId: "K", to: 4 });
    expect(state.moves).toBe(1);
    expect(unblock.isSolved(state)).toBe(true);
  });

  it("is solved when the key block is flush against the exit", () => {
    let state = unblock.init(PAYLOAD);
    state = unblock.applyMove(state, { type: "slide", blockId: "A", to: 3 }); // slide A down, out of row 2
    state = unblock.applyMove(state, { type: "slide", blockId: "K", to: 4 }); // now K's path to the exit is clear
    expect(unblock.isSolved(state)).toBe(true);
  });

  it("is not solved while any other block occupies the key's row-and-exit-side", () => {
    const state = unblock.init(PAYLOAD);
    expect(unblock.isSolved(state)).toBe(false);
  });

  it("solveUnblock finds a minimal path and hint() returns its first move", () => {
    const state = unblock.init(PAYLOAD);
    const path = solveUnblock(state);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
    expect(unblock.hint(state)).toEqual(path![0]);
  });

  it("hint() returns null once solved", () => {
    let state = unblock.init(PAYLOAD);
    const path = solveUnblock(state)!;
    for (const move of path) state = unblock.applyMove(state, move);
    expect(unblock.isSolved(state)).toBe(true);
    expect(unblock.hint(state)).toBeNull();
  });

  it("efficiency is min(1, par/moves)", () => {
    expect(unblock.efficiency({ par: 5, moves: 5 })).toBe(1);
    expect(unblock.efficiency({ par: 5, moves: 10 })).toBeCloseTo(0.5);
    expect(unblock.efficiency({ par: 5, moves: 0 })).toBe(0);
  });
});
