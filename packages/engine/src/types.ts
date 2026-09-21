/**
 * Common puzzle interface, PRD section 13.2.
 *
 * Pure TypeScript, no DOM/Node/browser APIs, no dependencies — must run
 * identically in the browser, in Vitest, and inside a Supabase Edge
 * Function (Deno) so the server can replay a move log to validate and
 * score an attempt (PRD section 13.4).
 */
export interface PuzzleEngine<Payload, State, Move, Result> {
  /** "starfield" | "shiftword" | "unblock" | ... */
  readonly id: string;

  /** Per-puzzle scoring weights, PRD section 6.3 ("Each puzzle defines its own weights wE and wT"). */
  readonly weights: { wE: number; wT: number };

  /** Build the initial board state from the stored puzzle payload (puzzles.payload in the data model). */
  init(payload: Payload): State;

  /** Apply one move, returning a new state. Throws if the move is illegal (used by server-side replay validation). */
  applyMove(state: State, move: Move): State;

  /** True once the board satisfies the puzzle's win condition. */
  isSolved(state: State): boolean;

  /** Efficiency score in [0, 1], PRD section 6.3, computed from puzzle-specific result data. */
  efficiency(result: Result): number;

  /** Extract the Result the puzzle needs for efficiency() out of a (solved) state. */
  resultOf(state: State): Result;

  /** One helpful next move, or null if none is available (e.g. already solved). */
  hint(state: State): Move | null;
}

/** A single recorded move plus the wall-clock offset it was made at, for server-side replay. */
export interface LoggedMove<Move> {
  move: Move;
  atMs: number;
}
