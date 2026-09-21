import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),

  /** Supabase Postgres connection string via the session/transaction pooler, using a role that owns the tables (bypasses RLS). */
  DATABASE_URL: z.string().min(1),

  /** e.g. https://<project-ref>.supabase.co - used to build the Auth JWKS URL for verifying client-sent access tokens. */
  SUPABASE_URL: z.string().url(),
  /** Service role key, used only for Storage signed upload URLs. Never sent to clients. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  /** Shared secret Render Cron Jobs send as `x-cron-secret` to hit internal /internal/cron/* routes. */
  CRON_SECRET: z.string().min(16),

  /** Comma-separated list of allowed browser origins for CORS. */
  WEB_ORIGIN: z.string().min(1).default("http://localhost:3000")
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
