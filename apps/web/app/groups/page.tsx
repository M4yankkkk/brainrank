"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiFetch } from "../../lib/apiClient";
import { TabBar } from "../../components/TabBar";
import { useToast } from "../../components/ToastProvider";
import { UserAvatar } from "../../components/UserAvatar";
import { useCurrentUser } from "../../lib/useCurrentUser";
import {
  TrophyIcon,
  CrownIcon,
  CopyIcon,
  CheckIcon,
  ClipboardIcon,
  CloseIcon,
  PlusIcon,
  HashIcon,
  SquadIcon,
  UsersIcon
} from "../../components/Icons";

interface Group {
  id: string;
  name: string;
  emoji: string;
  color: string;
  inviteCode: string;
  myRole: string;
  seasonLengthDays?: number;
  memberCount?: number;
}

const PRESET_ICONS = [
  { id: "brain", label: "Brain" },
  { id: "shield", label: "Shield" },
  { id: "zap", label: "Zap" },
  { id: "flame", label: "Flame" },
  { id: "trophy", label: "Trophy" },
  { id: "crown", label: "Crown" },
  { id: "target", label: "Target" },
  { id: "rocket", label: "Rocket" },
  { id: "star", label: "Star" },
  { id: "swords", label: "Swords" },
  { id: "award", label: "Award" },
  { id: "diamond", label: "Diamond" }
];

const PRESET_COLORS = [
  { name: "Violet", hex: "#7E62F0" },
  { name: "Teal", hex: "#14A89B" },
  { name: "Orange", hex: "#F26430" },
  { name: "Coral", hex: "#FF5757" },
  { name: "Gold", hex: "#F5A623" },
  { name: "Indigo", hex: "#4A69E2" },
  { name: "Emerald", hex: "#10B981" }
];

const SEASON_OPTIONS = [
  { days: 7, label: "7 Days", desc: "Weekly sprint" },
  { days: 14, label: "14 Days", desc: "Standard season" },
  { days: 28, label: "28 Days", desc: "Monthly battle" }
] as const;

