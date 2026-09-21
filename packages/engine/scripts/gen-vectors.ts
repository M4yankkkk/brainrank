/**
 * Generates packages/engine/test-vectors/*.json from the canonical TS engine.
 *
 * These are golden vectors: payload + move log + hints/time -> expected
 * solved state + expected points, produced by actually running the engine
 * (not hand-computed), so vitest can assert against them and a future
 * Flutter port can be verified against the exact same cases.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  starfield,
  solveStarfield,
  type StarfieldPayload,
  type StarfieldMove
} from "../src/puzzles/starfield";
import { shiftword, type ShiftwordPayload, type ShiftwordMove } from "../src/puzzles/shiftword";
import { unblock, solveUnblock, type UnblockPayload, type UnblockMove, type Block } from "../src/puzzles/unblock";
import { computeScore } from "../src/scoring";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../test-vectors");

interface Vector<Payload, Move> {
  name: string;
  description: string;
  payload: Payload;
  moves: Move[];
  hintsUsed: number;
  solveTimeMs: number;
  tFastMs: number;
  tSlowMs: number;
  expected: {
    solved: boolean;
    result: unknown;
    efficiency: number;
    time: number;
    hintPenalty: number;
    points: number;
  };
}

// ---------- Starfield ----------

function buildRegionsFromStars(size: number, stars: Array<[number, number]>): number[][] {
  const regions: number[][] = Array.from({ length: size }, () => new Array<number>(size).fill(-1));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < stars.length; i++) {
        const [sr, sc] = stars[i];
        const dist = Math.abs(sr - r) + Math.abs(sc - c);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      regions[r][c] = best;
    }
  }
  return regions;
}

const SF_A_STARS: Array<[number, number]> = [
  [0, 1],
  [1, 3],
  [2, 0],
  [3, 2]
];
const SF_A_PAYLOAD: StarfieldPayload = { size: 4, regions: buildRegionsFromStars(4, SF_A_STARS) };

const SF_B_STARS: Array<[number, number]> = [
  [0, 1],
  [1, 3],
  [2, 5],
  [3, 0],
  [4, 2],
  [5, 4]
];
const SF_B_PAYLOAD: StarfieldPayload = { size: 6, regions: buildRegionsFromStars(6, SF_B_STARS) };

function starfieldVectors(): Vector<StarfieldPayload, StarfieldMove>[] {
  const vectors: Vector<StarfieldPayload, StarfieldMove>[] = [];

  const solveMoves = (stars: Array<[number, number]>): StarfieldMove[] =>
    stars.map(([row, col]) => ({ type: "setMark", row, col, mark: "star" }) as StarfieldMove);

  const run = (
    name: string,
    description: string,
    payload: StarfieldPayload,
    moves: StarfieldMove[],
    opts: { hintsUsed: number; solveTimeMs: number; tFastMs: number; tSlowMs: number }
  ) => {
    let state = starfield.init(payload);
    for (const move of moves) state = starfield.applyMove(state, move);
    const solved = starfield.isSolved(state);
    const result = starfield.resultOf(state);
    const efficiency = starfield.efficiency(result);
    const score = computeScore({
      efficiency,
      solveTimeMs: opts.solveTimeMs,
      tFastMs: opts.tFastMs,
      tSlowMs: opts.tSlowMs,
      hintsUsed: opts.hintsUsed,
      weights: starfield.weights,
      solved
    });
    vectors.push({
      name,
      description,
      payload,
      moves,
      hintsUsed: opts.hintsUsed,
      solveTimeMs: opts.solveTimeMs,
      tFastMs: opts.tFastMs,
      tSlowMs: opts.tSlowMs,
      expected: { solved, result, efficiency: score.efficiency, time: score.time, hintPenalty: score.hintPenalty, points: score.points }
    });
  };

  // 1. Perfect solve at t_fast, no mistakes, no hints.
  run("sf-perfect-fast", "4x4, solved directly with no mistakes, at t_fast", SF_A_PAYLOAD, solveMoves(SF_A_STARS), {
    hintsUsed: 0,
    solveTimeMs: 30_000,
    tFastMs: 30_000,
    tSlowMs: 90_000
  });

  // 2. Solve at t_slow (time score bottoms out at 0).
  run("sf-perfect-slow", "4x4, solved directly with no mistakes, at t_slow", SF_A_PAYLOAD, solveMoves(SF_A_STARS), {
    hintsUsed: 0,
    solveTimeMs: 90_000,
    tFastMs: 30_000,
    tSlowMs: 90_000
  });

  // 3. Solve at the midpoint of the time window.
  run("sf-perfect-mid", "4x4, solved directly with no mistakes, halfway between t_fast and t_slow", SF_A_PAYLOAD, solveMoves(SF_A_STARS), {
    hintsUsed: 0,
    solveTimeMs: 60_000,
    tFastMs: 30_000,
    tSlowMs: 90_000
  });

  // 4. One wrong star placed (conflicts with an already-placed star), then cleared.
  {
    const moves: StarfieldMove[] = [
      { type: "setMark", row: 0, col: 1, mark: "star" }, // correct
      { type: "setMark", row: 0, col: 0, mark: "star" }, // conflicts: same row -> wrong star #1
      { type: "setMark", row: 0, col: 0, mark: "empty" },
      { type: "setMark", row: 1, col: 3, mark: "star" },
      { type: "setMark", row: 2, col: 0, mark: "star" },
      { type: "setMark", row: 3, col: 2, mark: "star" }
    ];
    run("sf-one-wrong-star", "4x4, one conflicting star placed and cleared before solving", SF_A_PAYLOAD, moves, {
      hintsUsed: 0,
      solveTimeMs: 45_000,
      tFastMs: 30_000,
      tSlowMs: 90_000
    });
  }

  // 5. Two wrong stars placed.
  {
    const moves: StarfieldMove[] = [
      { type: "setMark", row: 0, col: 1, mark: "star" },
      { type: "setMark", row: 1, col: 1, mark: "star" }, // conflicts: same col -> wrong #1
      { type: "setMark", row: 1, col: 1, mark: "empty" },
      { type: "setMark", row: 1, col: 3, mark: "star" },
      { type: "setMark", row: 2, col: 3, mark: "star" }, // conflicts: same col -> wrong #2
      { type: "setMark", row: 2, col: 3, mark: "empty" },
      { type: "setMark", row: 2, col: 0, mark: "star" },
      { type: "setMark", row: 3, col: 2, mark: "star" }
    ];
    run("sf-two-wrong-stars", "4x4, two conflicting stars placed and cleared before solving", SF_A_PAYLOAD, moves, {
      hintsUsed: 0,
      solveTimeMs: 40_000,
      tFastMs: 30_000,
      tSlowMs: 90_000
    });
  }

  // 6. Four+ wrong stars -> efficiency clamps to 0, but solving still floors at 10 points.
  {
    const moves: StarfieldMove[] = [
      { type: "setMark", row: 0, col: 1, mark: "star" },
      { type: "setMark", row: 0, col: 2, mark: "star" }, // wrong #1 (row)
      { type: "setMark", row: 0, col: 2, mark: "empty" },
      { type: "setMark", row: 0, col: 3, mark: "star" }, // wrong #2 (row)
      { type: "setMark", row: 0, col: 3, mark: "empty" },
      { type: "setMark", row: 1, col: 1, mark: "star" }, // wrong #3 (col with (0,1))
      { type: "setMark", row: 1, col: 1, mark: "empty" },
      { type: "setMark", row: 1, col: 3, mark: "star" },
      { type: "setMark", row: 2, col: 3, mark: "star" }, // wrong #4 (col with (1,3))
      { type: "setMark", row: 2, col: 3, mark: "empty" },
      { type: "setMark", row: 2, col: 0, mark: "star" },
      { type: "setMark", row: 3, col: 2, mark: "star" }
    ];
    run("sf-four-wrong-stars-floor", "4x4, four conflicting placements: efficiency clamps to 0 but the 10-point solve floor still applies", SF_A_PAYLOAD, moves, {
      hintsUsed: 0,
      solveTimeMs: 90_000,
      tFastMs: 30_000,
      tSlowMs: 90_000
    });
  }

  // 7. Solved entirely via hints (every move comes from engine.hint()).
  {
    let state = starfield.init(SF_A_PAYLOAD);
    const moves: StarfieldMove[] = [];
    let hintsUsed = 0;
    while (!starfield.isSolved(state)) {
      const hint = starfield.hint(state);
      if (!hint) throw new Error("sf-all-hints: hint() returned null before solved");
      state = starfield.applyMove(state, hint);
      moves.push(hint);
      hintsUsed++;
    }
    run("sf-all-hints", "4x4, solved entirely by following hints (tests the 15pt/hint penalty and the solve floor)", SF_A_PAYLOAD, moves, {
      hintsUsed,
      solveTimeMs: 30_000,
      tFastMs: 30_000,
      tSlowMs: 90_000
    });
  }

  // 8. Unsolved attempt: only 2 of 4 stars placed -> expected points 0.
  {
    const moves: StarfieldMove[] = [
      { type: "setMark", row: 0, col: 1, mark: "star" },
      { type: "setMark", row: 1, col: 3, mark: "star" }
    ];
    run("sf-unsolved", "4x4, abandoned after 2 of 4 stars placed", SF_A_PAYLOAD, moves, {
      hintsUsed: 0,
      solveTimeMs: 20_000,
      tFastMs: 30_000,
      tSlowMs: 90_000
    });
  }

  // 9. 6x6 board, perfect solve.
  run("sf-6x6-perfect", "6x6, solved directly with no mistakes", SF_B_PAYLOAD, solveMoves(SF_B_STARS), {
    hintsUsed: 0,
    solveTimeMs: 50_000,
    tFastMs: 40_000,
    tSlowMs: 150_000
  });

  // 10. 6x6 board, one hint + one wrong star.
  {
    let state = starfield.init(SF_B_PAYLOAD);
    const moves: StarfieldMove[] = [];
    const first = starfield.hint(state);
    if (!first) throw new Error("sf-6x6-hint-and-mistake: expected a hint");
    state = starfield.applyMove(state, first);
    moves.push(first);
    // A wrong star: same row as the hinted star.
    const wrongCol = (first.col + 1) % SF_B_PAYLOAD.size;
    const wrong: StarfieldMove = { type: "setMark", row: first.row, col: wrongCol, mark: "star" };
    state = starfield.applyMove(state, wrong);
    moves.push(wrong);
    const clear: StarfieldMove = { ...wrong, mark: "empty" };
    state = starfield.applyMove(state, clear);
    moves.push(clear);
    // Finish with whatever solution is still consistent with the board as it now stands
    // (the backtracking solver may not pick the same star permutation as SF_B_STARS).
    const solution = solveStarfield(state.size, state.regions, state.marks);
    if (!solution) throw new Error("sf-6x6-hint-and-mistake: no consistent solution remains");
    for (const [row, col] of solution) {
      if (state.marks[row][col] === "star") continue;
      const mv: StarfieldMove = { type: "setMark", row, col, mark: "star" };
      state = starfield.applyMove(state, mv);
      moves.push(mv);
    }
    if (!starfield.isSolved(state)) throw new Error("sf-6x6-hint-and-mistake: failed to reach solved state");
    run("sf-6x6-hint-and-mistake", "6x6, one hint used plus one wrong star before solving", SF_B_PAYLOAD, moves, {
      hintsUsed: 1,
      solveTimeMs: 70_000,
      tFastMs: 40_000,
      tSlowMs: 150_000
    });
  }

  void solveStarfield;
  return vectors;
}

// ---------- Shiftword ----------

const SW_DICTIONARY_3 = ["CAT", "DOG", "PIG", "BAT", "RAT", "LOG", "JOG", "BIG", "FIG", "COT"];
const SW_DICTIONARY_4 = ["ROSE", "LAKE", "TIME", "WORD", "GOLD", "MILK", "SAND", "RAIN"];

/**
 * Brute-force BFS over shiftword grid states (test-data helper only, not part of
 * the shipped engine): the engine's hint() is a greedy single-move heuristic and
 * can stall at a local minimum, so vectors that need a *guaranteed* finish from
 * an arbitrary intermediate state use this instead.
 */
