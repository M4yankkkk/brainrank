"use client";

import { motion } from "motion/react";
import { ThumbFor } from "./PuzzleThumbnails";

export type PuzzleId = "starfield" | "shiftword" | "unblock";

const DISPLAY_NAME: Record<PuzzleId, string> = {
  starfield: "Starfield",
  shiftword: "Shiftword",
  unblock: "Unblock"
};

const AVG_TIME: Record<PuzzleId, string> = {
  starfield: "About 2 min",
  shiftword: "About 2 min",
  unblock: "About 1 min"
};

export interface PuzzleCardProps {
  type: PuzzleId;
  difficulty: "easy" | "medium" | "hard" | "weekend";
  index: number;
  attempt: { solved: boolean; points: number; activeTimeMs: number } | null;
  onOpen: (type: PuzzleId) => void;
}

const DIFFICULTY_DOTS: Record<PuzzleCardProps["difficulty"], number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  weekend: 3
};

function formatSolveTime(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PuzzleCard({ type, difficulty, index, attempt, onOpen }: PuzzleCardProps) {
  const dotsOn = DIFFICULTY_DOTS[difficulty];
  const done = attempt?.solved ?? false;

  return (
    <motion.button
      type="button"
      data-puzzle={type}
      className="puzzle-card card-drop"
      style={{ animationDelay: `${index * 0.07}s` }}
      onClick={() => onOpen(type)}
      whileTap={{ y: 4 }}
    >
      <div className="puzzle-board">
        <ThumbFor type={type} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="mb-1 font-display text-[21px] font-extrabold tracking-tight">{DISPLAY_NAME[type]}</h2>
        <div className="flex items-center gap-2.5 text-[13px] font-semibold text-ink-2">
          <span className="dots" aria-hidden>
            {[0, 1, 2].map((i) => (
              <i key={i} className={i < dotsOn ? "on" : undefined} />
            ))}
          </span>
          {done && attempt ? `Solved in ${formatSolveTime(attempt.activeTimeMs)}` : AVG_TIME[type]}
        </div>
      </div>
      {done && attempt ? (
        <div className="puzzle-done">
          <b>{attempt.points}</b>
          <span>points</span>
        </div>
      ) : (
        <div className="puzzle-play">Play</div>
      )}
    </motion.button>
  );
}