export default function GroupsPage() {
  const router = useRouter();
  const showToast = useToast();
  const currentUser = useCurrentUser();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<"none" | "create" | "join">("none");

  // Create form state
  const [createName, setCreateName] = useState("");
  const [createIcon, setCreateIcon] = useState("brain");
  const [createColor, setCreateColor] = useState("#7E62F0");
  const [createSeasonDays, setCreateSeasonDays] = useState<7 | 14 | 28>(14);
  const [creating, setCreating] = useState(false);

  // Join form state
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      const data = await apiFetch<Group[]>("/groups");
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load squads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const newGroup = await apiFetch<Group>("/groups", {
        method: "POST",
        body: JSON.stringify({
          name: createName.trim(),
          emoji: createIcon || "brain",
          color: createColor || "#7E62F0",
          seasonLengthDays: createSeasonDays
        })
      });

      showToast(`Created squad "${newGroup.name}"`);
      setActiveAction("none");
      setCreateName("");
      router.push(`/groups/${newGroup.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create squad");
      showToast(err instanceof Error ? err.message : "Failed to create squad");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinGroup(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setError("Please enter a valid 6-character code");
      return;
    }
    setJoining(true);
    setError(null);

    try {
      const joinedGroup = await apiFetch<Group>("/groups/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: cleanCode })
      });

      showToast(`Joined squad "${joinedGroup.name}"`);
      setActiveAction("none");
      setJoinCode("");
      router.push(`/groups/${joinedGroup.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid invite code");
      showToast(err instanceof Error ? err.message : "Could not join squad");
    } finally {
      setJoining(false);
    }
  }

  async function copyCode(code: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showToast(`Copied code #${code}`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      showToast(`Invite code: ${code}`);
    }
  }

  async function pasteCode() {
    try {
      const text = await navigator.clipboard.readText();
      const match = text.trim().replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
      if (match) {
        setJoinCode(match);
        showToast("Pasted code from clipboard");
      }
    } catch {
      showToast("Could not access clipboard");
    }
  }

  return (
    <div className="app-shell pb-28">
      {/* Top Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet/10 text-violet shadow-sm">
              <TrophyIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                Squads
              </h1>
              <p className="text-xs font-medium text-ink-2">
                Compete daily with friends & co-workers
              </p>
            </div>
          </div>

          <div className="rounded-pill bg-tray px-3 py-1 text-xs font-bold text-ink-2">
            {groups.length} {groups.length === 1 ? "squad" : "squads"}
          </div>
        </div>

        {/* Action Buttons Switcher */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setActiveAction(activeAction === "create" ? "none" : "create")}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-sm font-bold transition-all ${
              activeAction === "create"
                ? "bg-violet text-white shadow-play scale-[1.02]"
                : "border border-line bg-card text-ink hover:border-violet/40 hover:bg-tray/40"
            }`}
          >
            <PlusIcon className="h-4 w-4" />
            Create Squad
          </button>

          <button
            type="button"
            onClick={() => setActiveAction(activeAction === "join" ? "none" : "join")}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-sm font-bold transition-all ${
              activeAction === "join"
                ? "bg-teal text-white shadow-play scale-[1.02]"
                : "border border-line bg-card text-ink hover:border-teal/40 hover:bg-tray/40"
            }`}
          >
            <HashIcon className="h-4 w-4" />
            Join with Code
          </button>
        </div>
      </header>

      {/* Interactive Action Drawer / Modal Card */}
      {activeAction === "create" && (
        <div className="mb-6 overflow-hidden rounded-3xl border border-violet/30 bg-card p-5 shadow-card animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
              Create a Squad
            </h2>
            <button
              type="button"
              onClick={() => setActiveAction("none")}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-tray text-ink-2 hover:text-ink transition-colors"
              aria-label="Close form"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Live Squad Preview Card */}
          <div
            className="relative mb-5 overflow-hidden rounded-2xl border p-4 text-left transition-all"
            style={{
              borderColor: `${createColor}40`,
              background: `linear-gradient(135deg, ${createColor}12 0%, var(--card) 75%)`
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl shadow-sm"
                style={{ background: `${createColor}25`, color: createColor }}
              >
                <SquadIcon name={createIcon} className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate font-display text-base font-extrabold text-ink">
                  {createName.trim() || "Squad Name"}
                </span>
                <div className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-ink-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                    <CrownIcon className="h-3 w-3" /> Owner
                  </span>
                  <span>{createSeasonDays}-day season</span>
                </div>
              </div>
              <span className="rounded-lg border border-line/60 bg-card/80 px-2 py-1 font-display text-xs font-bold text-ink-2">
                #PREVIEW
              </span>
            </div>
          </div>

          <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
            {/* Squad Name */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-2">
                Squad Name
              </label>
              <input
                type="text"
                required
                maxLength={60}
                placeholder="e.g. Brain Busters, Team Falcon"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm font-semibold text-ink outline-none transition-colors focus:border-violet"
              />
            </div>

            {/* Curated Icon Picker */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-2">
                Squad Icon
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => setCreateIcon(icon.id)}
                    className={`flex h-10 items-center justify-center rounded-xl transition-all ${
                      createIcon === icon.id
                        ? "scale-105 bg-ink text-white shadow-sm ring-2 ring-violet"
                        : "bg-tray text-ink-2 hover:scale-105 hover:text-ink hover:bg-line/60"
                    }`}
                    title={icon.label}
                    aria-label={icon.label}
                  >
                    <SquadIcon name={icon.id} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Color Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-2">
                Theme Color
              </label>
              <div className="flex items-center gap-2.5">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setCreateColor(col.hex)}
                    style={{ backgroundColor: col.hex }}
                    className={`h-7 w-7 rounded-full transition-transform ${
                      createColor === col.hex ? "scale-125 ring-2 ring-ink ring-offset-2" : "hover:scale-110"
                    }`}
                    title={col.name}
                    aria-label={col.name}
                  />
                ))}
              </div>
            </div>

            {/* Season Length Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-2">
                Season Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SEASON_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setCreateSeasonDays(opt.days)}
                    className={`rounded-xl border p-2 text-center transition-all ${
                      createSeasonDays === opt.days
                        ? "border-violet bg-violet/10 font-bold text-violet"
                        : "border-line bg-card text-ink-2 hover:text-ink"
                    }`}
                  >
                    <b className="block text-xs font-extrabold">{opt.label}</b>
                    <span className="block text-[10px] text-ink-3">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={creating || !createName.trim()}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-violet py-3 px-4 text-sm font-bold text-white shadow-play transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {creating ? "Creating Squad…" : "Launch Squad"}
            </button>
          </form>
        </div>
      )}

      {/* Join Squad Drawer */}
      {activeAction === "join" && (
        <div className="mb-6 overflow-hidden rounded-3xl border border-teal/30 bg-card p-5 shadow-card animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
                Join a Squad
              </h2>
              <p className="text-xs font-medium text-ink-2">
                Enter the 6-letter invite code from a squad member
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveAction("none")}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-tray text-ink-2 hover:text-ink transition-colors"
              aria-label="Close form"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <form onSubmit={handleJoinGroup} className="mt-4 flex flex-col gap-3">
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="w-full rounded-2xl border-2 border-line bg-bg py-3.5 px-4 text-center font-display text-2xl font-extrabold tracking-[0.3em] uppercase text-ink outline-none transition-colors focus:border-teal"
              />
              <button
                type="button"
                onClick={pasteCode}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1 text-xs font-bold text-ink-2 shadow-sm border border-line hover:text-ink hover:bg-tray"
              >
                <ClipboardIcon className="h-3.5 w-3.5" />
                Paste
              </button>
            </div>

            <button
              type="submit"
              disabled={joining || joinCode.trim().length !== 6}
              className="flex items-center justify-center gap-2 rounded-xl bg-teal py-3 px-4 text-sm font-bold text-white shadow-play transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {joining ? "Joining Squad…" : "Join Squad"}
            </button>
          </form>
        </div>
      )}

      {/* Error notification if any */}
      {error && (
        <div className="mb-4 rounded-xl border border-orange/20 bg-orange-soft/40 p-3 text-xs font-semibold text-orange-deep">
          {error}
        </div>
      )}

      {/* Squads List Section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-ink-2">
            Your Squads
          </h2>
          {groups.length > 0 && (
            <span className="text-xs font-medium text-ink-3">
              Tap a squad to view leaderboard
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-20 animate-pulse rounded-2xl border border-line bg-card/60 p-4"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          /* High-polish Empty State */
          <div className="relative overflow-hidden rounded-3xl border border-line bg-card p-7 text-center shadow-card">
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full bg-violet/15 blur-2xl" />

            <div className="relative mb-3 flex items-center justify-center">
              <UserAvatar
                name={currentUser?.username || "player"}
                size={76}
                animate="always"
                background="squircle"
              />
            </div>

            <h3 className="font-display text-xl font-extrabold tracking-tight text-ink">
              No Squads Joined Yet
            </h3>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-ink-2 max-w-xs mx-auto">
              Brainrank is much more fun in a squad. Compete daily with your friends, family, or colleagues for the seasonal #1 trophy.
            </p>

            <div className="mt-5 flex flex-col gap-2 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setActiveAction("create")}
                className="inline-flex items-center justify-center gap-1.5 w-full rounded-pill bg-violet py-2.5 px-4 text-xs font-bold text-white shadow-play transition-transform active:scale-95"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Create Your First Squad
              </button>
              <button
                type="button"
                onClick={() => setActiveAction("join")}
                className="inline-flex items-center justify-center gap-1.5 w-full rounded-pill border border-line bg-card py-2.5 px-4 text-xs font-bold text-ink transition-colors hover:bg-tray active:scale-95"
              >
                <HashIcon className="h-3.5 w-3.5" />
                Enter an Invite Code
              </button>
            </div>
          </div>
        ) : (
          /* Rich Squad Cards */
          <div className="flex flex-col gap-3">
            {groups.map((g) => {
              const isOwner = g.myRole === "owner";
              const themeColor = g.color || "var(--violet)";
              const memberCount = g.memberCount ?? 1;

              return (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-card p-4 shadow-sm transition-all duration-200 hover:border-violet/50 hover:shadow-card-rest hover:-translate-y-1 active:translate-y-0"
                  style={{
                    background: `linear-gradient(145deg, ${themeColor}12 0%, var(--card) 50%)`
                  }}
                >
                  {/* Subtle Ambient Glow */}
                  <div
                    className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl opacity-50 transition-opacity group-hover:opacity-80"
                    style={{ background: themeColor }}
                  />

                  {/* Header Row: Emblem, Title, Role, Member Count, Chevron */}
                  <div className="relative mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Squad Emblem */}
                      <div
                        className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl shadow-sm transition-transform duration-200 group-hover:scale-105"
                        style={{
                          backgroundColor: `${themeColor}22`,
                          border: `1.5px solid ${themeColor}40`,
                          color: themeColor
                        }}
                      >
                        <SquadIcon name={g.emoji} className="h-7 w-7" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <b className="block truncate font-display text-lg font-extrabold text-ink group-hover:text-violet transition-colors">
                          {g.name}
                        </b>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {isOwner ? (
                            <span className="inline-flex items-center gap-1 rounded-pill bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                              <CrownIcon className="h-3 w-3" /> Owner
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-pill bg-tray border border-line px-2 py-0.5 text-[10px] font-semibold text-ink-2">
                              Member
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-2">
                            <UsersIcon className="h-3.5 w-3.5 text-ink-3" />
                            <span>{memberCount} {memberCount === 1 ? "member" : "members"}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Arrow Button */}
                    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-tray text-ink-2 transition-all group-hover:bg-violet group-hover:text-white group-hover:translate-x-0.5">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Mid Status Strip: Active Season & Invite Code Pill */}
                  <div className="relative flex items-center justify-between rounded-2xl border border-line/60 bg-tray/60 px-3 py-2 text-xs backdrop-blur-xs">
                    <div className="flex items-center gap-1.5 font-bold text-ink-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px]">{g.seasonLengthDays || 14}-Day Active Season</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => copyCode(g.inviteCode, e)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line/70 bg-card px-2.5 py-1 font-mono text-[11px] font-bold text-ink shadow-xs transition-colors hover:bg-tray hover:text-violet"
                      title="Copy squad invite code"
                    >
                      <span>#{g.inviteCode}</span>
                      {copiedCode === g.inviteCode ? (
                        <CheckIcon className="h-3.5 w-3.5 text-good" />
                      ) : (
                        <CopyIcon className="h-3.5 w-3.5 text-ink-3" />
                      )}
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <TabBar />
    </div>
  );
}
