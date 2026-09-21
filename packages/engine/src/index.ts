export type { PuzzleEngine, LoggedMove } from "./types";
export { clamp, timeScore, computeScore } from "./scoring";
export type { TimeScoreInput, ScoreInput, ScoreBreakdown } from "./scoring";

export { starfield, solveStarfield } from "./puzzles/starfield";
export type {
  StarfieldPayload,
  StarfieldState,
  StarfieldMove,
  StarfieldResult,
  CellMark
} from "./puzzles/starfield";

export { shiftword } from "./puzzles/shiftword";
export type { ShiftwordPayload, ShiftwordState, ShiftwordMove, ShiftwordResult } from "./puzzles/shiftword";

export { unblock, solveUnblock } from "./puzzles/unblock";
export type { UnblockPayload, UnblockState, UnblockMove, UnblockResult, Block, Orientation } from "./puzzles/unblock";

import type { PuzzleEngine } from "./types";
import { starfield } from "./puzzles/starfield";
import { shiftword } from "./puzzles/shiftword";
import { unblock } from "./puzzles/unblock";

/** Registry keyed by puzzle id, for generic (server-side) move-log replay. */
export const engines = {
  starfield,
  shiftword,
  unblock
} as const;

export type EnginePuzzleId = keyof typeof engines;

/**
 * Replay a full move log against a payload, the way the Edge Function does
 * for server-side validation (PRD section 13.4): the client never decides
 * the final score.
 */
export function replay<Payload, State, Move, Result>(
  engine: PuzzleEngine<Payload, State, Move, Result>,
  payload: Payload,
  moves: Move[]
): State {
  let state = engine.init(payload);
  for (const move of moves) {
    state = engine.applyMove(state, move);
  }
  return state;
}