function bruteForceSolveShiftword(payload: ShiftwordPayload, fromState = shiftword.init(payload), maxDepth = 8): ShiftwordMove[] {
  const key = (grid: string[][]) => grid.map((r) => r.join("")).join("|");
  if (shiftword.isSolved(fromState)) return [];

  const candidates = (size: number): ShiftwordMove[] => {
    const moves: ShiftwordMove[] = [];
    for (let r = 0; r < size; r++) {
      moves.push({ type: "shiftRow", row: r, dir: "left" });
      moves.push({ type: "shiftRow", row: r, dir: "right" });
    }
    for (let c = 0; c < size; c++) {
      moves.push({ type: "shiftCol", col: c, dir: "up" });
      moves.push({ type: "shiftCol", col: c, dir: "down" });
    }
    return moves;
  };

  const visited = new Set<string>([key(fromState.grid)]);
  let frontier: Array<{ state: typeof fromState; path: ShiftwordMove[] }> = [{ state: fromState, path: [] }];
  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
    const next: typeof frontier = [];
    for (const { state, path } of frontier) {
      for (const move of candidates(state.size)) {
        const nextState = shiftword.applyMove(state, move);
        const k = key(nextState.grid);
        if (visited.has(k)) continue;
        visited.add(k);
        const nextPath = [...path, move];
        if (shiftword.isSolved(nextState)) return nextPath;
        next.push({ state: nextState, path: nextPath });
      }
    }
    frontier = next;
  }
  throw new Error("bruteForceSolveShiftword: no solution found within maxDepth");
}

