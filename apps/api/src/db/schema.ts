/**
 * Drizzle schema mirroring supabase/migrations/0001_init.sql. Migrations are
 * hand-written SQL under /supabase (Supabase-CLI style, so RLS/policy DDL
 * lives next to the tables it protects); this file exists purely as a
 * type-safe query layer over that same schema - it is not used to generate
 * or push migrations. Keep the two in sync by hand.
 */
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  username: text("username").notNull().unique(),
  avatarUrl: text("avatar_url"),
  timezone: text("timezone").notNull().default("UTC"),
  isPlus: boolean("is_plus").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    emoji: text("emoji").notNull().default("🧠"),
    color: text("color").notNull().default("#7E62F0"),
    inviteCode: text("invite_code").notNull().unique(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    seasonLengthDays: integer("season_length_days").notNull().default(14),
    bestNDays: integer("best_n_days"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    ownerIdx: index("groups_owner_id_idx").on(t.ownerId)
  })
);

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    isActive: boolean("is_active").notNull().default(true)
  },
  (t) => ({
    pk: primaryKey({ columns: [t.groupId, t.userId] }),
    userIdx: index("group_members_user_id_idx").on(t.userId)
  })
);

export const seasons = pgTable(
  "seasons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    championUserId: uuid("champion_user_id").references(() => users.id)
  },
  (t) => ({
    groupIdx: index("seasons_group_id_idx").on(t.groupId)
  })
);

export const puzzles = pgTable(
  "puzzles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull().$type<"starfield" | "shiftword" | "unblock">(),
    releaseDate: date("release_date").notNull(),
    difficulty: text("difficulty").notNull().$type<"easy" | "medium" | "hard" | "weekend">(),
    payload: jsonb("payload").notNull(),
    par: integer("par"),
    tFastMs: integer("t_fast_ms").notNull(),
    tSlowMs: integer("t_slow_ms").notNull(),
    weights: jsonb("weights").notNull().$type<{ wE: number; wT: number }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    releaseDateIdx: index("puzzles_release_date_idx").on(t.releaseDate)
  })
);

export const dailySets = pgTable("daily_sets", {
  date: date("date").primaryKey(),
  puzzleIds: uuid("puzzle_ids").array().notNull(),
  bonusPuzzleId: uuid("bonus_puzzle_id").references(() => puzzles.id)
});

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .references(() => puzzles.id),
    localDate: date("local_date").notNull(),
    moveLog: jsonb("move_log").notNull().default([]),
    activeTimeMs: integer("active_time_ms").notNull().default(0),
    hintsUsed: integer("hints_used").notNull().default(0),
    solved: boolean("solved").notNull().default(false),
    points: integer("points").notNull().default(0),
    validated: boolean("validated").notNull().default(false),
    pauseCount: integer("pause_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    userLocalDateIdx: index("attempts_user_local_date_idx").on(t.userId, t.localDate),
    puzzleIdx: index("attempts_puzzle_id_idx").on(t.puzzleId)
  })
);

export const dailyScores = pgTable(
  "daily_scores",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    localDate: date("local_date").notNull(),
    totalPoints: integer("total_points").notNull().default(0),
    puzzlesCompleted: integer("puzzles_completed").notNull().default(0)
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.localDate] })
  })
);

export const seasonStandings = pgTable(
  "season_standings",
  {
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    points: integer("points").notNull().default(0),
    daysPlayed: integer("days_played").notNull().default(0),
    fullSets: integer("full_sets").notNull().default(0),
    bestDay: integer("best_day").notNull().default(0)
  },
  (t) => ({
    pk: primaryKey({ columns: [t.seasonId, t.userId] })
  })
);

export const stats = pgTable(
  "stats",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    puzzleType: text("puzzle_type").notNull().$type<"starfield" | "shiftword" | "unblock">(),
    played: integer("played").notNull().default(0),
    avgPoints: numeric("avg_points", { precision: 6, scale: 2 }).notNull().default("0"),
    best: integer("best").notNull().default(0),
    streak: integer("streak").notNull().default(0)
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.puzzleType] })
  })
);

export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    localDate: date("local_date").notNull(),
    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    groupLocalDateIdx: index("reactions_group_local_date_idx").on(t.groupId, t.localDate)
  })
);
