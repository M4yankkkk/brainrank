import { createClient } from "@supabase/supabase-js";
import { env } from "../env.js";

/**
 * Service-role Supabase client, used ONLY server-side to mint short-lived
 * signed Storage upload URLs. Clients never see the service role key - they
 * receive just the one-time signed URL for the object they're allowed to write.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
