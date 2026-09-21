import type { FastifyPluginAsync } from "fastify";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client.js";
import { dailyScores, groupMembers, groups, seasons, seasonStandings, users } from "../db/schema.js";
import { generateInviteCode } from "../lib/inviteCode.js";

const createGroupSchema = z.object({
  name: z.string().min(1).max(60),
  emoji: z.string().min(1).max(8).default("🧠"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#7E62F0"),
  seasonLengthDays: z.union([z.literal(7), z.literal(14), z.literal(28)]).default(14)
});

const joinGroupSchema = z.object({ inviteCode: z.string().length(6) });

function seasonEndDate(startDate: string, lengthDays: number): string {
  const start = new Date(`${startDate}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() + lengthDays - 1);
  return start.toISOString().slice(0, 10);
}

const groupsRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/groups",
    { schema: { tags: ["groups"], summary: "Create a group (PRD 6.4); the caller becomes its owner." }, preHandler: app.requireAuth },
    async (request, reply) => {
      const body = createGroupSchema.parse(request.body);
      const today = new Date().toISOString().slice(0, 10);

      const [group] = await db
        .insert(groups)
        .values({
          name: body.name,
          emoji: body.emoji,
          color: body.color,
          inviteCode: generateInviteCode(),
          ownerId: request.user!.id,
          seasonLengthDays: body.seasonLengthDays
        })
        .returning();

      await db.insert(groupMembers).values({ groupId: group.id, userId: request.user!.id, role: "owner" });
      await db.insert(seasons).values({
        groupId: group.id,
        number: 1,
        startDate: today,
        endDate: seasonEndDate(today, body.seasonLengthDays)
      });

      return reply.code(201).send(group);
    }
  );

  app.post(
    "/groups/join",
    { schema: { tags: ["groups"], summary: "Join a group by its 6-character invite code." }, preHandler: app.requireAuth },
    async (request, reply) => {
      const { inviteCode } = joinGroupSchema.parse(request.body);
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.inviteCode, inviteCode.toUpperCase()))
        .limit(1);
      if (!group) return reply.code(404).send({ error: "Invalid invite code" });

      await db
        .insert(groupMembers)
        .values({ groupId: group.id, userId: request.user!.id, role: "member" })
        .onConflictDoUpdate({ target: [groupMembers.groupId, groupMembers.userId], set: { isActive: true } });

      return reply.code(200).send(group);
    }
  );

  app.get(
    "/groups",
    { schema: { tags: ["groups"], summary: "Groups the caller is an active member of." }, preHandler: app.requireAuth },
    async (request) => {
      const rows = await db
        .select({ group: groups, role: groupMembers.role })
        .from(groupMembers)
        .innerJoin(groups, eq(groups.id, groupMembers.groupId))
        .where(and(eq(groupMembers.userId, request.user!.id), eq(groupMembers.isActive, true)));
      return rows.map(({ group, role }) => ({ ...group, myRole: role }));
    }
  );

  app.get(
    "/groups/:id",
    {
      schema: { tags: ["groups"], summary: "Group detail: members, today's leaderboard, and the current season's standings." },
      preHandler: app.requireAuth
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const [membership] = await db
        .select()
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, id), eq(groupMembers.userId, request.user!.id)))
        .limit(1);
      if (!membership) return reply.code(403).send({ error: "Not a member of this group" });

      const [group] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
      if (!group) return reply.code(404).send({ error: "Group not found" });

      const memberRows = await db
        .select({ user: users, role: groupMembers.role, joinedAt: groupMembers.joinedAt })
        .from(groupMembers)
        .innerJoin(users, eq(users.id, groupMembers.userId))
        .where(and(eq(groupMembers.groupId, id), eq(groupMembers.isActive, true)));
      const memberIds = memberRows.map((m) => m.user.id);

      const today = new Date().toISOString().slice(0, 10);
      const todayScores =
        memberIds.length > 0
          ? await db.select().from(dailyScores).where(and(eq(dailyScores.localDate, today), inArray(dailyScores.userId, memberIds)))
          : [];
      const todayByUser = new Map(todayScores.map((s) => [s.userId, s]));

      const [currentSeason] = await db
        .select()
        .from(seasons)
        .where(eq(seasons.groupId, id))
        .orderBy(desc(seasons.number))
        .limit(1);

      const standings = currentSeason
        ? await db.select().from(seasonStandings).where(eq(seasonStandings.seasonId, currentSeason.id))
        : [];
      const standingsByUser = new Map(standings.map((s) => [s.userId, s]));

      return {
        group,
        members: memberRows
          .map((m) => ({
            userId: m.user.id,
            username: m.user.username,
            avatarUrl: m.user.avatarUrl,
            role: m.role,
            today: todayByUser.get(m.user.id) ?? { totalPoints: 0, puzzlesCompleted: 0 },
            season: standingsByUser.get(m.user.id) ?? { points: 0, daysPlayed: 0, fullSets: 0, bestDay: 0 }
          }))
          .sort((a, b) => b.season.points - a.season.points),
        currentSeason
      };
    }
  );

  app.delete(
    "/groups/:id/members/:userId",
    {
      schema: { tags: ["groups"], summary: "Owner removes a member (PRD 6.4)." },
      preHandler: app.requireAuth
    },
    async (request, reply) => {
      const { id, userId } = request.params as { id: string; userId: string };
      const [group] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
      if (!group) return reply.code(404).send({ error: "Group not found" });
      if (group.ownerId !== request.user!.id) return reply.code(403).send({ error: "Only the group owner can remove members" });
      if (userId === group.ownerId) return reply.code(400).send({ error: "The owner cannot remove themselves" });

      await db
        .update(groupMembers)
        .set({ isActive: false })
        .where(and(eq(groupMembers.groupId, id), eq(groupMembers.userId, userId)));
      return reply.code(204).send();
    }
  );
};

export default groupsRoutes;
