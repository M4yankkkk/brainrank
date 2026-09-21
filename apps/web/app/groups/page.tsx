"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { apiFetch } from "../../lib/apiClient";
import { TabBar } from "../../components/TabBar";

interface Group {
  id: string;
  name: string;
  emoji: string;
  color: string;
  inviteCode: string;
  myRole: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setGroups(await apiFetch<Group[]>("/groups"));
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Failed to load groups"));
  }, []);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/groups", { method: "POST", body: JSON.stringify({ name }) });
      setName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create group");
    } finally {
      setBusy(false);
    }
  }

  async function joinGroup(e: React.FormEvent) {
    e.preventDefault();
    if (joinCode.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/groups/join", { method: "POST", body: JSON.stringify({ inviteCode: joinCode.toUpperCase() }) });
      setJoinCode("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join group");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <h1 className="mb-5 font-display text-2xl font-extrabold tracking-tight">Groups</h1>

      <div className="mb-6 flex flex-col gap-2.5">
        {groups.map((g) => (
          <Link key={g.id} href={`/groups/${g.id}`} className="leaderboard-row no-underline">
            <span className="text-xl">{g.emoji}</span>
            <div className="min-w-0 flex-1">
              <b className="block text-[15px] font-bold text-ink">{g.name}</b>
              <span className="text-xs font-semibold text-ink-2">Code {g.inviteCode}</span>
            </div>
          </Link>
        ))}
        {groups.length === 0 && <p className="text-sm font-medium text-ink-2">You haven&apos;t joined a group yet.</p>}
      </div>

      {error && <p className="mb-4 text-sm font-medium text-orange-deep">{error}</p>}

      <form onSubmit={createGroup} className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New group name"
          className="flex-1 rounded-md border border-line bg-card px-3 py-2.5 text-sm font-medium outline-none focus:border-violet"
        />
        <button type="submit" disabled={busy} className="rounded-md bg-violet px-4 py-2.5 text-sm font-bold text-white shadow-play">
          Create
        </button>
      </form>

      <form onSubmit={joinGroup} className="flex gap-2">
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Invite code"
          maxLength={6}
          className="flex-1 rounded-md border border-line bg-card px-3 py-2.5 text-sm font-medium uppercase tracking-widest outline-none focus:border-violet"
        />
        <button type="submit" disabled={busy} className="rounded-md bg-teal px-4 py-2.5 text-sm font-bold text-white shadow-play">
          Join
        </button>
      </form>

      <TabBar />
    </div>
  );
}
