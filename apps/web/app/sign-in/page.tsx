"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "../../lib/supabaseClient";
import { apiFetch, ApiError } from "../../lib/apiClient";
import { BrandMark } from "../../components/BrandMark";

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      // Supabase Auth only knows email/phone, not usernames, so resolve the
      // username to its email first - the actual credential check still
      // happens entirely inside Supabase via signInWithPassword below.
      const { email } = await apiFetch<{ email: string }>("/auth/resolve-username", {
        method: "POST",
        body: JSON.stringify({ username })
      });

      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      router.replace("/");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError && err.status === 404 ? "No account with that username" : "Incorrect username or password");
    }
  }

  return (
    <div className="app-shell flex min-h-screen flex-col items-center justify-center">
      <BrandMark />

      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-card-rest">
        <h1 className="mb-1 font-display text-2xl font-extrabold tracking-tight">Sign in</h1>
        <p className="mb-6 text-sm font-medium text-ink-2">Your group's daily brain battle.</p>

        <form onSubmit={signIn} className="flex flex-col gap-3">
          <input
            type="text"
            required
            autoComplete="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-md border border-line bg-bg px-4 py-3 text-sm font-medium text-ink outline-none focus:border-violet"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-line bg-bg px-4 py-3 text-sm font-medium text-ink outline-none focus:border-violet"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-md bg-violet px-4 py-3 text-sm font-bold text-white shadow-play disabled:opacity-60"
          >
            {status === "submitting" ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {status === "error" && error && <p className="mt-4 text-sm font-medium text-orange-deep">{error}</p>}

        <p className="mt-6 text-center text-sm font-medium text-ink-2">
          New here?{" "}
          <Link href="/sign-up" className="font-bold text-violet no-underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
