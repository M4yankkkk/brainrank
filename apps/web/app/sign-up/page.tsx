"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "../../lib/supabaseClient";
import { apiFetch } from "../../lib/apiClient";
import { BrandMark } from "../../components/BrandMark";
import { UserAvatar } from "../../components/UserAvatar";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/;

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!USERNAME_PATTERN.test(username)) {
      setStatus("error");
      setError("Username must be 3-24 characters: letters, numbers, and underscores only");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setError("Passwords don't match");
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
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (authError) throw authError;

      // If email confirmation is disabled, session is granted immediately
      if (data.session) {
        router.replace("/");
        return;
      }

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
        <p className="mb-6 text-sm font-medium text-ink-2">Choose your username and password to get started.</p>

        {status === "sent" ? (
          <div className="flex flex-col items-center text-center">
            <p className="mb-4 text-sm font-medium text-good">
              Verification email sent! Check your inbox to confirm your account, then sign in with your username and password.
            </p>
            <Link
              href="/sign-in"
              className="rounded-md bg-violet px-5 py-2.5 text-sm font-bold text-white shadow-play no-underline"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="flex flex-col gap-3">
            <div className="mb-2 flex flex-col items-center justify-center rounded-xl border border-line/60 bg-card/60 p-4">
              <UserAvatar
                name={username || "player"}
                size={68}
                animate="always"
                interactiveGaze={true}
                background="squircle"
              />
              <span className="mt-2 text-xs font-semibold text-ink-2">
                {username ? `@${username}` : "Type a username to see your creature"}
              </span>
            </div>
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="Username (letters, numbers, _)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-md border border-line bg-bg px-4 py-3 text-sm font-medium text-ink outline-none focus:border-violet"
            />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-line bg-bg px-4 py-3 text-sm font-medium text-ink outline-none focus:border-violet"
            />
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="Password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-line bg-bg px-4 py-3 text-sm font-medium text-ink outline-none focus:border-violet"
            />
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-md border border-line bg-bg px-4 py-3 text-sm font-medium text-ink outline-none focus:border-violet"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-md bg-violet px-4 py-3 text-sm font-bold text-white shadow-play disabled:opacity-60"
            >
              {status === "sending" ? "Creating account…" : "Create account"}
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
