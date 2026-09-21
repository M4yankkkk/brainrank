"use client";

import { useMemo, useState } from "react";
import { starfield, type StarfieldPayload, type StarfieldState, type StarfieldMove, type CellMark } from "@brainrank/engine";

import { apiFetch } from "../../lib/apiClient";
import { useActiveTimer } from "../../lib/useActiveTimer";
import { usePuzzleOfTheDay } from "../../lib/usePuzzleOfTheDay";
import { PuzzleFrame } from "./PuzzleFrame";
import { PuzzleResult, type AttemptResult } from "./PuzzleResult";

const REGION_PALETTE = ["#B9A8FF", "#9D86F7", "#CFC3FF", "#8A70F0", "#DCD3FF", "#C4B5FF", "#A895F9", "#E2D9FF", "#7E62F0"];

function nextMark(mark: CellMark): CellMark {
  if (mark === "empty") return "x";
  if (mark === "x") return "star";
  return "empty";
}

export function StarfieldPuzzle() {
  const { puzzle, error } = usePuzzleOfTheDay<StarfieldPayload>("starfield");
  const { elapsedMs, finish } = useActiveTimer();

  const [history, setHistory] = useState<Array<{ state: StarfieldState; move: StarfieldMove; wasHint: boolean }>>([]);
  const [state, setState] = useState<StarfieldState | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const board = state ?? (puzzle ? starfield.init(puzzle.payload) : null);

  const starCount = useMemo(() => {
    if (!board) return 0;
    return board.marks.flat().filter((m) => m === "star").length;
  }, [board]);

  async function submit(finalState: StarfieldState, finalHintsUsed: number, moveLog: StarfieldMove[]) {
    if (!puzzle || submitting) return;
    setSubmitting(true);
    const solved = starfield.isSolved(finalState);
    const { activeTimeMs, pauseCount } = finish();
    try {
      const res = await apiFetch<AttemptResult>(`/puzzles/${puzzle.id}/attempts`, {
        method: "POST",
        body: JSON.stringify({ moveLog, activeTimeMs, hintsUsed: finalHintsUsed, pauseCount })
      });
      setResult(res);
    } catch {
      setResult({ solved, points: 0, breakdown: { efficiency: 0, time: 0, hintPenalty: 0, rawPoints: 0 } });
    }
  }

  function applyMove(move: StarfieldMove, wasHint: boolean) {
    if (!puzzle || !board || result) return;
    const next = starfield.applyMove(board, move);
    setHistory((h) => [...h, { state: next, move, wasHint }]);
    setState(next);
    if (wasHint) setHintsUsed((n) => n + 1);
    if (starfield.isSolved(next)) {
      submit(
        next,
        wasHint ? hintsUsed + 1 : hintsUsed,
        history.map((h) => h.move).concat(move)
      );
    }
  }

  function handleCellClick(row: number, col: number) {
    if (!board) return;
    applyMove({ type: "setMark", row, col, mark: nextMark(board.marks[row][col]) }, false);
  }

  function handleUndo() {
    if (history.length === 0) return;
    const remaining = history.slice(0, -1);
    setHistory(remaining);
    const last = remaining.at(-1);
    setState(last ? last.state : puzzle ? starfield.init(puzzle.payload) : null);
    if (history.at(-1)?.wasHint) setHintsUsed((n) => Math.max(0, n - 1));
  }

  function handleHint() {
    if (!board) return;
    const hint = starfield.hint(board);
    if (hint) applyMove(hint, true);
  }

  if (error) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-sm font-medium text-ink-2">{error}</div>
    );
  }
  if (result) return <PuzzleResult type="starfield" result={result} />;
  if (!puzzle || !board) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-sm font-medium text-ink-2">Loading…</div>
    );
  }

  return (
    <PuzzleFrame
      type="starfield"
      elapsedMs={elapsedMs}
      counterLabel={`${starCount} of ${board.size} stars`}
      onUndo={handleUndo}
      undoDisabled={history.length === 0}
      onHint={handleHint}
    >
      <div
        className="grid gap-1 rounded-lg bg-accent-soft p-2"
        style={{ gridTemplateColumns: `repeat(${board.size}, 1fr)`, width: "min(88vw, 380px)", aspectRatio: "1" }}
      >
        {board.marks.map((row, r) =>
          row.map((mark, c) => (
            <button
              key={`${r}-${c}`}
              type="button"
              onClick={() => handleCellClick(r, c)}
              className="grid place-items-center rounded-sm text-lg font-bold"
              style={{ background: REGION_PALETTE[board.regions[r][c] % REGION_PALETTE.length] }}
              aria-label={`Row ${r + 1}, column ${c + 1}, ${mark}`}
            >
              {mark === "star" && <span className="text-white">★</span>}
              {mark === "x" && <span className="text-white/70">✕</span>}
            </button>
          ))
        )}
      </div>
    </PuzzleFrame>
  );
}
