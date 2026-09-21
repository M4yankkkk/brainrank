"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "../../lib/apiClient";
import { TabBar } from "../../components/TabBar";

interface StatsRow {
  puzzleType: "starfield" | "shiftword" | "unblock";
  played: number;
  avgPoints: number;
  best: number;
  streak: number;
}

const LABEL: Record<StatsRow["puzzleType"], string> = { starfield: "Starfield", shiftword: "Shiftword", unblock: "Unblock" };

export default function StatsPage() {
  const [rows, setRows] = useState<StatsRow[]>([]);

  useEffect(() => {
    apiFetch<StatsRow[]>("/stats/me").then(setRows);
  }, []);

  return (
    <div className="app-shell">
      <h1 className="mb-5 font-display text-2xl font-extrabold tracking-tight">Stats</h1>
      <div className="flex flex-col gap-2.5">
        {(["starfield", "shiftword", "unblock"] as const).map((type) => {
          const row = rows.find((r) => r.puzzleType === type);
          return (
            <div key={type} data-puzzle={type} className="leaderboard-row">
              <div className="min-w-0 flex-1">
                <b className="block text-[15px] font-bold">{LABEL[type]}</b>
                <span className="text-xs font-semibold text-ink-2">
                  {row ? `${row.played} played · avg ${row.avgPoints.toFixed(0)} · streak ${row.streak}` : "Not played yet"}
                </span>
              </div>
              <b className="font-display text-lg font-extrabold text-accent">{row?.best ?? "–"}</b>
            </div>
          );
        })}
      </div>
      <TabBar />
    </div>
  );
}
