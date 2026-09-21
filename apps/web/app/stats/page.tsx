"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../lib/supabaseClient";
import { apiFetch } from "../../lib/apiClient";
import { TabBar } from "@/components/TabBar";
import type { PuzzleId } from "@/components/PuzzleCard";
import {
  BrainIcon,
  FlameIcon,
  TrophyIcon,
  CrownIcon,
  TargetIcon,
  ZapIcon,
  StarIcon,
  CheckIcon
} from "@/components/Icons";

interface StatsRow {
  userId: string;
  puzzleType: string;
  played: number;
  best: number;
  avgPoints: number;
  streak: number;
}

const PUZZLE_CONFIG: Record<
  PuzzleId,
  {
    title: string;
    category: string;
    description: string;
    color: string;
    bgBadge: string;
    barColor: string;
  }
> = {
  starfield: {
    title: "Starfield",
    category: "Logic & Pattern Deduction",
    description: "Grid deduction with row/column star constraints",
    color: "text-violet",
    bgBadge: "bg-violet-soft text-violet-deep",
    barColor: "bg-violet"
  },
  shiftword: {
    title: "Shiftword",
    category: "Lexical & Anagram Agility",
    description: "Row & column shifts to form valid English words",
    color: "text-orange-deep",
    bgBadge: "bg-orange-soft text-orange-deep",
    barColor: "bg-orange"
  },
  unblock: {
    title: "Unblock",
    category: "Spatial Reasoning & Pathfinding",
    description: "Slide blocking cars to clear the target vehicle",
    color: "text-teal-deep",
    bgBadge: "bg-teal-soft text-teal-deep",
    barColor: "bg-teal"
  }
};

