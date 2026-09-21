"use client";

import { useRef, useState } from "react";
import { apiFetch, ApiError } from "./apiClient";
import type { AttemptResult } from "../components/puzzle/PuzzleResult";

export interface SubmitAttemptBody {
  moveLog: unknown[];
  activeTimeMs: number;
  hintsUsed: number;
  pauseCount: number;
}

/**
 * Submits a finished attempt and holds the real outcome - including a real
 * failure. A failed request must never be presented as "you scored 0": that
 * silently tells a player who actually solved the puzzle that they didn't,
 * with no way to tell the two apart or retry.
 */
export function useAttemptSubmit() {
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const lastArgs = useRef<{ puzzleId: string; body: SubmitAttemptBody } | null>(null);

  async function submit(puzzleId: string, body: SubmitAttemptBody) {
    lastArgs.current = { puzzleId, body };
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch<AttemptResult>(`/puzzles/${puzzleId}/attempts`, {
        method: "POST",
        body: JSON.stringify(body)
      });
      setResult(res);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `Couldn't save your result: ${err.message}`
          : "Couldn't reach the server to save your result. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    if (lastArgs.current) submit(lastArgs.current.puzzleId, lastArgs.current.body);
  }

  return { result, error, submitting, submit, retry };
}
