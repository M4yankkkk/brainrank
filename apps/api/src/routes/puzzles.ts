import type { FastifyPluginAsync } from "fastify";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client.js";
import { attempts, dailySets, puzzles } from "../db/schema.js";
import { generateDailyPuzzlesForDate } from "../generators/puzzleGenerator.js";

const querySchema = z.object({
  // Each player's "today" is their own local date (PRD 13.5), so the client sends it explicitly.
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
    .optional()
});

const puzzlesRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/puzzles/today",
    {
      schema: {
        querystring: querySchema,
        tags: ["puzzles"],
        summary: "Today's 3-puzzle set (PRD 6.1) for the caller's local date, with their attempt status."
      },
      preHandler: app.requireAuth
    },
    async (request, reply) => {
      const { date } = querySchema.parse(request.query);
      const localDate = date ?? new Date().toISOString().slice(0, 10);

      let [dailySet] = await db.select().from(dailySets).where(eq(dailySets.date, localDate)).limit(1);
      if (!dailySet) {
        // Auto-generate fresh daily set on demand if not pre-seeded so app never 404s
        const generated = generateDailyPuzzlesForDate(localDate);
        const insertedPuzzles: Array<{ id: string }> = [];
        for (const p of generated) {
          const [row] = await db
            .insert(puzzles)
            .values(p)
            .onConflictDoUpdate({
              target: [puzzles.type, puzzles.releaseDate],
              set: {
                difficulty: sql`excluded.difficulty`,
                payload: sql`excluded.payload`,
                par: sql`excluded.par`,
                tFastMs: sql`excluded.t_fast_ms`,
                tSlowMs: sql`excluded.t_slow_ms`,
                weights: sql`excluded.weights`
              }
            })
            .returning({ id: puzzles.id });
          insertedPuzzles.push(row);
        }
        const puzzleIds = insertedPuzzles.map((p) => p.id);

        const [newDailySet] = await db
          .insert(dailySets)
          .values({
            date: localDate,
            puzzleIds,
            bonusPuzzleId: null
          })
          .onConflictDoUpdate({
            target: [dailySets.date],
            set: {
              puzzleIds,
              bonusPuzzleId: null
            }
          })
          .returning();

        dailySet = newDailySet ?? (await db.select().from(dailySets).where(eq(dailySets.date, localDate)).limit(1))[0];
      }

      if (!dailySet) {
        return reply.code(404).send({ error: `No daily set published for ${localDate}` });
      }

      const puzzleIds = dailySet.bonusPuzzleId ? [...dailySet.puzzleIds, dailySet.bonusPuzzleId] : dailySet.puzzleIds;
      const puzzleRows = await db.select().from(puzzles).where(inArray(puzzles.id, puzzleIds));

      // Ensure puzzles are returned in the exact dailySet order: Starfield, Shiftword, Unblock
      const orderMap = new Map(puzzleIds.map((id, index) => [id, index]));
      puzzleRows.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

      const attemptRows = await db
        .select()
        .from(attempts)
        .where(and(eq(attempts.userId, request.user!.id), inArray(attempts.puzzleId, puzzleIds)));
      const attemptByPuzzle = new Map(attemptRows.map((a) => [a.puzzleId, a]));

      return {
        date: localDate,
        puzzles: puzzleRows.map((p) => ({
          id: p.id,
          type: p.type,
          difficulty: p.difficulty,
          payload: p.payload,
          par: p.par,
          tFastMs: p.tFastMs,
          tSlowMs: p.tSlowMs,
          weights: p.weights,
          isBonus: p.id === dailySet!.bonusPuzzleId,
          attempt: attemptToSummary(attemptByPuzzle.get(p.id))
        }))
      };
    }
  );

  app.get(
    "/puzzles/:id",
    {
      schema: { tags: ["puzzles"], summary: "A single puzzle plus the caller's attempt status." },
      preHandler: app.requireAuth
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const [puzzle] = await db.select().from(puzzles).where(eq(puzzles.id, id)).limit(1);
      if (!puzzle) return reply.code(404).send({ error: "Puzzle not found" });

      const [attempt] = await db
        .select()
        .from(attempts)
        .where(and(eq(attempts.userId, request.user!.id), eq(attempts.puzzleId, id)))
        .limit(1);

      return {
        id: puzzle.id,
        type: puzzle.type,
        difficulty: puzzle.difficulty,
        payload: puzzle.payload,
        par: puzzle.par,
        tFastMs: puzzle.tFastMs,
        tSlowMs: puzzle.tSlowMs,
        weights: puzzle.weights,
        attempt: attemptToSummary(attempt)
      };
    }
  );
};

function attemptToSummary(attempt: typeof attempts.$inferSelect | undefined) {
  if (!attempt) return null;
  return {
    solved: attempt.solved,
    points: attempt.points,
    hintsUsed: attempt.hintsUsed,
    activeTimeMs: attempt.activeTimeMs
  };
}

export default puzzlesRoutes;