export default function StatsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<StatsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/sign-in");
        return;
      }
    });

    apiFetch<StatsRow[]>("/stats/me")
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setLoading(false);
      });
  }, [router]);

  // Aggregated totals
  const totalPlayed = rows.reduce((acc, r) => acc + r.played, 0);
  const highestBest = rows.reduce((acc, r) => Math.max(acc, r.best), 0);
  const longestStreak = rows.reduce((acc, r) => Math.max(acc, r.streak), 0);
  const weightedAvg =
    totalPlayed > 0
      ? Math.round(rows.reduce((acc, r) => acc + r.avgPoints * r.played, 0) / totalPlayed)
      : 0;

  // Cognitive rank tier
  const getRankTier = (played: number, avg: number) => {
    if (played === 0) return { title: "Unranked", desc: "Play your first puzzle to rank" };
    if (played >= 15 && avg >= 850) return { title: "Grandmaster", desc: "Top cognitive precision" };
    if (played >= 8 && avg >= 750) return { title: "Strategist", desc: "Advanced mental speed" };
    if (played >= 3) return { title: "Challenger", desc: "Rising daily competitor" };
    return { title: "Apprentice", desc: "Building core skills" };
  };

  const currentRank = getRankTier(totalPlayed, weightedAvg);

  // Milestone badges
  const achievements = [
    {
      id: "first_spark",
      title: "First Spark",
      desc: "Complete your first daily puzzle",
      unlocked: totalPlayed >= 1,
      icon: <ZapIcon className="h-5 w-5" />
    },
    {
      id: "triple_threat",
      title: "Triple Threat",
      desc: "Play at least 1 game in all 3 puzzle modes",
      unlocked:
        rows.filter((r) => r.played > 0).length === 3,
      icon: <CrownIcon className="h-5 w-5" />
    },
    {
      id: "fire_starter",
      title: "On Fire",
      desc: "Reach a 3-day active streak in any game",
      unlocked: longestStreak >= 3,
      icon: <FlameIcon className="h-5 w-5" />
    },
    {
      id: "high_scorer",
      title: "Sharp Mind",
      desc: "Score 850+ points in a single puzzle",
      unlocked: highestBest >= 850,
      icon: <TargetIcon className="h-5 w-5" />
    },
    {
      id: "master_tier",
      title: "Century Solver",
      desc: "Score 950+ points in a single puzzle",
      unlocked: highestBest >= 950,
      icon: <TrophyIcon className="h-5 w-5" />
    },
    {
      id: "veteran",
      title: "Brain Athlete",
      desc: "Play 15 or more total puzzle attempts",
      unlocked: totalPlayed >= 15,
      icon: <BrainIcon className="h-5 w-5" />
    }
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="app-shell pb-28">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-ink">Stats & Mastery</h1>
          <p className="text-xs font-semibold text-ink-2">Your cognitive performance across daily challenges</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-orange-soft px-3.5 py-1 text-xs font-bold text-orange-deep shadow-xs">
          <FlameIcon className="h-3.5 w-3.5" />
          <span>{longestStreak}d Streak</span>
        </div>
      </div>

      {/* Hero Bento Overview Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Games */}
        <div className="flex flex-col justify-between rounded-2xl bg-card p-4 shadow-card-rest">
          <div className="flex items-center justify-between text-ink-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Puzzles</span>
            <TargetIcon className="h-4 w-4 text-violet" />
          </div>
          <div className="mt-2">
            <span className="font-display text-2xl font-black text-ink">{loading ? "–" : totalPlayed}</span>
            <span className="block text-[11px] font-medium text-ink-2">Total solved</span>
          </div>
        </div>

        {/* Avg Score */}
        <div className="flex flex-col justify-between rounded-2xl bg-card p-4 shadow-card-rest">
          <div className="flex items-center justify-between text-ink-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Average</span>
            <BrainIcon className="h-4 w-4 text-teal" />
          </div>
          <div className="mt-2">
            <span className="font-display text-2xl font-black text-ink">{loading ? "–" : weightedAvg}</span>
            <span className="block text-[11px] font-medium text-ink-2">Pts per puzzle</span>
          </div>
        </div>

        {/* Personal Best */}
        <div className="flex flex-col justify-between rounded-2xl bg-card p-4 shadow-card-rest">
          <div className="flex items-center justify-between text-ink-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Score</span>
            <TrophyIcon className="h-4 w-4 text-sun" />
          </div>
          <div className="mt-2">
            <span className="font-display text-2xl font-black text-ink">{loading ? "–" : (highestBest || "–")}</span>
            <span className="block text-[11px] font-medium text-ink-2">Personal record</span>
          </div>
        </div>

        {/* Tier / Title */}
        <div className="flex flex-col justify-between rounded-2xl bg-card p-4 shadow-card-rest">
          <div className="flex items-center justify-between text-ink-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cognitive Rank</span>
            <CrownIcon className="h-4 w-4 text-orange" />
          </div>
          <div className="mt-2">
            <span className="font-display text-base font-extrabold text-ink">{loading ? "–" : currentRank.title}</span>
            <span className="block truncate text-[11px] font-medium text-ink-2">{currentRank.desc}</span>
          </div>
        </div>
      </div>

      {/* Per-Game Breakdown Section */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-black text-ink">Cognitive Domains</h2>
          <span className="text-xs font-semibold text-ink-2">3 Daily Modes</span>
        </div>

        <div className="flex flex-col gap-3">
          {(["starfield", "shiftword", "unblock"] as const).map((type) => {
            const row = rows.find((r) => r.puzzleType === type);
            const conf = PUZZLE_CONFIG[type];
            const hasPlayed = !!row && row.played > 0;
            const avg = row ? Math.round(row.avgPoints) : 0;
            const best = row?.best ?? 0;
            const streak = row?.streak ?? 0;
            const playedCount = row?.played ?? 0;
            const progressPercent = Math.min(100, Math.round((avg / 1000) * 100));

            return (
              <div
                key={type}
                className="overflow-hidden rounded-2xl bg-card p-5 shadow-card-rest transition hover:-translate-y-0.5"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-black text-ink">{conf.title}</h3>
                      <span className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold ${conf.bgBadge}`}>
                        {conf.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-2">{conf.description}</p>
                  </div>
                  {hasPlayed && streak > 0 && (
                    <span className="flex items-center gap-1 text-xs font-bold text-orange-deep">
                      <FlameIcon className="h-3.5 w-3.5" />
                      {streak}d
                    </span>
                  )}
                </div>

                {/* Score Progress Bar */}
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-ink-2">
                    <span>Mastery Level</span>
                    <span>{hasPlayed ? `${avg} / 1000 pts avg` : "No attempts yet"}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-tray">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${conf.barColor}`}
                      style={{ width: hasPlayed ? `${progressPercent}%` : "0%" }}
                    />
                  </div>
                </div>

                {/* 3-Column Metrics Footer */}
                <div className="mt-4 grid grid-cols-3 divide-x divide-edge rounded-xl bg-tray/60 py-3 text-center">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-2">Solved</span>
                    <span className="font-display text-sm font-extrabold text-ink">{playedCount}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-2">Best Score</span>
                    <span className={`font-display text-sm font-black ${conf.color}`}>
                      {best > 0 ? best : "–"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-2">Streak</span>
                    <span className="font-display text-sm font-extrabold text-ink">{streak}d</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements / Trophy Showcase */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-black text-ink">Achievements</h2>
            <p className="text-xs font-semibold text-ink-2">Milestones unlocked through daily play</p>
          </div>
          <span className="rounded-full bg-violet-soft px-3 py-0.5 text-xs font-extrabold text-violet-deep">
            {unlockedCount} / {achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {achievements.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3.5 rounded-2xl p-4 transition ${
                item.unlocked
                  ? "bg-card shadow-card-rest"
                  : "bg-tray/40 opacity-55"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  item.unlocked
                    ? "bg-violet-soft text-violet-deep"
                    : "bg-card/70 text-ink-2"
                }`}
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-display text-sm font-bold text-ink">{item.title}</h4>
                  {item.unlocked && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-good text-white">
                      <CheckIcon className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-2">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Jump to Play Today */}
      <div className="rounded-2xl bg-card p-6 text-center shadow-card-rest">
        <h3 className="font-display text-base font-black text-ink">Ready for today's challenge?</h3>
        <p className="mb-4 mt-1 text-xs text-ink-2">Keep your streaks alive and boost your cognitive average</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet px-6 py-3 font-display text-sm font-bold text-white shadow-play transition hover:opacity-95 active:translate-y-0.5"
        >
          <ZapIcon className="h-4 w-4" />
          Play Today's Puzzles
        </Link>
      </div>

      {/* Persistent Navigation */}
      <TabBar />
    </div>
  );
}
