"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./apiClient";
import { todayLocalDate } from "./localDate";
import type { PuzzleId } from "../components/PuzzleCard";

export interface PuzzleOfTheDay<Payload = unknown> {
  id: string;
  type: PuzzleId;
  difficulty: "easy" | "medium" | "hard" | "weekend";
  payload: Payload;
  par: number | null;
  tFastMs: number;
  tSlowMs: number;
  weights: { wE: number; wT: number };
  attempt: { solved: boolean; points: number; hintsUsed: number; activeTimeMs: number } | null;
}

interface TodayResponse {
  date: string;
  puzzles: PuzzleOfTheDay[];
}

export function usePuzzleOfTheDay<Payload = unknown>(type: PuzzleId) {
  const [puzzle, setPuzzle] = useState<PuzzleOfTheDay<Payload> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<TodayResponse>(`/puzzles/today?date=${todayLocalDate()}`)
      .then((res) => {
        if (cancelled) return;
        const match = res.puzzles.find((p) => p.type === type) as PuzzleOfTheDay<Payload> | undefined;
        if (!match) {
          setError(`No ${type} puzzle in today's set`);
          return;
        }
        setPuzzle(match);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Failed to load puzzle"));
    return () => {
      cancelled = true;
    };
  }, [type]);

  return { puzzle, error };
}
