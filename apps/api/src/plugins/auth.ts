import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { verifySupabaseAccessToken } from "../auth/verifyToken.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: { id: string; email?: string };
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

/** First authenticated request for a brand-new Supabase Auth user provisions their public.users row. */
async function ensureUserRow(user: { id: string; email?: string }) {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, user.id)).limit(1);
  if (existing.length > 0) return;

  const fallbackUsername = `player_${user.id.slice(0, 8)}`;
  await db
    .insert(users)
    .values({ id: user.id, username: fallbackUsername })
    .onConflictDoNothing();
}

export default fp(authPlugin, { name: "auth" });

declare module "fastify" {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
