"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createSupabaseBrowserClient } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";
import { todayLocalDate, msUntilLocalMidnight } from "../lib/localDate";
import { PuzzleCard, type PuzzleId } from "../components/PuzzleCard";
import { TabBar } from "../components/TabBar";
import { useToast } from "../components/ToastProvider";
import { UserAvatar } from "../components/UserAvatar";
import { useCurrentUser } from "../lib/useCurrentUser";
import { FlameIcon } from "../components/Icons";

interface TodayPuzzle {
  id: string;
  type: PuzzleId;
  difficulty: "easy" | "medium" | "hard" | "weekend";
  attempt: { solved: boolean; points: number; activeTimeMs: number; hintsUsed: number } | null;
}

interface TodayResponse {
  date: string;
  puzzles: TodayPuzzle[];
}

interface StatsRow {
  puzzleType: PuzzleId;
  streak: number;
}

interface GroupSummary {
  id: string;
  name: string;
}

interface GroupMember {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  role: string;
  today: { totalPoints: number; puzzlesCompleted: number };
  season: { points: number; daysPlayed: number; fullSets: number; bestDay: number };
}

interface GroupDetail {
  group: { id: string; name: string };
  members: GroupMember[];
  currentSeason: { number: number; startDate: string; endDate: string } | null;
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export default function HomePage() {
  const router = useRouter();
  const showToast = useToast();
  const currentUser = useCurrentUser();

  const [userId, setUserId] = useState<string | null>(null);
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [stats, setStats] = useState<StatsRow[]>([]);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [squadTab, setSquadTab] = useState<"today" | "season">("today");
  const [countdown, setCountdown] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/sign-in");
        return;
      }
      setUserId(session.user.id);
    });
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const [todayRes, statsRes, groups] = await Promise.all([
          apiFetch<TodayResponse>(`/puzzles/today?date=${todayLocalDate()}`),
          apiFetch<StatsRow[]>("/stats"),
          apiFetch<GroupSummary[]>("/groups")
        ]);
        if (cancelled) return;
        setToday(todayRes);
        setStats(statsRes);

        if (groups.length > 0) {
          const detail = await apiFetch<GroupDetail>(`/groups/${groups[0].id}?date=${todayLocalDate()}`);
          if (!cancelled) setGroup(detail);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    function tick() {
      const ms = msUntilLocalMidnight();
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setCountdown(`New puzzles in ${h}h ${m}m`);
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  function openPuzzle(type: PuzzleId, done: boolean) {
    showToast(done ? "Nice work — reopening your result." : `Opening ${type[0].toUpperCase()}${type.slice(1)}…`);
    router.push(`/puzzle/${type}`);
  }

  const totalPoints = today?.puzzles.reduce((sum, p) => sum + (p.attempt?.points ?? 0), 0) ?? 0;
  const solvedCount = today?.puzzles.filter((p) => p.attempt?.solved).length ?? 0;
  const bestStreak = stats.length > 0 ? Math.max(...stats.map((s) => s.streak)) : null;
  const sortedSquadMembers = group
    ? squadTab === "today"
      ? [...group.members].sort((a, b) => b.today.totalPoints - a.today.totalPoints)
      : [...group.members].sort((a, b) => b.season.points - a.season.points)
    : [];

  if (error) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-center">
        <p className="text-sm font-medium text-ink-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="mb-[22px] flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-[22px] font-extrabold tracking-tight">
          <span className="grid h-[26px] w-[26px] grid-cols-2 gap-[3px] rounded-lg bg-ink p-[5px]">
            <i className="rounded-[2px] bg-violet" />
            <i className="rounded-[2px] bg-bg" />
            <i className="rounded-[2px] bg-bg" />
            <i className="rounded-[2px] bg-orange" />
          </span>
          Brainrank
        </div>
        <div className="flex items-center gap-2.5">
          {bestStreak !== null && bestStreak > 0 && (
            <div className="flex items-center gap-1.5 rounded-pill bg-card py-[7px] pl-2.5 pr-3 text-sm font-bold shadow-streak">
              <FlameIcon className="h-4 w-4 text-orange" />
              <span>{bestStreak}</span>
            </div>
          )}
          <Link href="/profile" className="transition-transform active:scale-95" title="View Profile">
            <UserAvatar
              name={currentUser?.username ?? group?.members.find((m) => m.userId === userId)?.username ?? "player"}
              src={currentUser?.avatarUrl ?? group?.members.find((m) => m.userId === userId)?.avatarUrl}
              size={36}
              animate="hover"
            />
          </Link>
        </div>
      </header>

      <section className="mb-[18px] flex items-end justify-between">
        <div>
          <h1 className="m-0 mb-2 font-display text-[34px] font-extrabold leading-none tracking-tight">Today&apos;s set</h1>
          <p className="m-0 text-sm font-medium text-ink-2">{countdown}</p>
        </div>
        <div className="text-right">
          <b className="block font-display text-[40px] font-extrabold leading-none tracking-tight">{totalPoints}</b>
          <span className="text-[13px] font-semibold text-ink-2">
            of {today?.puzzles.length ? today.puzzles.length * 100 : 300} points
          </span>
        </div>
      </section>

      <div className="mb-5 flex gap-1.5" aria-label={`${solvedCount} of ${today?.puzzles.length ?? 3} puzzles done`}>
        {(today?.puzzles ?? [0, 1, 2]).map((_, i) => (
          <i key={i} className={`h-2 flex-1 rounded-pill ${i < solvedCount ? "bg-violet" : "bg-line"}`} />
        ))}
      </div>

      <section className="mb-[30px] flex flex-col gap-3.5">
        {today?.puzzles.map((puzzle, i) => (
          <PuzzleCard
            key={puzzle.id}
            type={puzzle.type}
            difficulty={puzzle.difficulty}
            index={i}
            attempt={puzzle.attempt}
            onOpen={(type) => openPuzzle(type, puzzle.attempt?.solved ?? false)}
          />
        ))}
        {!today && <p className="text-sm font-medium text-ink-2">Loading today&apos;s puzzles…</p>}
      </section>

      {group && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="m-0 font-display text-[22px] font-extrabold tracking-tight">{group.group.name}</h3>
            <a href={`/groups/${group.group.id}`} className="text-sm font-bold text-violet no-underline">
              See group
            </a>
          </div>
          <div className="season-panel">
            <div className="mx-1 mb-3 flex items-center justify-between">
              <div className="flex rounded-xl bg-tray/80 p-0.5">
                <button
                  type="button"
                  onClick={() => setSquadTab("today")}
                  className={`rounded-lg py-1 px-2.5 text-xs font-bold transition-all ${
                    squadTab === "today" ? "bg-card text-ink shadow-sm" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  Today&apos;s Battle
                </button>
                <button
                  type="button"
                  onClick={() => setSquadTab("season")}
                  className={`rounded-lg py-1 px-2.5 text-xs font-bold transition-all ${
                    squadTab === "season" ? "bg-card text-ink shadow-sm" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  Season Standings
                </button>
              </div>
              {group.currentSeason && (
                <span className="text-xs font-semibold text-ink-2">
                  Season {group.currentSeason.number}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              {sortedSquadMembers.map((member, rank) => (
                <div key={member.userId} className={`leaderboard-row ${member.userId === userId ? "you" : ""}`}>
                  <span className="w-[18px] text-center font-display text-base font-extrabold text-ink-2">{rank + 1}</span>
                  <UserAvatar
                    name={member.username}
                    src={member.avatarUrl}
                    size={34}
                    animate="hover"
                    crown={rank === 0}
                  />
                  <div className="min-w-0 flex-1">
                    <b className="block text-[15px] font-bold text-ink">{member.userId === userId ? "You" : member.username}</b>
                    <span className="block text-[11px] font-semibold text-ink-2">
                      {squadTab === "today"
                        ? `${member.today.puzzlesCompleted}/3 solved`
                        : `${member.season.daysPlayed} days active`}
                    </span>
                  </div>
                  <div className="text-right flex-none">
                    <b className="block font-display text-lg font-extrabold tracking-tight text-ink">
                      {squadTab === "today" ? member.today.totalPoints : member.season.points}
                    </b>
                    <span className="block text-[10px] font-semibold text-ink-3">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <TabBar />
    </div>
  );
}
