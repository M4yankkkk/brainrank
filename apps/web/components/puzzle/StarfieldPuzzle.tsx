"use client";

import { useMemo, useState } from "react";
import { starfield, type StarfieldPayload, type StarfieldState, type StarfieldMove, type CellMark } from "@brainrank/engine";

import { useActiveTimer } from "../../lib/useActiveTimer";
import { usePuzzleOfTheDay } from "../../lib/usePuzzleOfTheDay";
import { useAttemptSubmit } from "../../lib/useAttemptSubmit";
import { PuzzleFrame } from "./PuzzleFrame";
import { PuzzleResult } from "./PuzzleResult";
import { SubmitErrorScreen } from "./SubmitErrorScreen";
import { StarIcon, CloseIcon } from "../Icons";

const REGION_PALETTE = [
  "#7E62F0", // 0: Violet
  "#F59E0B", // 1: Amber
  "#0D9488", // 2: Teal
  "#E11D48", // 3: Rose
  "#10B981", // 4: Emerald
  "#2563EB", // 5: Cobalt Blue
  "#FF7F36", // 6: Warm Orange
  "#9333EA", // 7: Deep Purple
  "#0284C7", // 8: Sky Blue
  "#C026D3"  // 9: Fuchsia
];

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
  const { result, error: submitError, submit, retry } = useAttemptSubmit();

  const board = state ?? (puzzle ? starfield.init(puzzle.payload) : null);

  const starCount = useMemo(() => {
    if (!board) return 0;
    return board.marks.flat().filter((m) => m === "star").length;
  }, [board]);

  function applyMove(move: StarfieldMove, wasHint: boolean) {
    if (!puzzle || !board || result) return;
    const next = starfield.applyMove(board, move);
    setHistory((h) => [...h, { state: next, move, wasHint }]);
    setState(next);
    if (wasHint) setHintsUsed((n) => n + 1);
    if (starfield.isSolved(next)) {
      const { activeTimeMs, pauseCount } = finish();
      submit(puzzle.id, {
        moveLog: history.map((h) => h.move).concat(move),
        activeTimeMs,
        hintsUsed: wasHint ? hintsUsed + 1 : hintsUsed,
        pauseCount
      });
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
  if (submitError) return <SubmitErrorScreen message={submitError} onRetry={retry} />;
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
              className="grid place-items-center rounded-sm transition-transform active:scale-95"
              style={{ background: REGION_PALETTE[board.regions[r][c] % REGION_PALETTE.length] }}
              aria-label={`Row ${r + 1}, column ${c + 1}, ${mark}`}
            >
              {mark === "star" && (
                <StarIcon className="h-6 w-6 text-white fill-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
              )}
              {mark === "x" && (
                <CloseIcon className="h-4 w-4 text-white/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
              )}
            </button>
          ))
        )}
      </div>
    </PuzzleFrame>
  );
}
