import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../env.js";
import * as schema from "./schema.js";

const queryClient = postgres(env.DATABASE_URL, {
  // Supabase's pooled connection strings (pgbouncer, transaction mode) don't support
  // prepared statements.
  prepare: false
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
