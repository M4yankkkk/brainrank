"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "../../lib/supabaseClient";
import { TabBar } from "../../components/TabBar";

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/sign-in");
  }

  return (
    <div className="app-shell">
      <h1 className="mb-5 font-display text-2xl font-extrabold tracking-tight">Profile</h1>
      <p className="mb-6 text-sm font-medium text-ink-2">{email ?? "…"}</p>
      <button
        type="button"
        onClick={signOut}
        className="rounded-md border border-line bg-card px-4 py-3 text-sm font-semibold text-ink"
      >
        Sign out
      </button>
      <TabBar />
    </div>
  );
}
