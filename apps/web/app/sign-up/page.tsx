"use client";

import { useState } from "react";
import Link from "next/link";

import { createSupabaseBrowserClient } from "../../lib/supabaseClient";
import { apiFetch } from "../../lib/apiClient";
import { BrandMark } from "../../components/BrandMark";
import { UserAvatar } from "../../components/UserAvatar";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/;

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!USERNAME_PATTERN.test(username)) {
      setStatus("error");
      setError("Username must be 3-24 characters: letters, numbers, and underscores only");
      return;
    }
    setStatus("sending");

    try {
      const { available } = await apiFetch<{ available: boolean }>(
        `/auth/username-available?username=${encodeURIComponent(username)}`
      );
      if (!available) {
        setStatus("error");
        setError("That username is already taken");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      // Sign-up is passwordless (a magic link creates + verifies the account); the
      // username chosen here rides along in user_metadata so the API can use it
      // when it provisions the public.users row. Signing in later is username +
      // password only - the set-password step happens right after this link.
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/set-password")}`
        }
      });
      if (authError) throw authError;
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="app-shell flex min-h-screen flex-col items-center justify-center">
      <BrandMark />

      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-card-rest">
        <h1 className="mb-1 font-display text-2xl font-extrabold tracking-tight">Create an account</h1>
        <p className="mb-6 text-sm font-medium text-ink-2">We'll email you a link to verify it's you.</p>

        {status === "sent" ? (
          <p className="text-sm font-medium text-good">
            Check your email for a verification link. Click it to finish creating your account and set a password.
          </p>
        ) : (
          <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
            <div className="mb-2 flex flex-col items-center justify-center rounded-xl border border-line/60 bg-card/60 p-4">
              <UserAvatar
                name={username || "player"}
                size={68}
                animate="always"
                interactiveGaze={true}
                background="squircle"
              />
              <span className="mt-2 text-xs font-semibold text-ink-2">
                {username ? `Your creature: @${username}` : "Type a username to see your creature!"}
              </span>
            </div>
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
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-line bg-bg px-4 py-3 text-sm font-medium text-ink outline-none focus:border-violet"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-md bg-violet px-4 py-3 text-sm font-bold text-white shadow-play disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send verification link"}
            </button>
          </form>
        )}

        {status === "error" && error && <p className="mt-4 text-sm font-medium text-orange-deep">{error}</p>}

        <p className="mt-6 text-center text-sm font-medium text-ink-2">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-bold text-violet no-underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
