import { engines, type EnginePuzzleId } from "@brainrank/engine";
import { moveSchemasByType } from "../schemas/puzzles.js";

export function isKnownPuzzleType(type: string): type is EnginePuzzleId {
  return type in engines;
}

export function engineFor(type: EnginePuzzleId) {
  return engines[type];
}

export function moveSchemaFor(type: EnginePuzzleId) {
  return moveSchemasByType[type];
}
