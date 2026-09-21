"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";

import { createSupabaseBrowserClient } from "../../../lib/supabaseClient";
import { BrandMark } from "../../../components/BrandMark";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"checking" | "idle" | "submitting" | "error">("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // 1. Check if session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("idle");
      }
    });

    // 2. Listen for auth state change (e.g. tokens in hash fragment or cookie hydration)
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setStatus("idle");
      }
    });

    // 3. Grace period for token parsing before showing error
    const timer = setTimeout(async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        setStatus("error");
        setError("Your session or verification link may have expired. Please request a new link.");
      } else {
        setStatus("idle");
      }
    }, 2500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setStatus("error");
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setError("Passwords don't match");
      return;
    }
    setStatus("submitting");

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      setStatus("error");
      setError(authError.message);
      return;
    }
    router.replace("/");
  }

  if (status === "checking") {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-sm font-medium text-ink-2">Verifying link…</div>
    );
  }

  if (status === "error" && !password) {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center">
        <BrandMark />
        <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-card-rest text-center">
          <h1 className="mb-2 font-display text-2xl font-extrabold tracking-tight">Link Expired or Invalid</h1>
          <p className="mb-6 text-sm font-medium text-ink-2">{error ?? "Your link may have already been used or expired."}</p>
          <Link
            href="/sign-up"
            className="inline-block rounded-md bg-violet px-5 py-3 text-sm font-bold text-white shadow-play no-underline"
          >
            Back to Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-screen flex-col items-center justify-center">
      <BrandMark />

      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-card-rest">
        <h1 className="mb-1 font-display text-2xl font-extrabold tracking-tight">Set a password</h1>
        <p className="mb-6 text-sm font-medium text-ink-2">You're verified - now set a password so you can sign in with your username next time.</p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-line bg-bg px-4 py-3 text-sm font-medium text-ink outline-none focus:border-violet"
          />
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="rounded-md border border-line bg-bg px-4 py-3 text-sm font-medium text-ink outline-none focus:border-violet"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-md bg-violet px-4 py-3 text-sm font-bold text-white shadow-play disabled:opacity-60"
          >
            {status === "submitting" ? "Saving…" : "Save password"}
          </button>
        </form>

        {status === "error" && error && <p className="mt-4 text-sm font-medium text-orange-deep">{error}</p>}
      </div>
    </div>
  );
}
