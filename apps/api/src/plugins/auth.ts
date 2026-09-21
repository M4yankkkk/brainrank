import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { verifySupabaseAccessToken } from "../auth/verifyToken.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: { id: string; email?: string; username?: string };
  }
}

async function authPlugin(app: FastifyInstance) {
  app.decorateRequest("user", undefined);

  app.decorate("requireAuth", async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      await reply.code(401).send({ error: "Missing bearer token" });
      return;
    }
    const token = header.slice("Bearer ".length);
    try {
      const supabaseUser = await verifySupabaseAccessToken(token);
      request.user = supabaseUser;
      await ensureUserRow(supabaseUser);
    } catch {
      await reply.code(401).send({ error: "Invalid or expired token" });
    }
  });
}

/**
 * First authenticated request for a brand-new Supabase Auth user provisions
 * their public.users row, using the username they chose at sign-up (carried
 * in the JWT's user_metadata) when available. Falls back to a placeholder if
 * that username was already claimed (e.g. a retried/duplicate sign-up) or if
 * none was provided (e.g. a future OAuth-only sign-in path).
 */
async function ensureUserRow(user: { id: string; email?: string; username?: string }) {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, user.id)).limit(1);
  if (existing.length > 0) return;

  const fallbackUsername = `player_${user.id.slice(0, 8)}`;
  const desiredUsername = user.username?.trim();

  if (desiredUsername) {
    try {
      await db.insert(users).values({ id: user.id, username: desiredUsername });
      return;
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      // Username taken - fall through to the placeholder below.
    }
  }

  await db.insert(users).values({ id: user.id, username: fallbackUsername }).onConflictDoNothing();
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505";
}

export default fp(authPlugin, { name: "auth" });

declare module "fastify" {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
