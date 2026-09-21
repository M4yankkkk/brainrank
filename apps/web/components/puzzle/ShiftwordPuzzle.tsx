"use client";

import { useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { shiftword, type ShiftwordPayload, type ShiftwordState, type ShiftwordMove } from "@brainrank/engine";

import { useActiveTimer } from "../../lib/useActiveTimer";
import { usePuzzleOfTheDay } from "../../lib/usePuzzleOfTheDay";
import { useAttemptSubmit } from "../../lib/useAttemptSubmit";
import { PuzzleFrame } from "./PuzzleFrame";
import { PuzzleResult } from "./PuzzleResult";
import { SubmitErrorScreen } from "./SubmitErrorScreen";

const DIRECTION_LOCK_PX = 10;
const COMMIT_PX = 28;

export function ShiftwordPuzzle() {
  const { puzzle, error } = usePuzzleOfTheDay<ShiftwordPayload>("shiftword");
  const { elapsedMs, finish } = useActiveTimer();

  const [state, setState] = useState<ShiftwordState | null>(null);
  const [moveLog, setMoveLog] = useState<ShiftwordMove[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const { result, error: submitError, submit, retry } = useAttemptSubmit();
  const lockedAxis = useRef<"row" | "col" | null>(null);

  const board = state ?? (puzzle ? shiftword.init(puzzle.payload) : null);

  function applyMove(move: ShiftwordMove, wasHint: boolean) {
    if (!puzzle || !board || result) return;
    const next = shiftword.applyMove(board, move);
    const nextLog = [...moveLog, move];
    setState(next);
    setMoveLog(nextLog);
    const nextHints = wasHint ? hintsUsed + 1 : hintsUsed;
    if (wasHint) setHintsUsed(nextHints);
    if (shiftword.isSolved(next)) {
      const { activeTimeMs, pauseCount } = finish();
      submit(puzzle.id, { moveLog: nextLog, activeTimeMs, hintsUsed: nextHints, pauseCount });
    }
  }

  const bind = useDrag(({ last, movement: [mx, my], event }) => {
    if (!board) return;
    if (lockedAxis.current === null) {
      if (Math.abs(mx) > DIRECTION_LOCK_PX && Math.abs(mx) > Math.abs(my)) lockedAxis.current = "row";
      else if (Math.abs(my) > DIRECTION_LOCK_PX && Math.abs(my) > Math.abs(mx)) lockedAxis.current = "col";
    }
    if (!last) return;

    const el = event.currentTarget as HTMLElement;
    const row = Number(el.dataset.row);
    const col = Number(el.dataset.col);

    if (lockedAxis.current === "row" && Math.abs(mx) > COMMIT_PX) {
      applyMove({ type: "shiftRow", row, dir: mx > 0 ? "right" : "left" }, false);
    } else if (lockedAxis.current === "col" && Math.abs(my) > COMMIT_PX) {
      applyMove({ type: "shiftCol", col, dir: my > 0 ? "down" : "up" }, false);
    }
    lockedAxis.current = null;
  });

  function handleUndo() {
    if (!puzzle || moveLog.length === 0) return;
    const remaining = moveLog.slice(0, -1);
    let replay = shiftword.init(puzzle.payload);
    for (const m of remaining) replay = shiftword.applyMove(replay, m);
    setState(replay);
    setMoveLog(remaining);
  }

  function handleHint() {
    if (!board) return;
    const hint = shiftword.hint(board);
    if (hint) applyMove(hint, true);
  }

  if (error) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-sm font-medium text-ink-2">{error}</div>
    );
  }
  if (result) return <PuzzleResult type="shiftword" result={result} />;
  if (submitError) return <SubmitErrorScreen message={submitError} onRetry={retry} />;
  if (!puzzle || !board) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-sm font-medium text-ink-2">Loading…</div>
    );
  }

  const overPar = puzzle.par !== null && moveLog.length > puzzle.par;

  return (
    <PuzzleFrame
      type="shiftword"
      elapsedMs={elapsedMs}
      counterLabel={puzzle.par !== null ? `Moves ${moveLog.length} · Par ${puzzle.par}` : `Moves ${moveLog.length}`}
      overPar={overPar}
      onUndo={handleUndo}
      undoDisabled={moveLog.length === 0}
      onHint={handleHint}
    >
      <div
        className="grid select-none gap-[3px] touch-none"
        style={{ gridTemplateColumns: `repeat(${board.size}, 1fr)`, width: "min(88vw, 380px)", aspectRatio: "1" }}
      >
        {board.grid.map((row, r) =>
          row.map((letter, c) => (
            <div
              key={`${r}-${c}`}
              {...bind()}
              data-row={r}
              data-col={c}
              className={`grid cursor-grab place-items-center rounded-md font-display text-2xl font-extrabold shadow-card-rest active:cursor-grabbing ${
                isRowSolved(board, r) ? "bg-good text-white" : "bg-card text-ink"
              }`}
            >
              {letter}
            </div>
          ))
        )}
      </div>
    </PuzzleFrame>
  );
}

function isRowSolved(state: ShiftwordState, row: number): boolean {
  return state.dictionary.has(state.grid[row].join(""));
}
