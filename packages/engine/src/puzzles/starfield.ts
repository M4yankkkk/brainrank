import type { PuzzleEngine } from "../types";
import { clamp } from "../scoring";

/**
 * Starfield, PRD section 8.4.
 * N x N grid divided into N colored regions; place exactly one star per
 * row, column and region; stars may not touch (incl. diagonally).
 */

export type CellMark = "empty" | "x" | "star";

export interface StarfieldPayload {
  size: number;
  /** regions[row][col] = region id, 0..size-1. Exactly `size` regions. */
  regions: number[][];
}

export interface StarfieldState {
  size: number;
  regions: number[][];
  marks: CellMark[][];
  /** Cumulative count of star placements that conflicted with an existing star at the moment they were placed. */
  wrongStars: number;
}

export type StarfieldMove = {
  type: "setMark";
  row: number;
  col: number;
  mark: CellMark;
};

export interface StarfieldResult {
  wrongStars: number;
}

function inBounds(size: number, row: number, col: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function starCells(state: StarfieldState): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      if (state.marks[r][c] === "star") cells.push([r, c]);
    }
  }
  return cells;
}

function conflictsWithExisting(state: StarfieldState, row: number, col: number): boolean {
  for (const [r, c] of starCells(state)) {
    if (r === row && c === col) continue;
    if (r === row || c === col) return true;
    if (state.regions[r][c] === state.regions[row][col]) return true;
    if (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) return true;
  }
  return false;
}

export const starfield: PuzzleEngine<StarfieldPayload, StarfieldState, StarfieldMove, StarfieldResult> = {
  id: "starfield",
  weights: { wE: 0.3, wT: 0.7 },

  init(payload) {
    const { size, regions } = payload;
    return {
      size,
      regions,
      marks: Array.from({ length: size }, () => Array<CellMark>(size).fill("empty")),
      wrongStars: 0
    };
  },

  applyMove(state, move) {
    if (!inBounds(state.size, move.row, move.col)) {
      throw new Error(`Starfield: cell (${move.row}, ${move.col}) is out of bounds`);
    }
    const marks = state.marks.map((row) => row.slice());
    let wrongStars = state.wrongStars;

    if (move.mark === "star") {
      // Evaluate conflict against the board as it stands before placing this star.
      if (conflictsWithExisting(state, move.row, move.col)) {
        wrongStars += 1;
      }
    }

    marks[move.row][move.col] = move.mark;
    return { ...state, marks, wrongStars };
  },

  isSolved(state) {
    const { size, regions, marks } = state;
    const stars = starCells(state);
    if (stars.length !== size) return false;

    const rowCounts = new Array(size).fill(0);
    const colCounts = new Array(size).fill(0);
    const regionCounts = new Map<number, number>();
    for (const [r, c] of stars) {
      rowCounts[r]++;
      colCounts[c]++;
      const region = regions[r][c];
      regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
    }
    if (rowCounts.some((n) => n !== 1)) return false;
    if (colCounts.some((n) => n !== 1)) return false;
    if (regionCounts.size !== size || [...regionCounts.values()].some((n) => n !== 1)) return false;

    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const [r1, c1] = stars[i];
        const [r2, c2] = stars[j];
        if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) return false;
      }
    }
    void marks;
    return true;
  },

  efficiency(result) {
    return clamp(1 - 0.25 * result.wrongStars, 0, 1);
  },

  resultOf(state) {
    return { wrongStars: state.wrongStars };
  },

  hint(state) {
    if (starfield.isSolved(state)) return null;
    const solution = solveStarfield(state.size, state.regions, state.marks);
    if (!solution) return null;
    for (const [r, c] of solution) {
      if (state.marks[r][c] !== "star") {
        return { type: "setMark", row: r, col: c, mark: "star" };
      }
    }
    return null;
  }
};

/**
 * Backtracking solver: one star per row/col/region, no touching, respecting
 * cells the player has already marked "x" (excluded) or "star" (forced).
 * Starfield puzzles are generated with a guaranteed unique solution, so any
 * solution found honoring the player's current constraints is *the* hint.
 */
export function solveStarfield(
  size: number,
  regions: number[][],
  marks?: CellMark[][]
): Array<[number, number]> | null {
  const forced: Array<[number, number]> = [];
  const excluded = new Set<string>();
  if (marks) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (marks[r][c] === "star") forced.push([r, c]);
        if (marks[r][c] === "x") excluded.add(`${r},${c}`);
      }
    }
  }

  const stars: Array<[number, number]> = [];
  const usedCols = new Set<number>();
  const usedRegions = new Set<number>();

  function touchesPlaced(row: number, col: number): boolean {
    return stars.some(([r, c]) => Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1);
  }

  // Validate forced stars are mutually consistent before searching.
  for (const [r, c] of forced) {
    if (usedCols.has(c) || usedRegions.has(regions[r][c]) || touchesPlaced(r, c)) return null;
    stars.push([r, c]);
    usedCols.add(c);
    usedRegions.add(regions[r][c]);
  }

  function forcedInRow(row: number): [number, number] | undefined {
    return forced.find(([r]) => r === row);
  }

  function backtrack(row: number): boolean {
    if (row === size) return stars.length === size;

    const already = forcedInRow(row);
    if (already) return backtrack(row + 1);

    for (let col = 0; col < size; col++) {
      if (excluded.has(`${row},${col}`)) continue;
      if (usedCols.has(col)) continue;
      if (usedRegions.has(regions[row][col])) continue;
      if (touchesPlaced(row, col)) continue;

      stars.push([row, col]);
      usedCols.add(col);
      usedRegions.add(regions[row][col]);

      if (backtrack(row + 1)) return true;

      stars.pop();
      usedCols.delete(col);
      usedRegions.delete(regions[row][col]);
    }
    return false;
  }

  if (!backtrack(0)) return null;
  return stars.slice().sort((a, b) => a[0] - b[0]);
}
