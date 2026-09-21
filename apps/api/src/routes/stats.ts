import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { stats } from "../db/schema.js";

const statsRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/stats/me",
    {
      schema: {
        tags: ["stats"],
        summary: "The caller's per-puzzle-type stats (PRD 6.6): games played, average points, best, streak."
      },
      preHandler: app.requireAuth
    },
    async (request) => {
      const rows = await db.select().from(stats).where(eq(stats.userId, request.user!.id));
      return rows.map((r) => ({
        puzzleType: r.puzzleType,
        played: r.played,
        avgPoints: Number(r.avgPoints),
        best: r.best,
        streak: r.streak
      }));
    }
  );
};

export default statsRoutes;
