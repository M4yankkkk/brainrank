"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "../../../lib/supabaseClient";
import { StarfieldPuzzle } from "../../../components/puzzle/StarfieldPuzzle";
import { ShiftwordPuzzle } from "../../../components/puzzle/ShiftwordPuzzle";
import { UnblockPuzzle } from "../../../components/puzzle/UnblockPuzzle";

export default function PuzzlePage() {
  const params = useParams<{ type: string }>();
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/sign-in");
    });
  }, [router]);

  switch (params.type) {
    case "starfield":
      return <StarfieldPuzzle />;
    case "shiftword":
      return <ShiftwordPuzzle />;
    case "unblock":
      return <UnblockPuzzle />;
    default:
      return (
        <div className="app-shell flex min-h-screen items-center justify-center text-sm font-medium text-ink-2">
          Unknown puzzle type &quot;{params.type}&quot;
        </div>
      );
  }
}
