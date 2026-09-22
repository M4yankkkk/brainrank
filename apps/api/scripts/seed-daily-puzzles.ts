import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "../src/db/client.js";
import { attempts, dailyScores, dailySets, puzzles } from "../src/db/schema.js";
import { generateDailyPuzzlesForDate } from "../src/generators/puzzleGenerator.js";

async function main() {
  console.log("Starting daily puzzle generation and database seeding...");

  // Generate for 55 days: from 2026-09-22 through 2026-11-15
  const startDate = new Date("2026-09-22T00:00:00Z");
  const totalDays = 55;

  // 1. Remove old test attempts for today (2026-09-22) so user can play fresh game
  console.log("Resetting test attempts for 2026-09-22...");
  await db.delete(attempts).where(eq(attempts.localDate, "2026-09-22"));
  await db.delete(dailyScores).where(eq(dailyScores.localDate, "2026-09-22"));

  const seededDates: string[] = [];

  for (let i = 0; i < totalDays; i++) {
    const cur = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = cur.toISOString().slice(0, 10);
    const dayName = cur.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

    // Check if dailySet already exists for this date and is not today or tomorrow (which had duplicate seed puzzles)
    const [existingSet] = await db.select().from(dailySets).where(eq(dailySets.date, dateStr)).limit(1);
    if (existingSet && dateStr !== "2026-09-22" && dateStr !== "2026-09-23") {
      console.log(`[${dateStr} ${dayName}] Already exists, skipping.`);
      continue;
    }

    console.log(`[${dateStr} ${dayName}] Generating fresh puzzles...`);
    const generated = generateDailyPuzzlesForDate(dateStr);

    const insertedPuzzles: Array<{ id: string; type: string; difficulty: string; par: number | null }> = [];
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
        .returning({ id: puzzles.id, type: puzzles.type, difficulty: puzzles.difficulty, par: puzzles.par });
      insertedPuzzles.push(row);
    }

    const puzzleIds = insertedPuzzles.map((p) => p.id);

    await db
      .insert(dailySets)
      .values({
        date: dateStr,
        puzzleIds,
        bonusPuzzleId: null
      })
      .onConflictDoUpdate({
        target: [dailySets.date],
        set: {
          puzzleIds,
          bonusPuzzleId: null
        }
      });

    console.log(
      `  -> Done: ${insertedPuzzles
        .map((p) => `${p.type} (${p.difficulty}${p.par ? `, par ${p.par}` : ""})`)
        .join(" | ")}`
    );
    seededDates.push(dateStr);
  }

  // 2. Clean up unreferenced duplicate seed puzzles from 2026-09-22 and 2026-09-23
  const allDailySets = await db.select().from(dailySets);
  const activePuzzleIds = new Set<string>();
  for (const s of allDailySets) {
    for (const pid of s.puzzleIds) activePuzzleIds.add(pid);
    if (s.bonusPuzzleId) activePuzzleIds.add(s.bonusPuzzleId);
  }

  // Preserve any puzzles that have attempts
  const allAttempts = await db.select().from(attempts);
  for (const a of allAttempts) activePuzzleIds.add(a.puzzleId);

  const activeIdsArray = [...activePuzzleIds];
  if (activeIdsArray.length > 0) {
    const unreferenced = await db
      .select({ id: puzzles.id, releaseDate: puzzles.releaseDate })
      .from(puzzles)
      .where(notInArray(puzzles.id, activeIdsArray));

    if (unreferenced.length > 0) {
      console.log(`Cleaning up ${unreferenced.length} stale unreferenced puzzles...`);
      await db.delete(puzzles).where(inArray(puzzles.id, unreferenced.map((u) => u.id)));
    }
  }

  console.log(`\nSuccessfully seeded ${seededDates.length} days with progressive difficulty!`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
