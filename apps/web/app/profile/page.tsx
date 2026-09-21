"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { idle, happy, sad, type Expression } from "blobatar/expression";

import { createSupabaseBrowserClient } from "../../lib/supabaseClient";
import { apiFetch } from "../../lib/apiClient";
import { TabBar } from "../../components/TabBar";
import { UserAvatar } from "../../components/UserAvatar";
import { useCurrentUser, clearUserCache } from "../../lib/useCurrentUser";
import { FlameIcon, SquadIcon, CheckIcon, CopyIcon } from "../../components/Icons";

interface StatsRow {
  puzzleType: "starfield" | "shiftword" | "unblock";
  played: number;
  avgPoints: number;
  best: number;
  streak: number;
}

interface UserGroup {
  id: string;
  name: string;
  emoji: string;
  color: string;
  inviteCode: string;
  myRole: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsRow[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [currentExpression, setCurrentExpression] = useState<"idle" | "happy" | "sad">("idle");
  const [copiedId, setCopiedId] = useState(false);

  const expressions: Record<"idle" | "happy" | "sad", Expression> = {
    idle,
    happy,
    sad
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/sign-in");
        return;
      }
      const created = session.user.created_at;
      if (created) {
        const date = new Date(created);
        setMemberSince(
          date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        );
      }
    });

    apiFetch<StatsRow[]>("/stats/me")
      .then(setStats)
      .catch(() => setStats([]));

    apiFetch<UserGroup[]>("/groups")
      .then(setGroups)
      .catch(() => setGroups([]));
  }, [router]);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    clearUserCache();
    router.replace("/sign-in");
  }

  const userId = currentUser?.id ?? null;
  const username = currentUser?.username ?? null;
  const email = currentUser?.email ?? null;
  const avatarName = username || "player";

  function copyUserId() {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  const totalPlayed = stats.reduce((sum, s) => sum + s.played, 0);
  const bestScore = stats.length > 0 ? Math.max(...stats.map((s) => s.best)) : 0;
  const maxStreak = stats.length > 0 ? Math.max(...stats.map((s) => s.streak)) : 0;

  return (
    <div className="app-shell pb-28">
      {/* Top Header */}
      <header className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Profile</h1>
        <button
          type="button"
          onClick={signOut}
          className="rounded-pill border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink-2 transition-colors hover:border-orange hover:text-orange"
        >
          Sign out
        </button>
      </header>

      {/* Hero Blobatar Creature Card */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-line bg-card p-6 text-center shadow-card">
        {/* Glow Accent */}
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full bg-violet/15 blur-2xl" />

        <div className="relative mb-3 flex items-center justify-center">
          <UserAvatar
            name={avatarName}
            src={currentUser?.avatarUrl}
            size={104}
            animate="always"
            interactiveGaze={true}
            expression={expressions[currentExpression]}
            background="squircle"
            className="transition-transform duration-300 hover:scale-105 drop-shadow-md"
          />
        </div>

        {/* Username shown first */}
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          {username ? `@${username}` : "…"}
        </h2>
        {/* Email shown directly below it */}
        <p className="mt-1 text-sm font-medium text-ink-2">{email ?? "…"}</p>
        {memberSince && (
          <span className="mt-2 inline-block rounded-pill bg-tray px-3 py-1 text-xs font-semibold text-ink-3">
            Member since {memberSince}
          </span>
        )}

        {/* Playful expression selector */}
        <div className="mt-5 flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold text-ink-2 uppercase tracking-wider">
            Blobatar Emotion
          </span>
          <div className="flex items-center gap-1 rounded-pill bg-tray p-1">
            {(["idle", "happy", "sad"] as const).map((expr) => (
              <button
                key={expr}
                type="button"
                onClick={() => setCurrentExpression(expr)}
                className={`rounded-pill px-3 py-1 text-xs font-bold transition-all ${
                  currentExpression === expr
                    ? "bg-ink text-white shadow-sm scale-105"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                {expr === "idle" ? "Idle" : expr === "happy" ? "Happy" : "Sad"}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-ink-3">
            Move your cursor — your Blobatar&apos;s eyes follow your pointer!
          </p>
        </div>
      </div>

      {/* Career Stats Grid */}
      <section className="mb-6">
        <h3 className="mb-3 font-display text-lg font-bold tracking-tight text-ink">
          Career Stats
        </h3>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-line bg-card p-3.5 text-center shadow-sm">
            <span className="block text-xs font-semibold text-ink-2">Puzzles</span>
            <b className="mt-1 block font-display text-2xl font-extrabold text-ink">
              {totalPlayed}
            </b>
          </div>
          <div className="rounded-2xl border border-line bg-card p-3.5 text-center shadow-sm">
            <span className="block text-xs font-semibold text-ink-2">Best Score</span>
            <b className="mt-1 block font-display text-2xl font-extrabold text-accent">
              {bestScore}
            </b>
          </div>
          <div className="rounded-2xl border border-line bg-card p-3.5 text-center shadow-sm">
            <span className="block text-xs font-semibold text-ink-2">Streak</span>
            <b className="mt-1 flex items-center justify-center gap-1 font-display text-2xl font-extrabold text-orange">
              <FlameIcon className="h-5 w-5" />
              <span>{maxStreak}</span>
            </b>
          </div>
        </div>
      </section>

      {/* My Groups Section */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold tracking-tight text-ink">
            My Groups
          </h3>
          <Link
            href="/groups"
            className="text-xs font-bold text-violet hover:underline"
          >
            Manage
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card p-4 text-center">
            <p className="text-xs font-medium text-ink-2">You haven&apos;t joined any groups yet.</p>
            <Link
              href="/groups"
              className="mt-2 inline-block rounded-pill bg-violet px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
            >
              Find or create a group
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="flex items-center justify-between rounded-xl border border-line bg-card p-3 transition-colors hover:bg-tray/50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet/10 text-violet flex-none">
                    <SquadIcon name={g.emoji} className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <b className="block text-sm font-bold text-ink">{g.name}</b>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-2">
                      {g.myRole}
                    </span>
                  </div>
                </div>
                <span className="font-display text-xs font-extrabold text-ink-2">
                  #{g.inviteCode}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Account Info & ID */}
      <section className="rounded-2xl border border-line bg-card p-4">
        <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-ink-2">
          Account Details
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <span className="text-xs font-semibold text-ink-2">Username</span>
            <b className="text-sm font-bold text-ink">{username ? `@${username}` : "…"}</b>
          </div>
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <span className="text-xs font-semibold text-ink-2">Email Address</span>
            <span className="text-sm font-medium text-ink">{email ?? "…"}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-ink-2">Account ID</span>
              <code className="text-[11px] text-ink-3">
                {userId ? `${userId.slice(0, 8)}...${userId.slice(-6)}` : "…"}
              </code>
            </div>
            <button
              type="button"
              onClick={copyUserId}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink hover:bg-tray transition-colors"
            >
              {copiedId ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5 text-good" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <CopyIcon className="h-3.5 w-3.5 text-ink-2" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <div className="mt-8 text-center text-xs text-ink-3">
        Brainrank · Avatars powered by{" "}
        <a
          href="https://github.com/Alain00/blobatar"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-ink-2 underline hover:text-ink"
        >
          Blobatar
        </a>
      </div>

      <TabBar />
    </div>
  );
}
