"use client";

import { useRouter } from "next/navigation";
import type { PuzzleId } from "../PuzzleCard";

export interface AttemptResult {
  solved: boolean;
  points: number;
  breakdown: { efficiency: number; time: number; hintPenalty: number; rawPoints: number };
}

const NEXT: Record<PuzzleId, PuzzleId | null> = {
  starfield: "shiftword",
  shiftword: "unblock",
  unblock: null
};

export function PuzzleResult({ type, result }: { type: PuzzleId; result: AttemptResult }) {
  const router = useRouter();
  const next = NEXT[type];

  return (
    <div className="app-shell flex min-h-screen flex-col items-center justify-center text-center" data-puzzle={type}>
      <div className="mb-2 text-5xl">{result.solved ? "🎉" : "👋"}</div>
      <h1 className="mb-1 font-display text-3xl font-extrabold tracking-tight">
        {result.solved ? `${result.points} points` : "Attempt recorded"}
      </h1>
      <p className="mb-6 text-sm font-medium text-ink-2">
        {result.solved
          ? `Efficiency ${Math.round(result.breakdown.efficiency * 100)}% · Time ${Math.round(result.breakdown.time * 100)}%${
              result.breakdown.hintPenalty > 0 ? ` · −${result.breakdown.hintPenalty} hints` : ""
            }`
          : "This puzzle wasn't solved, so it scored 0 - only one scored attempt per puzzle."}
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {next ? (
          <button
            type="button"
            onClick={() => router.push(`/puzzle/${next}`)}
            className="rounded-md bg-accent px-4 py-3 text-sm font-bold text-white shadow-play"
          >
            Next puzzle
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-md bg-accent px-4 py-3 text-sm font-bold text-white shadow-play"
          >
            Back to today
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-md border border-line bg-card px-4 py-3 text-sm font-semibold text-ink"
        >
          See group
        </button>
      </div>
    </div>
  );
}
