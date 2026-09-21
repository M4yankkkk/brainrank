"use client";

import { useEffect, useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { unblock, type UnblockPayload, type UnblockState, type UnblockMove, type Block } from "@brainrank/engine";

import { apiFetch } from "../../lib/apiClient";
import { useActiveTimer } from "../../lib/useActiveTimer";
import { usePuzzleOfTheDay } from "../../lib/usePuzzleOfTheDay";
import { PuzzleFrame } from "./PuzzleFrame";
import { PuzzleResult, type AttemptResult } from "./PuzzleResult";

export function UnblockPuzzle() {
  const { puzzle, error } = usePuzzleOfTheDay<UnblockPayload>("unblock");
  const { elapsedMs, finish } = useActiveTimer();

  const [state, setState] = useState<UnblockState | null>(null);
  const [moveLog, setMoveLog] = useState<UnblockMove[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [dragPreview, setDragPreview] = useState<{ blockId: string; deltaCells: number } | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const [boardPx, setBoardPx] = useState(320);

  useEffect(() => {
    function measure() {
      if (boardRef.current) setBoardPx(boardRef.current.clientWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [puzzle]);

  const board = state ?? (puzzle ? unblock.init(puzzle.payload) : null);
  const cellPx = board ? boardPx / board.size : 0;

  async function submit(finalState: UnblockState, finalHintsUsed: number, finalMoveLog: UnblockMove[]) {
    if (!puzzle) return;
    const solved = unblock.isSolved(finalState);
    const { activeTimeMs, pauseCount } = finish();
    try {
      const res = await apiFetch<AttemptResult>(`/puzzles/${puzzle.id}/attempts`, {
        method: "POST",
        body: JSON.stringify({ moveLog: finalMoveLog, activeTimeMs, hintsUsed: finalHintsUsed, pauseCount })
      });
      setResult(res);
    } catch {
      setResult({ solved, points: 0, breakdown: { efficiency: 0, time: 0, hintPenalty: 0, rawPoints: 0 } });
    }
  }

  function tryApplyMove(move: UnblockMove, wasHint: boolean) {
    if (!board || result) return false;
    try {
      const next = unblock.applyMove(board, move);
      const nextLog = [...moveLog, move];
      setState(next);
      setMoveLog(nextLog);
      const nextHints = wasHint ? hintsUsed + 1 : hintsUsed;
      if (wasHint) setHintsUsed(nextHints);
      if (unblock.isSolved(next)) submit(next, nextHints, nextLog);
      return true;
    } catch {
      return false;
    }
  }

  function handleUndo() {
    if (!puzzle || moveLog.length === 0) return;
    const remaining = moveLog.slice(0, -1);
    let replay = unblock.init(puzzle.payload);
    for (const m of remaining) replay = unblock.applyMove(replay, m);
    setState(replay);
    setMoveLog(remaining);
  }

  function handleHint() {
    if (!board) return;
    const hint = unblock.hint(board);
    if (hint) tryApplyMove(hint, true);
  }

  const bind = useDrag(({ last, movement: [mx, my], event }) => {
    if (!board || cellPx === 0) return;
    const el = event.currentTarget as HTMLElement;
    const blockId = el.dataset.blockId!;
    const block = board.blocks.find((b) => b.id === blockId)!;
    const deltaPx = block.orientation === "h" ? mx : my;
    const deltaCells = deltaPx / cellPx;

    if (!last) {
      setDragPreview({ blockId, deltaCells });
      return;
    }
    setDragPreview(null);
    const target = Math.round((block.orientation === "h" ? block.col : block.row) + deltaCells);
    const clamped = Math.max(0, Math.min(board.size - block.length, target));
    if (clamped !== (block.orientation === "h" ? block.col : block.row)) {
      tryApplyMove({ type: "slide", blockId, to: clamped }, false);
    }
  });

  if (error) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-sm font-medium text-ink-2">{error}</div>
    );
  }
  if (result) return <PuzzleResult type="unblock" result={result} />;
  if (!puzzle || !board) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-sm font-medium text-ink-2">Loading…</div>
    );
  }

  const overPar = puzzle.par !== null && moveLog.length > puzzle.par;

  return (
    <PuzzleFrame
      type="unblock"
      elapsedMs={elapsedMs}
      counterLabel={puzzle.par !== null ? `Moves ${moveLog.length} · Par ${puzzle.par}` : `Moves ${moveLog.length}`}
      overPar={overPar}
      onUndo={handleUndo}
      undoDisabled={moveLog.length === 0}
      onHint={handleHint}
    >
      <div
        ref={boardRef}
        className="relative touch-none rounded-lg bg-accent-soft"
        style={{ width: "min(88vw, 380px)", aspectRatio: "1" }}
      >
        {/* Exit marker on the right edge of the key block's row. */}
        <div
          className="absolute rounded-sm bg-accent"
          style={{
            right: -6,
            top: (board.exitRow + 0.3) * cellPx,
            width: 6,
            height: cellPx * 0.4
          }}
        />
        {board.blocks.map((block) => (
          <BlockView
            key={block.id}
            block={block}
            cellPx={cellPx}
            offsetPx={dragPreview?.blockId === block.id ? dragPreview.deltaCells * cellPx : 0}
            bind={bind}
          />
        ))}
      </div>
    </PuzzleFrame>
  );
}

function BlockView({
  block,
  cellPx,
  offsetPx,
  bind
}: {
  block: Block;
  cellPx: number;
  offsetPx: number;
  bind: (...args: unknown[]) => Record<string, unknown>;
}) {
  const baseLeft = block.col * cellPx;
  const baseTop = block.row * cellPx;
  const width = block.orientation === "h" ? block.length * cellPx : cellPx;
  const height = block.orientation === "v" ? block.length * cellPx : cellPx;

  return (
    <div
      {...bind()}
      data-block-id={block.id}
      className={`absolute cursor-grab rounded-md shadow-card-rest active:cursor-grabbing ${
        block.isKey ? "bg-accent" : "bg-card"
      }`}
      style={{
        left: baseLeft + (block.orientation === "h" ? offsetPx : 0),
        top: baseTop + (block.orientation === "v" ? offsetPx : 0),
        width: width - 4,
        height: height - 4,
        margin: 2
      }}
    />
  );
}
