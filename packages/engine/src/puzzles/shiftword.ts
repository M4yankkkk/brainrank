import type { PuzzleEngine } from "../types";

/**
 * Shiftword, PRD section 8.1.
 * N x N grid of letters; swiping a row shifts it left/right (wrapping),
 * swiping a column shifts it up/down (wrapping). Solved when every row
 * reads as a valid word — any arrangement of valid words counts, not
 * only the one used to generate the puzzle.
 */

export interface ShiftwordPayload {
  size: number;
  /** grid[row][col], single uppercase letters. */
  grid: string[][];
  /** Minimum number of shifts to reach a solved state, computed at generation time. */
  par: number;
  /** Valid words (uppercase, length === size) for this puzzle's row-length; any of these completes a row. */
  dictionary: string[];
  /** Optional known-solved arrangement, used only to compute hints. */
  solutionGrid?: string[][];
}

export interface ShiftwordState {
  size: number;
  grid: string[][];
  par: number;
  dictionary: Set<string>;
  solutionGrid?: string[][];
  moves: number;
}

export type ShiftwordMove =
  | { type: "shiftRow"; row: number; dir: "left" | "right" }
  | { type: "shiftCol"; col: number; dir: "up" | "down" };

export interface ShiftwordResult {
  par: number;
  moves: number;
}

function shiftArray<T>(arr: T[], dir: "left" | "right" | "up" | "down"): T[] {
  if (arr.length === 0) return arr;
  if (dir === "left" || dir === "up") {
    return [...arr.slice(1), arr[0]];
  }
  return [arr[arr.length - 1], ...arr.slice(0, -1)];
}

function shiftRow(grid: string[][], row: number, dir: "left" | "right"): string[][] {
  const next = grid.map((r) => r.slice());
  next[row] = shiftArray(grid[row], dir);
  return next;
}

function shiftCol(grid: string[][], col: number, dir: "up" | "down"): string[][] {
  const size = grid.length;
  const column = grid.map((r) => r[col]);
  const shifted = shiftArray(column, dir);
  const next = grid.map((r) => r.slice());
  for (let r = 0; r < size; r++) next[r][col] = shifted[r];
  return next;
}

function hammingDistance(a: string[][], b: string[][]): number {
  let d = 0;
  for (let r = 0; r < a.length; r++) {
    for (let c = 0; c < a[r].length; c++) {
      if (a[r][c] !== b[r][c]) d++;
    }
  }
  return d;
}

export const shiftword: PuzzleEngine<ShiftwordPayload, ShiftwordState, ShiftwordMove, ShiftwordResult> = {
  id: "shiftword",
  weights: { wE: 0.6, wT: 0.4 },

  init(payload) {
    return {
      size: payload.size,
      grid: payload.grid.map((row) => row.slice()),
      par: payload.par,
      dictionary: new Set(payload.dictionary.map((w) => w.toUpperCase())),
      solutionGrid: payload.solutionGrid?.map((row) => row.slice()),
      moves: 0
    };
  },

  applyMove(state, move) {
    let grid: string[][];
    if (move.type === "shiftRow") {
      if (move.row < 0 || move.row >= state.size) {
        throw new Error(`Shiftword: row ${move.row} out of bounds`);
      }
      grid = shiftRow(state.grid, move.row, move.dir);
    } else {
      if (move.col < 0 || move.col >= state.size) {
        throw new Error(`Shiftword: col ${move.col} out of bounds`);
      }
      grid = shiftCol(state.grid, move.col, move.dir);
    }
    return { ...state, grid, moves: state.moves + 1 };
  },

  isSolved(state) {
    return state.grid.every((row) => state.dictionary.has(row.join("")));
  },

  efficiency(result) {
    if (result.moves <= 0) return 0;
    return Math.min(1, result.par / result.moves);
  },

  resultOf(state) {
    return { par: state.par, moves: state.moves };
  },

  hint(state) {
    if (shiftword.isSolved(state) || !state.solutionGrid) return null;

    const candidates: ShiftwordMove[] = [];
    for (let r = 0; r < state.size; r++) {
      candidates.push({ type: "shiftRow", row: r, dir: "left" });
      candidates.push({ type: "shiftRow", row: r, dir: "right" });
    }
    for (let c = 0; c < state.size; c++) {
      candidates.push({ type: "shiftCol", col: c, dir: "up" });
      candidates.push({ type: "shiftCol", col: c, dir: "down" });
    }

    const currentDistance = hammingDistance(state.grid, state.solutionGrid);
    let best: { move: ShiftwordMove; distance: number } | null = null;
    for (const move of candidates) {
      const nextGrid =
        move.type === "shiftRow" ? shiftRow(state.grid, move.row, move.dir) : shiftCol(state.grid, move.col, move.dir);
      const distance = hammingDistance(nextGrid, state.solutionGrid);
      if (distance < currentDistance && (!best || distance < best.distance)) {
        best = { move, distance };
      }
    }
    return best?.move ?? null;
  }
};
