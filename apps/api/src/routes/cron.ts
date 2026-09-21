import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { env } from "../env.js";
import { db } from "../db/client.js";
import { attempts, dailyScores, groupMembers, groups, puzzles, seasons, seasonStandings, stats } from "../db/schema.js";

async function requireCronSecret(request: FastifyRequest, reply: FastifyReply) {
  if (request.headers["x-cron-secret"] !== env.CRON_SECRET) {
    await reply.code(401).send({ error: "Invalid cron secret" });
  }
}

function yesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

const rolloverBodySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() });

const cronRoutes: FastifyPluginAsync = async (app) => {
  /**
   * Render Cron Job, daily: rolls up the previous day's play into per-puzzle-type
   * streaks (PRD 6.6) and each active season's running standings (PRD 6.4/6.5).
   * `date` defaults to "yesterday" (UTC) so a job scheduled shortly after midnight
   * rolls up the day that just ended.
   */
  app.post("/internal/cron/daily-rollover", { preHandler: requireCronSecret }, async (request, reply) => {
    const { date } = rolloverBodySchema.parse(request.body ?? {});
    const targetDate = date ?? yesterday();
    const priorDate = new Date(`${targetDate}T00:00:00Z`);
    priorDate.setUTCDate(priorDate.getUTCDate() - 1);
    const priorDateStr = priorDate.toISOString().slice(0, 10);

    // --- Per-puzzle-type streaks: consecutive local dates with >=1 attempt of that type.
    const todaysAttempts = await db
      .selectDistinct({ userId: attempts.userId, puzzleId: attempts.puzzleId })
      .from(attempts)
      .where(eq(attempts.localDate, targetDate));

    // Resolve puzzle types in one pass rather than N+1 queries.
    const puzzleTypeById = new Map(
      (await db.select({ id: puzzles.id, type: puzzles.type }).from(puzzles)).map((p) => [p.id, p.type])
    );

    const seenUserType = new Set<string>();
    for (const row of todaysAttempts) {
      const type = puzzleTypeById.get(row.puzzleId);
      if (!type) continue;
      const key = `${row.userId}:${type}`;
      if (seenUserType.has(key)) continue;
      seenUserType.add(key);

      const [playedYesterday] = await db
        .select({ id: attempts.id })
        .from(attempts)
        .innerJoin(puzzles, eq(puzzles.id, attempts.puzzleId))
        .where(and(eq(attempts.userId, row.userId), eq(puzzles.type, type), eq(attempts.localDate, priorDateStr)))
        .limit(1);

      const [existing] = await db
        .select()
        .from(stats)
        .where(and(eq(stats.userId, row.userId), eq(stats.puzzleType, type)))
        .limit(1);

      const nextStreak = playedYesterday ? (existing?.streak ?? 0) + 1 : 1;
      if (existing) {
        await db.update(stats).set({ streak: nextStreak }).where(and(eq(stats.userId, row.userId), eq(stats.puzzleType, type)));
      } else {
        await db.insert(stats).values({ userId: row.userId, puzzleType: type, played: 0, avgPoints: "0", best: 0, streak: nextStreak });
      }
    }

    // --- Season standings: fold targetDate's daily_scores into every season covering it.
    const activeSeasons = await db
      .select()
      .from(seasons)
      .where(and(lte(seasons.startDate, targetDate), gte(seasons.endDate, targetDate)));

    for (const season of activeSeasons) {
      const members = await db
        .select({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, season.groupId), eq(groupMembers.isActive, true)));
      const memberIds = members.map((m) => m.userId);
      if (memberIds.length === 0) continue;

      const todayScores = await db
        .select()
        .from(dailyScores)
        .where(and(eq(dailyScores.localDate, targetDate), inArray(dailyScores.userId, memberIds)));

      for (const memberId of memberIds) {
        const today = todayScores.find((s) => s.userId === memberId);
        const points = today?.totalPoints ?? 0;
        const playedToday = (today?.puzzlesCompleted ?? 0) > 0 || points > 0;
        const fullSet = (today?.puzzlesCompleted ?? 0) >= 3;

        await db
          .insert(seasonStandings)
          .values({
            seasonId: season.id,
            userId: memberId,
            points,
            daysPlayed: playedToday ? 1 : 0,
            fullSets: fullSet ? 1 : 0,
            bestDay: points
          })
          .onConflictDoUpdate({
            target: [seasonStandings.seasonId, seasonStandings.userId],
            set: {
              points: sql`${seasonStandings.points} + ${points}`,
              daysPlayed: sql`${seasonStandings.daysPlayed} + ${playedToday ? 1 : 0}`,
              fullSets: sql`${seasonStandings.fullSets} + ${fullSet ? 1 : 0}`,
              bestDay: sql`greatest(${seasonStandings.bestDay}, ${points})`
            }
          });
      }
    }

    return { rolledUpDate: targetDate, streaksUpdated: seenUserType.size, seasonsUpdated: activeSeasons.length };
  });

  /**
   * Render Cron Job, daily: closes any season whose end_date has passed and has
   * no champion yet, crowns the champion (PRD 6.5: season score = sum of the
   * best N days if the group opted in, tiebreak by full sets then best single
   * day), and starts the next season automatically.
   */
  app.post("/internal/cron/season-end", { preHandler: requireCronSecret }, async (request, reply) => {
    const today = new Date().toISOString().slice(0, 10);

    const endedSeasons = await db
      .select()
      .from(seasons)
      .where(and(lte(seasons.endDate, today), sql`${seasons.championUserId} is null`));

    const closed: string[] = [];
    for (const season of endedSeasons) {
      const [group] = await db.select().from(groups).where(eq(groups.id, season.groupId)).limit(1);
      if (!group) continue;

      const members = await db
        .select({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.isActive, true)));

      let champion: { userId: string; total: number; fullSets: number; bestDay: number } | null = null;
      for (const member of members) {
        const days = await db
          .select({ localDate: dailyScores.localDate, totalPoints: dailyScores.totalPoints, puzzlesCompleted: dailyScores.puzzlesCompleted })
          .from(dailyScores)
          .where(
            and(
              eq(dailyScores.userId, member.userId),
              gte(dailyScores.localDate, season.startDate),
              lte(dailyScores.localDate, season.endDate)
            )
          );

        const sorted = days.map((d) => d.totalPoints).sort((a, b) => b - a);
        const countedDays = group.bestNDays ? sorted.slice(0, group.bestNDays) : sorted;
        const total = countedDays.reduce((sum, p) => sum + p, 0);
        const fullSets = days.filter((d) => d.puzzlesCompleted >= 3).length;
        const bestDay = sorted[0] ?? 0;

        if (
          !champion ||
          total > champion.total ||
          (total === champion.total && fullSets > champion.fullSets) ||
          (total === champion.total && fullSets === champion.fullSets && bestDay > champion.bestDay)
        ) {
          champion = { userId: member.userId, total, fullSets, bestDay };
        }
      }

      if (champion) {
        await db.update(seasons).set({ championUserId: champion.userId }).where(eq(seasons.id, season.id));
      }

      const nextStart = new Date(`${season.endDate}T00:00:00Z`);
      nextStart.setUTCDate(nextStart.getUTCDate() + 1);
      const nextStartStr = nextStart.toISOString().slice(0, 10);
      const nextEnd = new Date(nextStart);
      nextEnd.setUTCDate(nextEnd.getUTCDate() + group.seasonLengthDays - 1);

      const [existingNext] = await db
        .select()
        .from(seasons)
        .where(and(eq(seasons.groupId, group.id), eq(seasons.number, season.number + 1)))
        .limit(1);
      if (!existingNext) {
        await db.insert(seasons).values({
          groupId: group.id,
          number: season.number + 1,
          startDate: nextStartStr,
          endDate: nextEnd.toISOString().slice(0, 10)
        });
      }

      closed.push(season.id);
    }

    return { closedSeasons: closed };
  });
};

export default cronRoutes;
