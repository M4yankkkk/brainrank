/**
 * Scoring formula, PRD section 6.3.
 *
 *   E = efficiency score in [0, 1] (puzzle-specific)
 *   T = time score in [0, 1], clamp(1 - (t - t_fast) / (t_slow - t_fast), 0, 1)
 *   H = 15 * hintsUsed
 *   points = round(100 * (wE * E + wT * T)) - H
 *   points = max(points, 10) if solved, else 0 (Starfield/Shiftword/Unblock define no
 *            partial-credit rule for an unsolved attempt, unlike e.g. Codebreaker/Target)
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface TimeScoreInput {
  /** Active solve time in milliseconds (pauses excluded, PRD 6.2 / 13.4). */
  solveTimeMs: number;
  /** ~20th percentile reference time, in milliseconds. */
  tFastMs: number;
  /** ~90th percentile reference time, in milliseconds. */
  tSlowMs: number;
}

export function timeScore({ solveTimeMs, tFastMs, tSlowMs }: TimeScoreInput): number {
  if (tSlowMs <= tFastMs) {
    // Degenerate reference window: treat as fast/slow binary rather than dividing by zero.
    return solveTimeMs <= tFastMs ? 1 : 0;
  }
  const raw = 1 - (solveTimeMs - tFastMs) / (tSlowMs - tFastMs);
  return clamp(raw, 0, 1);
}

export interface ScoreInput extends TimeScoreInput {
  /** 0..1, from a puzzle's efficiency(result). */
  efficiency: number;
  hintsUsed: number;
  weights: { wE: number; wT: number };
  solved: boolean;
}

export interface ScoreBreakdown {
  efficiency: number;
  time: number;
  hintPenalty: number;
  /** round(100 * (wE*E + wT*T)) - H, before the solved-floor is applied. */
  rawPoints: number;
  points: number;
  solved: boolean;
}

export function computeScore(input: ScoreInput): ScoreBreakdown {
  const efficiency = clamp(input.efficiency, 0, 1);
  const time = timeScore(input);
  const hintPenalty = 15 * Math.max(0, input.hintsUsed);
  const rawPoints = Math.round(100 * (input.weights.wE * efficiency + input.weights.wT * time)) - hintPenalty;
  // Efficiency/time only mean anything once a puzzle is actually solved (moves-vs-par,
  // solve-time-vs-reference both presuppose completion). Starfield/Shiftword/Unblock
  // define no partial-credit rule for an abandoned attempt (contrast Word Ladder §8.2:
  // "If unsolved: 0 efficiency... points = 0"), so an unsolved attempt scores 0.
  const points = input.solved ? Math.max(rawPoints, 10) : 0;
  return { efficiency, time, hintPenalty, rawPoints, points, solved: input.solved };
}