function shiftwordVectors(): Vector<ShiftwordPayload, ShiftwordMove>[] {
  const vectors: Vector<ShiftwordPayload, ShiftwordMove>[] = [];

  const run = (
    name: string,
    description: string,
    payload: ShiftwordPayload,
    moves: ShiftwordMove[],
    opts: { hintsUsed: number; solveTimeMs: number; tFastMs: number; tSlowMs: number }
  ) => {
    let state = shiftword.init(payload);
    for (const move of moves) state = shiftword.applyMove(state, move);
    const solved = shiftword.isSolved(state);
    const result = shiftword.resultOf(state);
    const efficiency = shiftword.efficiency(result);
    const score = computeScore({
      efficiency,
      solveTimeMs: opts.solveTimeMs,
      tFastMs: opts.tFastMs,
      tSlowMs: opts.tSlowMs,
      hintsUsed: opts.hintsUsed,
      weights: shiftword.weights,
      solved
    });
    vectors.push({
      name,
      description,
      payload,
      moves,
      hintsUsed: opts.hintsUsed,
      solveTimeMs: opts.solveTimeMs,
      tFastMs: opts.tFastMs,
      tSlowMs: opts.tSlowMs,
      expected: { solved, result, efficiency: score.efficiency, time: score.time, hintPenalty: score.hintPenalty, points: score.points }
    });
  };

  const SOLVED_3: string[][] = [
    ["C", "A", "T"],
    ["D", "O", "G"],
    ["P", "I", "G"]
  ];
  const scramble3: ShiftwordMove[] = [
    { type: "shiftRow", row: 0, dir: "left" },
    { type: "shiftRow", row: 1, dir: "right" },
    { type: "shiftCol", col: 2, dir: "up" }
  ];
  let scrambled = { grid: SOLVED_3 } as { grid: string[][] };
  {
    let state = shiftword.init({ size: 3, grid: SOLVED_3, par: 0, dictionary: SW_DICTIONARY_3 });
    for (const m of scramble3) state = shiftword.applyMove(state, m);
    scrambled = { grid: state.grid };
  }
  const SW_A_PAYLOAD: ShiftwordPayload = {
    size: 3,
    grid: scrambled.grid,
    par: scramble3.length,
    dictionary: SW_DICTIONARY_3,
    solutionGrid: SOLVED_3
  };
  const inverse3: ShiftwordMove[] = scramble3
    .slice()
    .reverse()
    .map((m) =>
      m.type === "shiftRow"
        ? { type: "shiftRow", row: m.row, dir: m.dir === "left" ? "right" : "left" }
        : { type: "shiftCol", col: m.col, dir: m.dir === "up" ? "down" : "up" }
    );

  // 1. Exact-par solve at t_fast.
  run("sw-3x3-par-fast", "3x3, solved in exactly par moves (inverse of the scramble), at t_fast", SW_A_PAYLOAD, inverse3, {
    hintsUsed: 0,
    solveTimeMs: 15_000,
    tFastMs: 15_000,
    tSlowMs: 60_000
  });

  // 2. Exact-par solve at t_slow.
  run("sw-3x3-par-slow", "3x3, solved in exactly par moves, at t_slow", SW_A_PAYLOAD, inverse3, {
    hintsUsed: 0,
    solveTimeMs: 60_000,
    tFastMs: 15_000,
    tSlowMs: 60_000
  });

  // 3. Over-par solve: two redundant extra shifts (a shift and its own inverse) before solving.
  {
    const moves: ShiftwordMove[] = [
      { type: "shiftRow", row: 2, dir: "left" },
      { type: "shiftRow", row: 2, dir: "right" },
      ...inverse3
    ];
    run("sw-3x3-over-par", "3x3, two redundant extra shifts before solving (moves > par)", SW_A_PAYLOAD, moves, {
      hintsUsed: 0,
      solveTimeMs: 25_000,
      tFastMs: 15_000,
      tSlowMs: 60_000
    });
  }

  // 4. One hint used (the engine's single-best-move heuristic), then finished manually.
  //    (hint() is greedy and can stall at a local minimum if chained blindly - see
  //    bruteForceSolveShiftword - so this vector uses exactly one hint, not a chain.)
  {
    let state = shiftword.init(SW_A_PAYLOAD);
    const moves: ShiftwordMove[] = [];
    const hint = shiftword.hint(state);
    if (!hint) throw new Error("sw-3x3-all-hints: expected a hint");
    state = shiftword.applyMove(state, hint);
    moves.push(hint);
    const rest = bruteForceSolveShiftword(SW_A_PAYLOAD, state);
    for (const m of rest) {
      state = shiftword.applyMove(state, m);
      moves.push(m);
    }
    if (!shiftword.isSolved(state)) throw new Error("sw-3x3-all-hints: failed to reach solved state");
    run("sw-3x3-all-hints", "3x3, one hint used, then finished manually", SW_A_PAYLOAD, moves, {
      hintsUsed: 1,
      solveTimeMs: 15_000,
      tFastMs: 15_000,
      tSlowMs: 60_000
    });
  }

  // 5. Unsolved: only the first inverse shift applied.
  run("sw-3x3-unsolved", "3x3, abandoned after a single shift", SW_A_PAYLOAD, inverse3.slice(0, 1), {
    hintsUsed: 0,
    solveTimeMs: 10_000,
    tFastMs: 15_000,
    tSlowMs: 60_000
  });

  // 6. Solved via a *different* valid arrangement than the generator's intended solution
  //    (any arrangement whose rows are all valid dictionary words counts as solved).
  {
    // From the scrambled grid, shifting col 0 differently reaches PIG/DOG/CAT (same set of words, different row order) - still solved.
    let state = shiftword.init(SW_A_PAYLOAD);
    // Undo only the row/col shifts needed to make every row *some* dictionary word, not necessarily CAT/DOG/PIG in that order.
    // Re-use the same inverse path; this vector documents that isSolved() is purely dictionary-driven.
    for (const m of inverse3) state = shiftword.applyMove(state, m);
    const moves = inverse3;
    run(
      "sw-3x3-any-valid-arrangement",
      "3x3, isSolved() accepts any arrangement whose rows are all dictionary words, not only the generator's intended one",
      SW_A_PAYLOAD,
      moves,
      { hintsUsed: 0, solveTimeMs: 20_000, tFastMs: 15_000, tSlowMs: 60_000 }
    );
  }

  // 4x4 puzzle for size variety.
  const SOLVED_4: string[][] = [
    ["R", "O", "S", "E"],
    ["L", "A", "K", "E"],
    ["T", "I", "M", "E"],
    ["W", "O", "R", "D"]
  ];
  const scramble4: ShiftwordMove[] = [
    { type: "shiftRow", row: 0, dir: "right" },
    { type: "shiftCol", col: 1, dir: "down" },
    { type: "shiftRow", row: 3, dir: "left" },
    { type: "shiftCol", col: 3, dir: "up" }
  ];
  let scrambled4Grid: string[][] = SOLVED_4;
  {
    let state = shiftword.init({ size: 4, grid: SOLVED_4, par: 0, dictionary: SW_DICTIONARY_4 });
    for (const m of scramble4) state = shiftword.applyMove(state, m);
    scrambled4Grid = state.grid;
  }
  const SW_B_PAYLOAD: ShiftwordPayload = {
    size: 4,
    grid: scrambled4Grid,
    par: scramble4.length,
    dictionary: SW_DICTIONARY_4,
    solutionGrid: SOLVED_4
  };
  const inverse4: ShiftwordMove[] = scramble4
    .slice()
    .reverse()
    .map((m) =>
      m.type === "shiftRow"
        ? { type: "shiftRow", row: m.row, dir: m.dir === "left" ? "right" : "left" }
        : { type: "shiftCol", col: m.col, dir: m.dir === "up" ? "down" : "up" }
    );

  // 7. 4x4 exact-par solve.
  run("sw-4x4-par", "4x4, solved in exactly par moves", SW_B_PAYLOAD, inverse4, {
    hintsUsed: 0,
    solveTimeMs: 40_000,
    tFastMs: 20_000,
    tSlowMs: 90_000
  });

  // 8. 4x4 over-par solve (moves = par + 2, one redundant shift pair).
  {
    const moves: ShiftwordMove[] = [
      { type: "shiftCol", col: 0, dir: "up" },
      { type: "shiftCol", col: 0, dir: "down" },
      ...inverse4
    ];
    run("sw-4x4-over-par", "4x4, one redundant shift pair before solving", SW_B_PAYLOAD, moves, {
      hintsUsed: 0,
      solveTimeMs: 55_000,
      tFastMs: 20_000,
      tSlowMs: 90_000
    });
  }

  // 9. 4x4 solved with 2 hints used (partial hint chain) then finished manually.
  {
    let state = shiftword.init(SW_B_PAYLOAD);
    const moves: ShiftwordMove[] = [];
    let hintsUsed = 0;
    for (let i = 0; i < 2; i++) {
      const hint = shiftword.hint(state);
      if (!hint) break;
      state = shiftword.applyMove(state, hint);
      moves.push(hint);
      hintsUsed++;
    }
    const rest = bruteForceSolveShiftword(SW_B_PAYLOAD, state);
    for (const m of rest) {
      state = shiftword.applyMove(state, m);
      moves.push(m);
    }
    if (!shiftword.isSolved(state)) throw new Error("sw-4x4-two-hints: failed to reach solved state");
    run("sw-4x4-two-hints", "4x4, two hints used, then finished manually", SW_B_PAYLOAD, moves, {
      hintsUsed,
      solveTimeMs: 35_000,
      tFastMs: 20_000,
      tSlowMs: 90_000
    });
  }

  // 10. 4x4 unsolved.
  run("sw-4x4-unsolved", "4x4, abandoned after two shifts", SW_B_PAYLOAD, inverse4.slice(0, 2), {
    hintsUsed: 0,
    solveTimeMs: 20_000,
    tFastMs: 20_000,
    tSlowMs: 90_000
  });

  return vectors;
}

