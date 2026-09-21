"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { apiFetch } from "../../../lib/apiClient";
import { TabBar } from "../../../components/TabBar";

interface GroupDetail {
  group: { id: string; name: string; emoji: string; inviteCode: string };
  members: Array<{
    userId: string;
    username: string;
    role: string;
    today: { totalPoints: number; puzzlesCompleted: number };
    season: { points: number; daysPlayed: number; fullSets: number; bestDay: number };
  }>;
  currentSeason: { number: number; startDate: string; endDate: string } | null;
}

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [tab, setTab] = useState<"today" | "season">("today");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<GroupDetail>(`/groups/${params.id}`)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load group"));
  }, [params.id]);

  if (error) {
    return (
      <div className="app-shell">
        <p className="text-sm font-medium text-orange-deep">{error}</p>
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="app-shell">
        <p className="text-sm font-medium text-ink-2">Loading…</p>
      </div>
    );
  }

  const sorted =
    tab === "today"
      ? [...detail.members].sort((a, b) => b.today.totalPoints - a.today.totalPoints)
      : [...detail.members].sort((a, b) => b.season.points - a.season.points);

  return (
    <div className="app-shell">
      <h1 className="mb-1 font-display text-2xl font-extrabold tracking-tight">
        {detail.group.emoji} {detail.group.name}
      </h1>
      <p className="mb-5 text-sm font-medium text-ink-2">Invite code: {detail.group.inviteCode}</p>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("today")}
          className={`rounded-pill px-4 py-2 text-sm font-bold ${tab === "today" ? "bg-ink text-white" : "bg-tray text-ink-2"}`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setTab("season")}
          className={`rounded-pill px-4 py-2 text-sm font-bold ${tab === "season" ? "bg-ink text-white" : "bg-tray text-ink-2"}`}
        >
          Season {detail.currentSeason?.number ?? ""}
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {sorted.map((member, rank) => (
          <div key={member.userId} className="leaderboard-row">
            <span className="w-[18px] text-center font-display text-base font-extrabold text-ink-2">{rank + 1}</span>
            <div className="min-w-0 flex-1">
              <b className="block text-[15px] font-bold">{member.username}</b>
              <span className="text-xs font-semibold text-ink-2">
                {tab === "today" ? `${member.today.puzzlesCompleted}/3 solved` : `${member.season.daysPlayed} days played`}
              </span>
            </div>
            <b className="font-display text-lg font-extrabold tracking-tight">
              {tab === "today" ? member.today.totalPoints : member.season.points}
            </b>
          </div>
        ))}
      </div>

      <TabBar />
    </div>
  );
}
