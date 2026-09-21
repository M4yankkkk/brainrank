import type { FastifyPluginAsync } from "fastify";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client.js";
import { users } from "../db/schema.js";

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(24)
  .regex(/^[a-zA-Z0-9_]+$/, "letters, numbers, and underscores only");

const resolveBodySchema = z.object({ username: usernameSchema });
const availableQuerySchema = z.object({ username: usernameSchema });

/**
 * Public (no auth) routes that support username-based sign-in. Supabase Auth
 * only knows email/phone, not usernames, so the client resolves a username to
 * its email here first, then calls supabase.auth.signInWithPassword(email, ...)
 * itself - Supabase still does the actual credential check, this is just a
 * lookup. (Trade-off: this does let a caller probe whether a given username
 * is registered - acceptable for a social/group game where usernames are
 * already shown on leaderboards, not treated as secret.)
 */
const authRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/auth/resolve-username",
    {
      schema: {
        tags: ["auth"],
        summary: "Resolve a username to its account email, for username+password sign-in.",
        body: resolveBodySchema
      }
    },
    async (request, reply) => {
      const { username } = resolveBodySchema.parse(request.body);
      const rows = await db.execute<{ email: string }>(
        sql`select au.email from auth.users au join public.users pu on pu.id = au.id where pu.username = ${username} limit 1`
      );
      const row = rows[0];
      if (!row?.email) return reply.code(404).send({ error: "No account with that username" });
      return { email: row.email };
    }
  );

  app.get(
    "/auth/username-available",
    {
      schema: {
        tags: ["auth"],
        summary: "Check whether a username is free to claim at sign-up.",
        querystring: availableQuerySchema
      }
    },
    async (request) => {
      const { username } = availableQuerySchema.parse(request.query);
      const rows = await db.execute<{ exists: boolean }>(
        sql`select exists(select 1 from public.users where username = ${username}) as exists`
      );
      return { available: !rows[0]?.exists };
    }
  );

  app.get(
    "/auth/me",
    {
      schema: {
        tags: ["auth"],
        summary: "Current authenticated user profile."
      },
      preHandler: app.requireAuth
    },
    async (request) => {
      const [row] = await db.select().from(users).where(eq(users.id, request.user!.id)).limit(1);
      return {
        id: request.user!.id,
        email: request.user!.email ?? null,
        username: row?.username ?? request.user!.username ?? (request.user!.email ? request.user!.email.split("@")[0] : `player_${request.user!.id.slice(0, 6)}`),
        avatarUrl: row?.avatarUrl ?? null
      };
    }
  );
};

export default authRoutes;
