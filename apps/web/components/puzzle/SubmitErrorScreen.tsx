"use client";

import { AlertCircleIcon } from "../Icons";

export function SubmitErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="app-shell flex min-h-screen flex-col items-center justify-center text-center">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-soft text-orange-deep shadow-sm">
        <AlertCircleIcon className="h-8 w-8" />
      </div>
      <h1 className="mb-1 font-display text-2xl font-extrabold tracking-tight">Couldn't save your result</h1>
      <p className="mb-6 max-w-xs text-sm font-medium text-ink-2">{message}</p>
      <button type="button" onClick={onRetry} className="rounded-md bg-accent px-6 py-3 text-sm font-bold text-white shadow-play">
        Try again
      </button>
    </div>
  );
}
