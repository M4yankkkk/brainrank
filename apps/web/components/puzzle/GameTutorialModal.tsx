"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { PuzzleId } from "../PuzzleCard";
import {
  CloseIcon,
  CheckIcon,
  StarIcon,
  ZapIcon,
  TargetIcon,
  ArrowRightIcon,
  RotateCcwIcon,
  PlayIcon,
  PauseIcon
} from "../Icons";

interface GameTutorialModalProps {
  type: PuzzleId;
  isOpen: boolean;
  onClose: () => void;
}

export function GameTutorialModal({ type, isOpen, onClose }: GameTutorialModalProps) {
  const [tab, setTab] = useState<"how_to_play" | "rules">("how_to_play");

  if (!isOpen) return null;

  function handleDismiss() {
    try {
      localStorage.setItem(`brainrank_tutorial_seen_${type}`, "true");
    } catch {
      // ignore localstorage errors in private mode
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
        data-puzzle={type}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-tray text-ink">
              {type === "starfield" && <StarIcon className="h-4 w-4 text-violet" />}
              {type === "shiftword" && <ZapIcon className="h-4 w-4 text-orange-deep" />}
              {type === "unblock" && <TargetIcon className="h-4 w-4 text-teal-deep" />}
            </span>
            <div>
              <h2 className="font-display text-base font-extrabold text-ink">
                How to Play {type === "starfield" ? "Starfield" : type === "shiftword" ? "Shiftword" : "Unblock"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-ink-2 hover:bg-tray hover:text-ink transition"
          >
            Skip
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="mx-5 mb-1 flex rounded-xl bg-tray/60 p-1">
          <button
            type="button"
            onClick={() => setTab("how_to_play")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
              tab === "how_to_play" ? "bg-card text-ink shadow-sm" : "text-ink-2 hover:text-ink"
            }`}
          >
            Animated Guide
          </button>
          <button
            type="button"
            onClick={() => setTab("rules")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
              tab === "rules" ? "bg-card text-ink shadow-sm" : "text-ink-2 hover:text-ink"
            }`}
          >
            Rules & Scoring
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto px-5 py-3 text-sm">
          {type === "starfield" && <StarfieldAnimatedGuide tab={tab} />}
          {type === "shiftword" && <ShiftwordAnimatedGuide tab={tab} />}
          {type === "unblock" && <UnblockAnimatedGuide tab={tab} />}
        </div>

        {/* Footer Actions */}
        <div className="bg-card px-5 pb-5 pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet py-3.5 font-display text-sm font-extrabold text-white shadow-play hover:opacity-95 active:translate-y-0.5 transition"
          >
            <span>Got it, let's play!</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   STARFIELD ANIMATED GUIDE
   ========================================================================= */
function StarfieldAnimatedGuide({ tab }: { tab: "how_to_play" | "rules" }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // 4 Steps in the animated sequence
  const totalSteps = 4;

  useEffect(() => {
    if (!isPlaying || tab !== "how_to_play") return;
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % totalSteps);
    }, 2800);
    return () => clearInterval(timer);
  }, [isPlaying, tab]);

  if (tab === "rules") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-tray/60 p-4">
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-violet">Core Objective</h4>
          <p className="mt-1 text-xs text-ink leading-relaxed">
            Place stars into the grid so that each row, column, and colored region contains exactly the target number of stars.
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-soft text-xs font-extrabold text-violet-deep">1</span>
            <p className="text-xs text-ink-2">
              <strong className="text-ink">No touching:</strong> Stars can never touch each other horizontally, vertically, or diagonally.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-soft text-xs font-extrabold text-violet-deep">2</span>
            <p className="text-xs text-ink-2">
              <strong className="text-ink">Use dots to eliminate:</strong> Mark cells with a dot (·) where stars cannot possibly be placed.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-soft text-xs font-extrabold text-violet-deep">3</span>
            <p className="text-xs text-ink-2">
              <strong className="text-ink">Scoring:</strong> Solve in fewer moves without hints to score the full 1,000 points.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stepDescriptions = [
    {
      title: "Tap Once for Dot",
      desc: "Tap an empty square to place a Dot (·). Use dots to eliminate impossible spots.",
      badge: "Step 1: Eliminate"
    },
    {
      title: "Tap Again for Star",
      desc: "Tap a dotted square to place a Star. Exactly 1 star per row, column, and color zone.",
      badge: "Step 2: Place Star"
    },
    {
      title: "No Touching Rule",
      desc: "Stars can NEVER touch — not even diagonally! Touching stars trigger an error.",
      badge: "Step 3: Non-Adjacent"
    },
    {
      title: "Grid Solved",
      desc: "When every row, column, and region contains its spaced star, the puzzle is solved!",
      badge: "Step 4: Solved"
    }
  ];

  return (
    <div className="space-y-3.5">
      {/* Animated Simulation Canvas */}
      <div className="relative overflow-hidden rounded-2xl bg-tray/60 p-4">
        {/* Top Control Bar */}
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-violet-soft px-2.5 py-0.5 text-[10px] font-extrabold text-violet-deep">
            {stepDescriptions[step].badge}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-card text-ink-2 hover:text-ink shadow-xs transition"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseIcon className="h-3 w-3" /> : <PlayIcon className="h-3 w-3" />}
            </button>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-card text-ink-2 hover:text-ink shadow-xs transition"
              title="Restart"
            >
              <RotateCcwIcon className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* 3x3 Mini Interactive Board */}
        <div className="relative mx-auto w-[180px] h-[180px] rounded-xl bg-card p-2 shadow-card-rest">
          <div className="grid h-full w-full grid-cols-3 gap-1.5">
            {/* Cell (0,0) - Region A */}
            <div className={`relative flex items-center justify-center rounded-lg font-mono text-sm font-bold transition-all duration-300 ${
              step >= 0 ? "bg-violet-soft/40" : "bg-tray/40"
            }`}>
              {step === 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-lg text-ink-2"
                >
                  ·
                </motion.span>
              )}
              {step === 3 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-sm text-ink-2"
                >
                  ·
                </motion.span>
              )}
            </div>

            {/* Cell (0,1) - Region A */}
            <div className={`relative flex items-center justify-center rounded-lg font-mono text-sm font-bold transition-all duration-300 ${
              step === 2 ? "bg-orange-soft" : "bg-violet-soft/40"
            }`}>
              {step === 2 && (
                <motion.div
                  animate={{ x: [-2, 2, -2, 2, 0] }}
                  transition={{ repeat: Infinity, duration: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <StarIcon className="h-4 w-4 text-orange-deep" />
                </motion.div>
              )}
              {step === 3 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                >
                  <StarIcon className="h-4 w-4 text-violet" />
                </motion.div>
              )}
            </div>

            {/* Cell (0,2) - Region B */}
            <div className="relative flex items-center justify-center rounded-lg bg-teal-soft/40 font-mono text-sm font-bold">
              {step >= 2 && <span className="text-ink-2">·</span>}
            </div>

            {/* Cell (1,0) - Region A */}
            <div className="relative flex items-center justify-center rounded-lg bg-violet-soft/40 font-mono text-sm font-bold">
              {step >= 1 && <span className="text-ink-2">·</span>}
            </div>

            {/* Cell (1,1) - Region B */}
            <div className="relative flex items-center justify-center rounded-lg bg-teal-soft/40 font-mono text-sm font-bold">
              {step >= 1 && <span className="text-ink-2">·</span>}
            </div>

            {/* Cell (1,2) - Region B */}
            <div className={`relative flex items-center justify-center rounded-lg font-mono text-sm font-bold transition-all duration-300 ${
              step === 2 ? "bg-orange-soft" : "bg-teal-soft/40"
            }`}>
              {step === 1 && (
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <StarIcon className="h-4 w-4 text-violet" />
                </motion.div>
              )}
              {step === 2 && (
                <motion.div
                  animate={{ x: [-2, 2, -2, 2, 0] }}
                  transition={{ repeat: Infinity, duration: 0.4 }}
                >
                  <StarIcon className="h-4 w-4 text-orange-deep" />
                </motion.div>
              )}
              {step === 3 && (
                <StarIcon className="h-4 w-4 text-violet" />
              )}
            </div>

            {/* Cell (2,0) - Region C */}
            <div className="relative flex items-center justify-center rounded-lg bg-sun/20 font-mono text-sm font-bold">
              {step === 3 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                >
                  <StarIcon className="h-4 w-4 text-violet" />
                </motion.div>
              )}
            </div>

            {/* Cell (2,1) - Region C */}
            <div className="relative flex items-center justify-center rounded-lg bg-sun/20 font-mono text-sm font-bold">
              {step >= 1 && <span className="text-ink-2">·</span>}
            </div>

            {/* Cell (2,2) - Region C */}
            <div className="relative flex items-center justify-center rounded-lg bg-sun/20 font-mono text-sm font-bold">
              {step >= 1 && <span className="text-ink-2">·</span>}
            </div>
          </div>

          {/* Animated Tap Cursor Finger */}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="cursor-step-0"
                initial={{ x: 80, y: 80, opacity: 0 }}
                animate={{ x: 20, y: 20, opacity: 1, scale: [1, 0.85, 1] }}
                transition={{ duration: 0.5 }}
                className="pointer-events-none absolute h-6 w-6 rounded-full bg-violet/40 shadow-sm ring-4 ring-violet/20"
              />
            )}
            {step === 1 && (
              <motion.div
                key="cursor-step-1"
                initial={{ x: 20, y: 20, opacity: 0 }}
                animate={{ x: 135, y: 78, opacity: 1, scale: [1, 0.8, 1, 0.8, 1] }}
                transition={{ duration: 0.6 }}
                className="pointer-events-none absolute h-6 w-6 rounded-full bg-violet/40 shadow-sm ring-4 ring-violet/20"
              />
            )}
            {step === 2 && (
              <motion.div
                key="cursor-step-2"
                initial={{ x: 135, y: 78, opacity: 0 }}
                animate={{ x: 78, y: 20, opacity: 1, scale: [1, 0.8, 1] }}
                transition={{ duration: 0.5 }}
                className="pointer-events-none absolute h-6 w-6 rounded-full bg-orange-deep/40 shadow-sm ring-4 ring-orange-deep/20"
              />
            )}
          </AnimatePresence>

          {/* Step 2 Error Badge Overlay */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-lg bg-orange-deep px-2 py-1 text-[11px] font-bold text-white shadow-md"
            >
              <CloseIcon className="h-3 w-3" />
              <span>Touching Diagonally!</span>
            </motion.div>
          )}

          {/* Step 3 Success Badge Overlay */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-lg bg-good px-2 py-1 text-[11px] font-bold text-white shadow-md"
            >
              <CheckIcon className="h-3 w-3" />
              <span>All 3 Zones Valid!</span>
            </motion.div>
          )}
        </div>

        {/* Step Progress Dots */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {stepDescriptions.map((s, idx) => (
            <button
              key={s.badge}
              type="button"
              onClick={() => setStep(idx)}
              className={`h-2 rounded-full transition-all ${
                step === idx ? "w-6 bg-violet" : "w-2 bg-tray hover:bg-ink-2/40"
              }`}
              title={s.title}
            />
          ))}
        </div>
      </div>

      {/* Description Card */}
      <div className="rounded-xl bg-card p-3.5 shadow-card-rest">
        <h4 className="font-display text-sm font-black text-ink">{stepDescriptions[step].title}</h4>
        <p className="mt-1 text-xs text-ink-2 leading-relaxed">{stepDescriptions[step].desc}</p>
      </div>
    </div>
  );
}

