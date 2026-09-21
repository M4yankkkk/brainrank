"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PuzzleId } from "../PuzzleCard";
import { UndoIcon, LightbulbIcon, HelpCircleIcon } from "../Icons";
import { GameTutorialModal } from "./GameTutorialModal";

const DISPLAY_NAME: Record<PuzzleId, string> = {
  starfield: "Starfield",
  shiftword: "Shiftword",
  unblock: "Unblock"
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export interface PuzzleFrameProps {
  type: PuzzleId;
  elapsedMs: number;
  counterLabel: string;
  overPar?: boolean;
  onUndo?: () => void;
  undoDisabled?: boolean;
  onHint: () => void;
  hintDisabled?: boolean;
  children: React.ReactNode;
}

/** Shared puzzle chrome, PRD section 7: back/name/timer top bar, board slot, undo/hint/rules bottom bar. */
export function PuzzleFrame({
  type,
  elapsedMs,
  counterLabel,
  overPar,
  onUndo,
  undoDisabled,
  onHint,
  hintDisabled,
  children
}: PuzzleFrameProps) {
  const router = useRouter();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(`brainrank_tutorial_seen_${type}`);
      if (!seen) {
        setShowTutorial(true);
      }
    } catch {
      // ignore
    }
  }, [type]);

  return (
    <div className="app-shell flex min-h-screen flex-col" data-puzzle={type}>
      <header className="mb-1 flex items-center justify-between">
        <button type="button" onClick={() => router.push("/")} aria-label="Back" className="p-1 text-ink hover:opacity-80">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5">
          <h1 className="m-0 font-display text-lg font-extrabold tracking-tight">{DISPLAY_NAME[type]}</h1>
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            aria-label="How to play"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-tray text-ink-2 hover:bg-card hover:text-ink transition"
          >
            <HelpCircleIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="font-display text-sm font-bold tabular-nums text-ink-2">{formatTime(elapsedMs)}</div>
      </header>
      <div className={`mb-4 text-center text-[13px] font-semibold ${overPar ? "text-sun" : "text-ink-2"}`}>{counterLabel}</div>

      <div className="flex flex-1 items-center justify-center py-4">{children}</div>

      <footer className="mt-4 flex items-center justify-around rounded-xl bg-tray p-3">
        <button
          type="button"
          onClick={onUndo}
          disabled={!onUndo || undoDisabled}
          className="flex flex-col items-center gap-1 text-xs font-semibold text-ink-2 disabled:opacity-40 hover:text-ink transition-colors"
        >
          <UndoIcon className="h-4 w-4" />
          <span>Undo</span>
        </button>
        <button
          type="button"
          onClick={() => setShowTutorial(true)}
          className="flex flex-col items-center gap-1 text-xs font-semibold text-ink-2 hover:text-ink transition-colors"
        >
          <HelpCircleIcon className="h-4 w-4" />
          <span>Rules</span>
        </button>
        <button
          type="button"
          onClick={onHint}
          disabled={hintDisabled}
          className="flex flex-col items-center gap-1 text-xs font-semibold text-ink-2 disabled:opacity-40 hover:text-ink transition-colors"
        >
          <LightbulbIcon className="h-4 w-4" />
          <span>Hint (−15)</span>
        </button>
      </footer>

      <GameTutorialModal
        type={type}
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );
}