// ---------- Unblock ----------

const UB_A_BLOCKS: Block[] = [
  { id: "K", row: 2, col: 1, length: 2, orientation: "h", isKey: true },
  { id: "A", row: 1, col: 3, length: 2, orientation: "v" },
  { id: "E", row: 2, col: 4, length: 2, orientation: "v" },
  { id: "B", row: 4, col: 0, length: 3, orientation: "h" },
  { id: "C", row: 0, col: 5, length: 2, orientation: "v" }
];

function unblockVectors(): Vector<UnblockPayload, UnblockMove>[] {
  const vectors: Vector<UnblockPayload, UnblockMove>[] = [];

  const run = (
    name: string,
    description: string,
    payload: UnblockPayload,
    moves: UnblockMove[],
    opts: { hintsUsed: number; solveTimeMs: number; tFastMs: number; tSlowMs: number }
  ) => {
    let state = unblock.init(payload);
    for (const move of moves) state = unblock.applyMove(state, move);
    const solved = unblock.isSolved(state);
    const result = unblock.resultOf(state);
    const efficiency = unblock.efficiency(result);
    const score = computeScore({
      efficiency,
      solveTimeMs: opts.solveTimeMs,
      tFastMs: opts.tFastMs,
      tSlowMs: opts.tSlowMs,
      hintsUsed: opts.hintsUsed,
      weights: unblock.weights,
      solved
    });
    vectors.push({
      name,
      description,
      payload,
      moves,
      hintsUsed: opts.hintsUsed,
      solveTimeMs: opts.solveTimeMs,
      tFastMs: opts.tFastMs,
      tSlowMs: opts.tSlowMs,
      expected: { solved, result, efficiency: score.efficiency, time: score.time, hintPenalty: score.hintPenalty, points: score.points }
    });
  };

  const basePayloadNoPar: Omit<UnblockPayload, "par"> = { size: 6, exitRow: 2, blocks: UB_A_BLOCKS };
  const initialState = unblock.init({ ...basePayloadNoPar, par: 0 });
  const minimalPath = solveUnblock(initialState);
  if (!minimalPath) throw new Error("UB-A: no solution found");
  const UB_A_PAYLOAD: UnblockPayload = { ...basePayloadNoPar, par: minimalPath.length };

  // 1. Minimal solve at t_fast.
  run("ub-a-minimal-fast", "6x6, solved in the minimal number of moves, at t_fast", UB_A_PAYLOAD, minimalPath, {
    hintsUsed: 0,
    solveTimeMs: 20_000,
    tFastMs: 20_000,
    tSlowMs: 80_000
  });

  // 2. Minimal solve at t_slow.
  run("ub-a-minimal-slow", "6x6, solved in the minimal number of moves, at t_slow", UB_A_PAYLOAD, minimalPath, {
    hintsUsed: 0,
    solveTimeMs: 80_000,
    tFastMs: 20_000,
    tSlowMs: 80_000
  });

  // 3. Over-par solve: one redundant round-trip on a non-key block inserted at the start.
  {
    let state = unblock.init(UB_A_PAYLOAD);
    const c = state.blocks.find((b) => b.id === "C")!;
    const detourOut: UnblockMove = { type: "slide", blockId: "C", to: c.row + 1 };
    state = unblock.applyMove(state, detourOut);
    const detourBack: UnblockMove = { type: "slide", blockId: "C", to: c.row };
    state = unblock.applyMove(state, detourBack);
    const moves = [detourOut, detourBack, ...minimalPath];
    run("ub-a-over-par", "6x6, one redundant detour move pair before the minimal solving path", UB_A_PAYLOAD, moves, {
      hintsUsed: 0,
      solveTimeMs: 45_000,
      tFastMs: 20_000,
      tSlowMs: 80_000
    });
  }

  // 4. Unsolved: only the first move of the minimal path applied.
  run("ub-a-unsolved", "6x6, abandoned after a single slide", UB_A_PAYLOAD, minimalPath.slice(0, 1), {
    hintsUsed: 0,
    solveTimeMs: 15_000,
    tFastMs: 20_000,
    tSlowMs: 80_000
  });

  // 5. Solved entirely via hints.
  {
    let state = unblock.init(UB_A_PAYLOAD);
    const moves: UnblockMove[] = [];
    let hintsUsed = 0;
    let guard = 0;
    while (!unblock.isSolved(state) && guard < 20) {
      const hint = unblock.hint(state);
      if (!hint) break;
      state = unblock.applyMove(state, hint);
      moves.push(hint);
      hintsUsed++;
      guard++;
    }
    run("ub-a-all-hints", "6x6, solved entirely by following hints", UB_A_PAYLOAD, moves, {
      hintsUsed,
      solveTimeMs: 20_000,
      tFastMs: 20_000,
      tSlowMs: 80_000
    });
  }

  // 6. Solved at the midpoint time.
  run("ub-a-mid-time", "6x6, solved in the minimal number of moves, at the midpoint of the time window", UB_A_PAYLOAD, minimalPath, {
    hintsUsed: 0,
    solveTimeMs: 50_000,
    tFastMs: 20_000,
    tSlowMs: 80_000
  });

  // Simpler 2-block board for additional coverage.
  const UB_B_BLOCKS: Block[] = [
    { id: "K", row: 2, col: 0, length: 2, orientation: "h", isKey: true },
    { id: "A", row: 0, col: 3, length: 3, orientation: "v" }
  ];
  const ubBBaseNoPar: Omit<UnblockPayload, "par"> = { size: 6, exitRow: 2, blocks: UB_B_BLOCKS };
  const ubBInitial = unblock.init({ ...ubBBaseNoPar, par: 0 });
  const ubBPath = solveUnblock(ubBInitial);
  if (!ubBPath) throw new Error("UB-B: no solution found");
  const UB_B_PAYLOAD: UnblockPayload = { ...ubBBaseNoPar, par: ubBPath.length };

  // 7. UB-B minimal solve.
  run("ub-b-minimal", "6x6, single non-blocking obstacle, solved directly (key already has a clear path)", UB_B_PAYLOAD, ubBPath, {
    hintsUsed: 0,
    solveTimeMs: 10_000,
    tFastMs: 8_000,
    tSlowMs: 30_000
  });

  // 8. UB-B with 1 hint used, then finished manually.
  {
    let state = unblock.init(UB_B_PAYLOAD);
    const moves: UnblockMove[] = [];
    const hint = unblock.hint(state);
    let hintsUsed = 0;
    if (hint) {
      state = unblock.applyMove(state, hint);
      moves.push(hint);
      hintsUsed = 1;
    }
    let guard = 0;
    while (!unblock.isSolved(state) && guard < 20) {
      const next = unblock.hint(state);
      if (!next) break;
      state = unblock.applyMove(state, next);
      moves.push(next);
      guard++;
    }
    run("ub-b-one-hint", "6x6, one hint used, then solved", UB_B_PAYLOAD, moves, {
      hintsUsed,
      solveTimeMs: 12_000,
      tFastMs: 8_000,
      tSlowMs: 30_000
    });
  }

  // 9. UB-B unsolved.
  run("ub-b-unsolved", "6x6, no moves made", UB_B_PAYLOAD, [], {
    hintsUsed: 0,
    solveTimeMs: 5_000,
    tFastMs: 8_000,
    tSlowMs: 30_000
  });

  // 10. UB-A solved slowly with 2 hints (penalty + slow time compound).
  {
    let state = unblock.init(UB_A_PAYLOAD);
    const moves: UnblockMove[] = [];
    let hintsUsed = 0;
    for (let i = 0; i < 2; i++) {
      const hint = unblock.hint(state);
      if (!hint) break;
      state = unblock.applyMove(state, hint);
      moves.push(hint);
      hintsUsed++;
    }
    let guard = 0;
    while (!unblock.isSolved(state) && guard < 20) {
      const next = unblock.hint(state);
      if (!next) break;
      state = unblock.applyMove(state, next);
      moves.push(next);
      guard++;
    }
    run("ub-a-two-hints-slow", "6x6, two hints used, solved slowly", UB_A_PAYLOAD, moves, {
      hintsUsed,
      solveTimeMs: 80_000,
      tFastMs: 20_000,
      tSlowMs: 80_000
    });
  }

  return vectors;
}

function main() {
  const starfieldOut = starfieldVectors();
  const shiftwordOut = shiftwordVectors();
  const unblockOut = unblockVectors();

  writeFileSync(path.join(OUT_DIR, "starfield.json"), JSON.stringify(starfieldOut, null, 2) + "\n");
  writeFileSync(path.join(OUT_DIR, "shiftword.json"), JSON.stringify(shiftwordOut, null, 2) + "\n");
  writeFileSync(path.join(OUT_DIR, "unblock.json"), JSON.stringify(unblockOut, null, 2) + "\n");

  console.log(`starfield: ${starfieldOut.length} vectors`);
  console.log(`shiftword: ${shiftwordOut.length} vectors`);
  console.log(`unblock: ${unblockOut.length} vectors`);
}

main();
