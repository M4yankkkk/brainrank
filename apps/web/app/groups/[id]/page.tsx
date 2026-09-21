"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { apiFetch } from "../../../lib/apiClient";
import { TabBar } from "../../../components/TabBar";
import { UserAvatar } from "../../../components/UserAvatar";
import { useToast } from "../../../components/ToastProvider";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import {
  SquadIcon,
  CrownIcon,
  CopyIcon,
  CheckIcon,
  FlameIcon,
  ShareIcon,
  ArrowLeftIcon
} from "../../../components/Icons";

interface GroupMember {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  role: string;
  today: { totalPoints: number; puzzlesCompleted: number };
  season: { points: number; daysPlayed: number; fullSets: number; bestDay: number };
}

interface GroupDetail {
  group: {
    id: string;
    name: string;
    emoji: string;
    color: string;
    inviteCode: string;
    ownerId: string;
    seasonLengthDays: number;
  };
  members: GroupMember[];
  currentSeason: { number: number; startDate: string; endDate: string } | null;
}

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const showToast = useToast();
  const currentUser = useCurrentUser();

  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [tab, setTab] = useState<"today" | "season">("today");
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<GroupDetail>(`/groups/${params.id}`)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load squad"));
  }, [params.id]);

  if (error) {
    return (
      <div className="app-shell pb-28">
        <Link
          href="/groups"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-ink-2 hover:text-ink"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Back to Squads
        </Link>
        <div className="rounded-2xl border border-orange/20 bg-card p-6 text-center shadow-card">
          <p className="text-sm font-semibold text-orange-deep">{error}</p>
          <Link
            href="/groups"
            className="mt-4 inline-block rounded-pill bg-violet px-4 py-2 text-xs font-bold text-white shadow-play"
          >
            Return to Squads
          </Link>
        </div>
        <TabBar />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="app-shell pb-28">
        <div className="mb-4 h-6 w-24 animate-pulse rounded-md bg-tray" />
        <div className="mb-6 h-40 animate-pulse rounded-3xl bg-card" />
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 animate-pulse rounded-2xl bg-card/60" />
          ))}
        </div>
        <TabBar />
      </div>
    );
  }

  const { group, members, currentSeason } = detail;
  const isOwner = currentUser?.id === group.ownerId;
  const themeColor = group.color || "#7E62F0";

  // Calculate season days remaining
  let seasonProgressPercent = 50;
  let seasonDaysLeft = 0;
  if (currentSeason) {
    const start = new Date(currentSeason.startDate).getTime();
    const end = new Date(currentSeason.endDate).getTime();
    const now = Date.now();
    const total = end - start;
    if (total > 0) {
      const elapsed = Math.max(0, Math.min(now - start, total));
      seasonProgressPercent = Math.round((elapsed / total) * 100);
      seasonDaysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    }
  }

  const sortedMembers =
    tab === "today"
      ? [...members].sort((a, b) => b.today.totalPoints - a.today.totalPoints)
      : [...members].sort((a, b) => b.season.points - a.season.points);

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopiedCode(true);
      showToast(`Copied squad code #${group.inviteCode}`);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      showToast(`Squad invite code: ${group.inviteCode}`);
    }
  }

  async function shareSquad() {
    const text = `Join my Brainrank squad "${group.name}" with code ${group.inviteCode}!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Brainrank - ${group.name}`,
          text,
          url: window.location.href
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    copyInviteCode();
  }

  return (
    <div className="app-shell pb-28">
      {/* Back Nav */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink-2 shadow-sm transition-colors hover:text-ink hover:bg-tray"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Squads
        </Link>

        <button
          type="button"
          onClick={shareSquad}
          className="inline-flex items-center gap-1.5 rounded-pill bg-violet/10 px-3 py-1.5 text-xs font-bold text-violet transition-colors hover:bg-violet/20"
        >
          <ShareIcon className="h-3.5 w-3.5" />
          <span>Share</span>
        </button>
      </div>

      {/* Hero Squad Banner */}
      <div
        className="relative mb-6 overflow-hidden rounded-3xl border p-5 shadow-card"
        style={{
          borderColor: `${themeColor}40`,
          background: `linear-gradient(145deg, ${themeColor}15 0%, var(--card) 60%)`
        }}
      >
        <div className="pointer-events-none absolute -top-12 -right-8 h-32 w-32 rounded-full blur-2xl" style={{ background: `${themeColor}25` }} />

        <div className="flex items-start gap-3.5">
          <div
            className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl shadow-sm"
            style={{
              backgroundColor: `${themeColor}22`,
              border: `1.5px solid ${themeColor}40`,
              color: themeColor
            }}
          >
            <SquadIcon name={group.emoji} className="h-8 w-8" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
              {group.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {isOwner ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  <CrownIcon className="h-3 w-3" /> You Own this Squad
                </span>
              ) : (
                <span className="rounded-md bg-tray px-2 py-0.5 text-[11px] font-semibold text-ink-2">
                  Member
                </span>
              )}
              <span className="text-xs font-bold text-ink-2">
                {members.length} {members.length === 1 ? "member" : "members"}
              </span>
            </div>
          </div>
        </div>

        {/* Invite Code Quick Banner */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-line/70 bg-card/80 p-3 backdrop-blur-sm">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-3">
              Invite Code
            </span>
            <code className="font-display text-base font-extrabold tracking-widest text-ink">
              #{group.inviteCode}
            </code>
          </div>

          <button
            type="button"
            onClick={copyInviteCode}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink shadow-sm transition-all hover:bg-tray active:scale-95"
          >
            {copiedCode ? (
              <>
                <CheckIcon className="h-3.5 w-3.5 text-good" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <CopyIcon className="h-3.5 w-3.5 text-ink-2" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Season Timeline Progress */}
        {currentSeason && (
          <div className="mt-3.5 pt-3 border-t border-line/60">
            <div className="flex items-center justify-between text-[11px] font-semibold text-ink-2 mb-1.5">
              <span>Season {currentSeason.number}</span>
              <span className="inline-flex items-center gap-1">
                {seasonDaysLeft > 0 ? (
                  <>
                    <FlameIcon className="h-3.5 w-3.5 text-orange" />
                    <span>{seasonDaysLeft} days left</span>
                  </>
                ) : (
                  "Season ending soon"
                )}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-pill bg-tray overflow-hidden">
              <div
                className="h-full rounded-pill transition-all duration-500"
                style={{
                  width: `${seasonProgressPercent}%`,
                  backgroundColor: themeColor
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Segmented Leaderboard Tabs */}
      <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-tray p-1">
        <button
          type="button"
          onClick={() => setTab("today")}
          className={`rounded-xl py-2 px-3 text-xs font-extrabold transition-all ${
            tab === "today"
              ? "bg-card text-ink shadow-sm scale-[1.01]"
              : "text-ink-2 hover:text-ink"
          }`}
        >
          Today&apos;s Battle
        </button>
        <button
          type="button"
          onClick={() => setTab("season")}
          className={`rounded-xl py-2 px-3 text-xs font-extrabold transition-all ${
            tab === "season"
              ? "bg-card text-ink shadow-sm scale-[1.01]"
              : "text-ink-2 hover:text-ink"
          }`}
        >
          Season Standings
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="flex flex-col gap-2">
        {sortedMembers.map((member, index) => {
          const isMe = member.userId === currentUser?.id;
          const rank = index + 1;

          return (
            <div
              key={member.userId}
              className={`leaderboard-row relative transition-transform duration-150 ${
                isMe ? "you ring-2 ring-violet/50 shadow-sm" : ""
              }`}
            >
              {/* Rank Position with clean badges for Top 3 */}
              <div className="w-7 text-center flex-none">
                {rank === 1 ? (
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-black text-amber-500 border border-amber-500/40"
                    title="Rank 1"
                  >
                    1
                  </span>
                ) : rank === 2 ? (
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-300/25 text-xs font-black text-slate-500 dark:text-slate-300 border border-slate-400/40"
                    title="Rank 2"
                  >
                    2
                  </span>
                ) : rank === 3 ? (
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-700/20 text-xs font-black text-amber-700 dark:text-amber-500 border border-amber-700/40"
                    title="Rank 3"
                  >
                    3
                  </span>
                ) : (
                  <span className="font-display text-sm font-extrabold text-ink-3">
                    {rank}
                  </span>
                )}
              </div>

              {/* Avatar with Crown for Rank 1 */}
              <UserAvatar
                name={member.username}
                src={member.avatarUrl}
                size={38}
                animate="hover"
                crown={rank === 1}
              />

              {/* Member Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <b className="truncate text-sm font-bold text-ink">
                    {member.username}
                  </b>
                  {isMe && (
                    <span className="rounded-md bg-violet/15 px-1.5 py-0.2 text-[9px] font-bold text-violet flex-none">
                      YOU
                    </span>
                  )}
                  {member.role === "owner" && (
                    <CrownIcon className="h-3 w-3 text-amber-500 flex-none" title="Squad Owner" />
                  )}
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-ink-2">
                  {tab === "today" ? (
                    <>
                      <span>{member.today.puzzlesCompleted}/3 solved</span>
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((dotIndex) => (
                          <span
                            key={dotIndex}
                            className={`h-1.5 w-1.5 rounded-full ${
                              dotIndex < member.today.puzzlesCompleted
                                ? "bg-violet"
                                : "bg-line"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <span>
                      {member.season.daysPlayed} days · {member.season.fullSets} full sets
                    </span>
                  )}
                </div>
              </div>

              {/* Points Score */}
              <div className="text-right flex-none">
                <b className="block font-display text-lg font-extrabold tracking-tight text-ink">
                  {tab === "today" ? member.today.totalPoints : member.season.points}
                </b>
                <span className="block text-[10px] font-semibold text-ink-3">
                  pts
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Solo Member Callout */}
      {members.length === 1 && (
        <div className="mt-6 rounded-2xl border border-line bg-card p-4 text-center">
          <p className="text-xs font-semibold text-ink-2">
            You&apos;re the only one here right now! Invite your friends with code{" "}
            <b className="font-mono text-ink">#{group.inviteCode}</b> to start the daily competition.
          </p>
          <button
            type="button"
            onClick={shareSquad}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-pill bg-violet px-3.5 py-1.5 text-xs font-bold text-white shadow-play"
          >
            <ShareIcon className="h-3.5 w-3.5" />
            <span>Invite Friends</span>
          </button>
        </div>
      )}

      <TabBar />
    </div>
  );
}
