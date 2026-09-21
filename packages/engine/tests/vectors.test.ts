import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { starfield } from "../src/puzzles/starfield";
import { shiftword } from "../src/puzzles/shiftword";
import { unblock } from "../src/puzzles/unblock";
import { computeScore } from "../src/scoring";
import type { PuzzleEngine } from "../src/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VECTORS_DIR = path.resolve(__dirname, "../test-vectors");

interface Vector {
  name: string;
  description: string;
  payload: unknown;
  moves: unknown[];
  hintsUsed: number;
  solveTimeMs: number;
  tFastMs: number;
  tSlowMs: number;
  expected: {
    solved: boolean;
    result: unknown;
    efficiency: number;
    time: number;
    hintPenalty: number;
    points: number;
  };
}

function loadVectors(file: string): Vector[] {
  return JSON.parse(readFileSync(path.join(VECTORS_DIR, file), "utf8"));
}

function runVectorSuite<Payload, State, Move, Result>(
  puzzleName: string,
  engine: PuzzleEngine<Payload, State, Move, Result>,
  file: string
) {
  const vectors = loadVectors(file);

  describe(`${puzzleName} test vectors (${file})`, () => {
    it("has at least 10 cases", () => {
      expect(vectors.length).toBeGreaterThanOrEqual(10);
    });

    for (const vector of vectors) {
      it(vector.name, () => {
        let state = engine.init(vector.payload as Payload);
        for (const move of vector.moves) {
          state = engine.applyMove(state, move as Move);
        }

        const solved = engine.isSolved(state);
        expect(solved, `isSolved mismatch for ${vector.name}`).toBe(vector.expected.solved);

        const result = engine.resultOf(state);
        expect(result).toEqual(vector.expected.result);

        const efficiency = engine.efficiency(result);
        expect(efficiency).toBeCloseTo(vector.expected.efficiency, 9);

        const score = computeScore({
          efficiency,
          solveTimeMs: vector.solveTimeMs,
          tFastMs: vector.tFastMs,
          tSlowMs: vector.tSlowMs,
          hintsUsed: vector.hintsUsed,
          weights: engine.weights,
          solved
        });

        expect(score.time).toBeCloseTo(vector.expected.time, 9);
        expect(score.hintPenalty).toBe(vector.expected.hintPenalty);
        expect(score.points).toBe(vector.expected.points);
      });
    }
  });
}

runVectorSuite("starfield", starfield, "starfield.json");
runVectorSuite("shiftword", shiftword, "shiftword.json");
runVectorSuite("unblock", unblock, "unblock.json");
