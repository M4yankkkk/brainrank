import { createBrowserClient } from "@supabase/ssr";

/**
 * Used ONLY for sign-in (Google OAuth + email magic link, PRD 9.1) and to
 * read the current session's access token. No application data is ever
 * read or written through this client - see apps/api instead.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
