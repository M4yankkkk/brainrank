import type { FastifyPluginAsync } from "fastify";
import { and, eq, sql } from "drizzle-orm";

import { computeScore } from "@brainrank/engine";
import { db } from "../db/client.js";
import { attempts, dailyScores, puzzles, stats } from "../db/schema.js";
import { submitAttemptSchema } from "../schemas/puzzles.js";
import { engineFor, isKnownPuzzleType, moveSchemaFor } from "../lib/engineForType.js";

/**
 * Below this fraction of t_fast, a solve is flagged as physically implausible
 * (PRD 13.4 "time sanity") and excluded from global leaderboards - it's still
 * recorded and scored for the player and their group.
 */
const MIN_PLAUSIBLE_TIME_FRACTION = 0.3;
const MAX_PAUSES = 3;

const attemptsRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/puzzles/:id/attempts",
    {
      schema: {
        tags: ["attempts"],
        summary:
          "Submit a completed (or abandoned) attempt. The server replays the move log against the stored puzzle " +
          "and computes the final score itself - the client's local score is never trusted (PRD 13.4)."
      },
      preHandler: app.requireAuth
    },
    async (request, reply) => {
      const { id: puzzleId } = request.params as { id: string };
      const body = submitAttemptSchema.parse(request.body);

      const [puzzle] = await db.select().from(puzzles).where(eq(puzzles.id, puzzleId)).limit(1);
      if (!puzzle) return reply.code(404).send({ error: "Puzzle not found" });
      if (!isKnownPuzzleType(puzzle.type)) {
        return reply.code(500).send({ error: `Unsupported puzzle type "${puzzle.type}"` });
      }

      const engine = engineFor(puzzle.type);
      const moveSchema = moveSchemaFor(puzzle.type);

      let state: unknown;
      try {
        const parsedMoves = body.moveLog.map((raw, index) => {
          const result = moveSchema.safeParse(raw);
          if (!result.success) throw new InvalidMoveError(index, result.error.message);
          return result.data;
        });
        state = engine.init(puzzle.payload as never);
        for (const move of parsedMoves) {
          state = engine.applyMove(state as never, move as never);
        }
      } catch (err) {
        return reply.code(400).send({ error: `Invalid move log: ${(err as Error).message}` });
      }

      const solved = engine.isSolved(state as never);
      const result = engine.resultOf(state as never);
      const efficiency = engine.efficiency(result as never);

      if (body.pauseCount > MAX_PAUSES) {
        return reply.code(400).send({ error: `Too many pauses (${body.pauseCount} > ${MAX_PAUSES})` });
      }

      const score = computeScore({
        efficiency,
        solveTimeMs: body.activeTimeMs,
        tFastMs: puzzle.tFastMs,
        tSlowMs: puzzle.tSlowMs,
        hintsUsed: body.hintsUsed,
        weights: puzzle.weights,
        solved
      });

      const plausible = body.activeTimeMs >= puzzle.tFastMs * MIN_PLAUSIBLE_TIME_FRACTION;

      const inserted = await db
        .insert(attempts)
        .values({
          userId: request.user!.id,
          puzzleId: puzzle.id,
          localDate: puzzle.releaseDate,
          moveLog: body.moveLog,
          activeTimeMs: body.activeTimeMs,
          hintsUsed: body.hintsUsed,
          pauseCount: body.pauseCount,
          solved,
          points: score.points,
          validated: plausible
        })
        .onConflictDoNothing({ target: [attempts.userId, attempts.puzzleId] })
        .returning({ id: attempts.id });

      if (inserted.length === 0) {
        return reply.code(409).send({ error: "This puzzle has already been attempted (one scored attempt per puzzle, PRD 6.2)" });
      }

      await upsertDailyScore(request.user!.id, puzzle.releaseDate, score.points, solved);
      await upsertStats(request.user!.id, puzzle.type, score.points);

      return reply.code(201).send({
        solved,
        points: score.points,
        breakdown: {
          efficiency: score.efficiency,
          time: score.time,
          hintPenalty: score.hintPenalty,
          rawPoints: score.rawPoints
        },
        validated: plausible
      });
    }
  );
};

class InvalidMoveError extends Error {
  constructor(index: number, message: string) {
    super(`move[${index}]: ${message}`);
  }
}

async function upsertDailyScore(userId: string, localDate: string, points: number, solved: boolean) {
  await db
    .insert(dailyScores)
    .values({ userId, localDate, totalPoints: points, puzzlesCompleted: solved ? 1 : 0 })
    .onConflictDoUpdate({
      target: [dailyScores.userId, dailyScores.localDate],
      set: {
        totalPoints: sql`${dailyScores.totalPoints} + ${points}`,
        puzzlesCompleted: sql`${dailyScores.puzzlesCompleted} + ${solved ? 1 : 0}`
      }
    });
}

async function upsertStats(userId: string, puzzleType: "starfield" | "shiftword" | "unblock", points: number) {
  const [existing] = await db
    .select()
    .from(stats)
    .where(and(eq(stats.userId, userId), eq(stats.puzzleType, puzzleType)))
    .limit(1);

  if (!existing) {
    await db.insert(stats).values({ userId, puzzleType, played: 1, avgPoints: String(points), best: points, streak: 0 });
    return;
  }

  const played = existing.played + 1;
  const avg = (Number(existing.avgPoints) * existing.played + points) / played;
  await db
    .update(stats)
    .set({ played, avgPoints: avg.toFixed(2), best: Math.max(existing.best, points) })
    .where(and(eq(stats.userId, userId), eq(stats.puzzleType, puzzleType)));
}

export default attemptsRoutes;
