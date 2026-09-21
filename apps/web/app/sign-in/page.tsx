"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabaseClient";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    if (authError) {
      setStatus("error");
      setError(authError.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="app-shell flex min-h-screen flex-col items-center justify-center">
      <div className="brand mb-8 flex items-center gap-2 font-display text-[22px] font-extrabold tracking-tight">
        <span className="grid h-[26px] w-[26px] grid-cols-2 gap-[3px] rounded-lg bg-ink p-[5px]">
          <i className="rounded-[2px] bg-violet" />
          <i className="rounded-[2px] bg-bg" />
          <i className="rounded-[2px] bg-bg" />
          <i className="rounded-[2px] bg-orange" />
        </span>
        Brainrank
      </div>

      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-card-rest">
        <h1 className="mb-1 font-display text-2xl font-extrabold tracking-tight">Sign in</h1>
        <p className="mb-6 text-sm font-medium text-ink-2">Your group's daily brain battle.</p>

        <button
          type="button"
          onClick={signInWithGoogle}
          className="mb-4 w-full rounded-md border border-line bg-card px-4 py-3 text-sm font-semibold text-ink transition active:translate-y-[2px]"
        >
          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3 text-xs font-semibold text-ink-2">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
          <input
            type="email"
            required
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
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
        </form>

        {status === "sent" && <p className="mt-4 text-sm font-medium text-good">Check your email for a sign-in link.</p>}
        {status === "error" && error && <p className="mt-4 text-sm font-medium text-orange-deep">{error}</p>}
      </div>
    </div>
  );
}