/* =========================================================================
   SHIFTWORD ANIMATED GUIDE
   ========================================================================= */
function ShiftwordAnimatedGuide({ tab }: { tab: "how_to_play" | "rules" }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const totalSteps = 3;

  useEffect(() => {
    if (!isPlaying || tab !== "how_to_play") return;
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % totalSteps);
    }, 3000);
    return () => clearInterval(timer);
  }, [isPlaying, tab]);

  if (tab === "rules") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-tray/60 p-4">
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-orange-deep">Core Objective</h4>
          <p className="mt-1 text-xs text-ink leading-relaxed">
            Slide rows and columns to rearrange letters until the highlighted target row spells out valid dictionary words.
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-soft text-xs font-extrabold text-orange-deep">1</span>
            <p className="text-xs text-ink-2">
              <strong className="text-ink">Infinite wrap-around:</strong> When letters slide off the edge of the board, they re-enter from the opposite side.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-soft text-xs font-extrabold text-orange-deep">2</span>
            <p className="text-xs text-ink-2">
              <strong className="text-ink">Target zone:</strong> Watch the framed target box in the center; only words inside the target count towards victory.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-soft text-xs font-extrabold text-orange-deep">3</span>
            <p className="text-xs text-ink-2">
              <strong className="text-ink">Par moves:</strong> Try to solve the puzzle in or under Par moves for bonus points.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stepDescriptions = [
    {
      title: "Swipe Rows Left or Right",
      desc: "Drag horizontally along any row. Letters slide smoothly, and edge letters wrap around infinitely.",
      badge: "Step 1: Row Shift"
    },
    {
      title: "Swipe Columns Up or Down",
      desc: "Drag vertically along any column. The entire column shifts and wraps letters from bottom to top.",
      badge: "Step 2: Column Shift"
    },
    {
      title: "Target Word Matched!",
      desc: "Align letters inside the highlighted center row to match the secret word within par moves to win!",
      badge: "Step 3: Victory"
    }
  ];

  return (
    <div className="space-y-3.5">
      {/* Animated Simulation Canvas */}
      <div className="relative overflow-hidden rounded-2xl bg-tray/60 p-4">
        {/* Top Control Bar */}
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-orange-soft px-2.5 py-0.5 text-[10px] font-extrabold text-orange-deep">
            {stepDescriptions[step].badge}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-card text-ink-2 hover:text-ink shadow-xs transition"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseIcon className="h-3 w-3" /> : <PlayIcon className="h-3 w-3" />}
            </button>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-card text-ink-2 hover:text-ink shadow-xs transition"
              title="Restart"
            >
              <RotateCcwIcon className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* 4x3 Shiftword Animated Grid */}
        <div className="mx-auto flex max-w-[230px] flex-col gap-1.5 rounded-2xl bg-card p-3 shadow-card-rest">
          {/* Row 0 */}
          <div className="flex items-center justify-between gap-1 text-xs font-mono font-bold">
            {["B", "O", "A", "T"].map((l) => (
              <span key={l} className="flex h-9 w-11 items-center justify-center rounded-lg bg-tray text-ink-2">
                {l}
              </span>
            ))}
          </div>

          {/* Row 1 (Center Target Row) */}
          <div className="relative">
            <div className={`flex items-center justify-between gap-1 rounded-xl p-1 transition-all duration-300 ${
              step === 2 ? "bg-good/20" : "bg-orange-soft"
            }`}>
              {step === 0 ? (
                // Row slide animation: "D W O R" shifts right into "W O R D"
                <motion.div
                  initial={{ x: -28 }}
                  animate={{ x: 0 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  className="flex w-full items-center justify-between gap-1 text-xs font-mono font-black text-orange-deep"
                >
                  <span className="flex h-9 w-11 items-center justify-center rounded-lg bg-card shadow-sm">W</span>
                  <span className="flex h-9 w-11 items-center justify-center rounded-lg bg-card shadow-sm">O</span>
                  <span className="flex h-9 w-11 items-center justify-center rounded-lg bg-card shadow-sm">R</span>
                  <span className="flex h-9 w-11 items-center justify-center rounded-lg bg-card shadow-sm">D</span>
                </motion.div>
              ) : step === 1 ? (
                // Step 1: Column shift preview
                <div className="flex w-full items-center justify-between gap-1 text-xs font-mono font-black text-orange-deep">
                  <motion.span
                    animate={{ y: [-15, 0] }}
                    transition={{ duration: 1 }}
                    className="flex h-9 w-11 items-center justify-center rounded-lg bg-card shadow-sm"
                  >
                    W
                  </motion.span>
                  <span className="flex h-9 w-11 items-center justify-center rounded-lg bg-card shadow-sm">O</span>
                  <span className="flex h-9 w-11 items-center justify-center rounded-lg bg-card shadow-sm">R</span>
                  <span className="flex h-9 w-11 items-center justify-center rounded-lg bg-card shadow-sm">D</span>
                </div>
              ) : (
                // Step 2: Victory State
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: [0.95, 1.03, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="flex w-full items-center justify-between gap-1 text-xs font-mono font-black text-good"
                >
                  <span className="flex h-9 w-11 items-center justify-center rounded-lg bg-card shadow-sm">W</span>
                  <span className="flex h-9 w-11 items-center justify-center rounded-lg bg-card shadow-sm">O</span>
                  <span className="flex h-9 w-11 items-center justify-center rounded-lg bg-card shadow-sm">R</span>
                  <span className="flex h-9 w-11 items-center justify-center rounded-lg bg-card shadow-sm">D</span>
                </motion.div>
              )}
            </div>

            {/* Target indicator tag */}
            <span className="absolute -top-2 right-2 rounded-full bg-orange-deep px-1.5 py-0.2 text-[8px] font-extrabold uppercase tracking-wider text-white">
              Target
            </span>
          </div>

          {/* Row 2 */}
          <div className="flex items-center justify-between gap-1 text-xs font-mono font-bold">
            {["P", "L", "A", "Y"].map((l) => (
              <span key={l} className="flex h-9 w-11 items-center justify-center rounded-lg bg-tray text-ink-2">
                {l}
              </span>
            ))}
          </div>

          {/* Gesture Swipe Animation Trail */}
          <AnimatePresence>
            {step === 0 && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: [20, 160], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="pointer-events-none absolute left-8 top-[102px] flex items-center gap-1 font-bold text-orange-deep"
              >
                <div className="h-4 w-4 rounded-full bg-orange/40 ring-4 ring-orange/20" />
                <ArrowRightIcon className="h-4 w-4" />
              </motion.div>
            )}
            {step === 1 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: [20, 120], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="pointer-events-none absolute left-8 top-12 flex flex-col items-center gap-1 font-bold text-orange-deep"
              >
                <div className="h-4 w-4 rounded-full bg-orange/40 ring-4 ring-orange/20" />
                <span className="text-xs">↓</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step Progress Dots */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {stepDescriptions.map((s, idx) => (
            <button
              key={s.badge}
              type="button"
              onClick={() => setStep(idx)}
              className={`h-2 rounded-full transition-all ${
                step === idx ? "w-6 bg-orange" : "w-2 bg-tray hover:bg-ink-2/40"
              }`}
              title={s.title}
            />
          ))}
        </div>
      </div>

      {/* Description Card */}
      <div className="rounded-xl bg-card p-3.5 shadow-card-rest">
        <h4 className="font-display text-sm font-black text-ink">{stepDescriptions[step].title}</h4>
        <p className="mt-1 text-xs text-ink-2 leading-relaxed">{stepDescriptions[step].desc}</p>
      </div>
    </div>
  );
}

/* =========================================================================
   UNBLOCK ANIMATED GUIDE
   ========================================================================= */
function UnblockAnimatedGuide({ tab }: { tab: "how_to_play" | "rules" }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const totalSteps = 4;

  useEffect(() => {
    if (!isPlaying || tab !== "how_to_play") return;
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % totalSteps);
    }, 2800);
    return () => clearInterval(timer);
  }, [isPlaying, tab]);

  if (tab === "rules") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-tray/60 p-4">
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-teal-deep">Core Objective</h4>
          <p className="mt-1 text-xs text-ink leading-relaxed">
            Slide blocking vehicles out of the way so the target vehicle can escape through the right gate.
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-soft text-xs font-extrabold text-teal-deep">1</span>
            <p className="text-xs text-ink-2">
              <strong className="text-ink">Strict axis lock:</strong> Horizontal blocks can only move left/right. Vertical blocks can only move up/down.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-soft text-xs font-extrabold text-teal-deep">2</span>
            <p className="text-xs text-ink-2">
              <strong className="text-ink">No overlapping:</strong> Cars cannot pass through or jump over other cars.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-soft text-xs font-extrabold text-teal-deep">3</span>
            <p className="text-xs text-ink-2">
              <strong className="text-ink">Escape to win:</strong> Slide the highlighted target car all the way into the right exit slot.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stepDescriptions = [
    {
      title: "Exit Path is Blocked",
      desc: "The Target Car must reach the right exit, but obstacle vehicles block the runway.",
      badge: "Step 1: Obstacle"
    },
    {
      title: "Slide Blocker UP",
      desc: "Vertical cars slide ONLY UP & DOWN. Slide the blocking car up out of the lane.",
      badge: "Step 2: Clear Lane"
    },
    {
      title: "Slide Target Car RIGHT",
      desc: "Horizontal cars slide ONLY LEFT & RIGHT. With the lane clear, slide your car towards the gate.",
      badge: "Step 3: Drive Out"
    },
    {
      title: "Escaped & Solved!",
      desc: "When the Target Car passes through the exit gate, the puzzle is solved!",
      badge: "Step 4: Solved"
    }
  ];

  return (
    <div className="space-y-3.5">
      {/* Animated Simulation Canvas */}
      <div className="relative overflow-hidden rounded-2xl bg-tray/60 p-4">
        {/* Top Control Bar */}
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-[10px] font-extrabold text-teal-deep">
            {stepDescriptions[step].badge}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-card text-ink-2 hover:text-ink shadow-xs transition"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseIcon className="h-3 w-3" /> : <PlayIcon className="h-3 w-3" />}
            </button>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-card text-ink-2 hover:text-ink shadow-xs transition"
              title="Restart"
            >
              <RotateCcwIcon className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* 6x6 Mini Parking Grid Simulation */}
        <div className="relative mx-auto h-44 w-44 rounded-2xl bg-card p-1.5 shadow-card-rest">
          {/* Subtle grid dots/lines */}
          <div className="absolute inset-2 grid grid-cols-6 grid-rows-6 gap-1 opacity-20 pointer-events-none">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="rounded bg-ink-2" />
            ))}
          </div>

          {/* Stationary Obstacle 1 (Horizontal Top) */}
          <div className="absolute left-[12px] top-[12px] flex h-[24px] w-[54px] items-center justify-center rounded-lg bg-tray text-[9px] font-bold text-ink-2 shadow-xs">
            BLOCK
          </div>

          {/* Stationary Obstacle 2 (Horizontal Bottom) */}
          <div className="absolute left-[40px] bottom-[12px] flex h-[24px] w-[54px] items-center justify-center rounded-lg bg-tray text-[9px] font-bold text-ink-2 shadow-xs">
            BLOCK
          </div>

          {/* MOVING VERTICAL BLOCKER CAR (at col 3, row 2-3) */}
          {/* In step 0: blocking the target car path (top = 66px) */}
          {/* In step 1+: shifted UP out of the way (top = 12px) */}
          <motion.div
            animate={{
              y: step === 0 ? 0 : -52
            }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={`absolute left-[92px] top-[66px] flex h-[54px] w-[26px] items-center justify-center rounded-lg font-bold text-[9px] shadow-sm ${
              step === 0 ? "bg-orange-soft text-orange-deep" : "bg-tray text-ink-2"
            }`}
          >
            <span className="writing-mode-vertical">↕</span>
          </motion.div>

          {/* MOVING TARGET CAR (Teal, Horizontal 2 units) */}
          {/* In step 0: at start (x = 0), hits obstacle */}
          {/* In step 1: waiting for blocker to clear */}
          {/* In step 2: slides right across lane (x = 42) */}
          {/* In step 3: passes fully through the exit gate (x = 76) */}
          <motion.div
            animate={{
              x: step === 0 ? [0, 8, 0] : step === 1 ? 0 : step === 2 ? 46 : 78
            }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 22,
              duration: step === 0 ? 0.6 : undefined
            }}
            className="absolute left-[12px] top-[68px] z-10 flex h-[26px] w-[56px] items-center justify-center rounded-lg bg-teal font-display text-[9px] font-black text-white shadow-sm"
          >
            TARGET →
          </motion.div>

          {/* EXIT GATE ON THE RIGHT */}
          <motion.div
            animate={{
              scale: step === 3 ? [1, 1.15, 1] : 1,
              backgroundColor: step === 3 ? "var(--good)" : "var(--teal)"
            }}
            transition={{ repeat: step === 3 ? Infinity : 0, duration: 1 }}
            className="absolute -right-3.5 top-[64px] z-20 flex h-[34px] w-[20px] items-center justify-center rounded-r-xl bg-teal text-white shadow-md"
          >
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </motion.div>

          {/* Animated Gesture Hand Cursor */}
          <AnimatePresence>
            {step === 1 && (
              <motion.div
                initial={{ x: 100, y: 80, opacity: 0 }}
                animate={{ y: [80, 24], opacity: [0, 1, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="pointer-events-none absolute left-[86px] z-30 flex flex-col items-center"
              >
                <div className="h-5 w-5 rounded-full bg-orange/40 ring-4 ring-orange/20" />
                <span className="text-[10px] font-bold text-orange-deep">↑</span>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                initial={{ x: 30, y: 70, opacity: 0 }}
                animate={{ x: [30, 90], opacity: [0, 1, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="pointer-events-none absolute top-[70px] z-30 flex items-center"
              >
                <div className="h-5 w-5 rounded-full bg-teal/40 ring-4 ring-teal/20" />
                <ArrowRightIcon className="h-3 w-3 text-teal-deep" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step Overlays */}
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute left-2 top-2 z-20 rounded-md bg-orange-deep px-1.5 py-0.5 text-[8px] font-bold text-white shadow-xs"
            >
              Exit blocked!
            </motion.div>
          )}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute left-2 top-2 z-20 flex items-center gap-1 rounded-md bg-good px-2 py-0.5 text-[9px] font-bold text-white shadow-xs"
            >
              <CheckIcon className="h-2.5 w-2.5" />
              <span>Escaped!</span>
            </motion.div>
          )}
        </div>

        {/* Step Progress Dots */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {stepDescriptions.map((s, idx) => (
            <button
              key={s.badge}
              type="button"
              onClick={() => setStep(idx)}
              className={`h-2 rounded-full transition-all ${
                step === idx ? "w-6 bg-teal" : "w-2 bg-tray hover:bg-ink-2/40"
              }`}
              title={s.title}
            />
          ))}
        </div>
      </div>

      {/* Description Card */}
      <div className="rounded-xl bg-card p-3.5 shadow-card-rest">
        <h4 className="font-display text-sm font-black text-ink">{stepDescriptions[step].title}</h4>
        <p className="mt-1 text-xs text-ink-2 leading-relaxed">{stepDescriptions[step].desc}</p>
      </div>
    </div>
  );
}
