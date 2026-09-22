import { engines } from "@brainrank/engine";
import { moveSchemasByType } from "../schemas/puzzles.js";

export type SupportedPuzzleType = keyof typeof moveSchemasByType;

export function isKnownPuzzleType(type: string): type is SupportedPuzzleType {
  return type in moveSchemasByType && type in engines;
}

export function engineFor(type: SupportedPuzzleType) {
  return engines[type];
}

export function moveSchemaFor(type: SupportedPuzzleType) {
  return moveSchemasByType[type];
}
