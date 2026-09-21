import { z } from "zod";

/**
 * Request-time validation shapes mirroring @brainrank/engine's Move/Payload
 * types (packages/engine/src/puzzles/*.ts). Kept in the API rather than the
 * engine package itself so the engine stays free of zod as a dependency
 * (it must stay dependency-free to run unmodified in any JS runtime).
 */

export const starfieldMoveSchema = z.object({
  type: z.literal("setMark"),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  mark: z.enum(["empty", "x", "star"])
});

export const shiftwordMoveSchema = z.union([
  z.object({ type: z.literal("shiftRow"), row: z.number().int().min(0), dir: z.enum(["left", "right"]) }),
  z.object({ type: z.literal("shiftCol"), col: z.number().int().min(0), dir: z.enum(["up", "down"]) })
]);

export const unblockMoveSchema = z.object({
  type: z.literal("slide"),
  blockId: z.string().min(1),
  to: z.number().int().min(0)
});

export const moveSchemasByType = {
  starfield: starfieldMoveSchema,
  shiftword: shiftwordMoveSchema,
  unblock: unblockMoveSchema
} as const;

export const puzzleTypeSchema = z.enum(["starfield", "shiftword", "unblock"]);

export const submitAttemptSchema = z.object({
  moveLog: z.array(z.record(z.string(), z.unknown())).max(2000),
  activeTimeMs: z.number().int().min(0),
  hintsUsed: z.number().int().min(0).max(50),
  pauseCount: z.number().int().min(0).max(50)
});
export type SubmitAttemptBody = z.infer<typeof submitAttemptSchema>;
