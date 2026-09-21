import tokens from "./tokens.json";

export type ThemeMode = "light" | "dark";
export type PuzzleId = "starfield" | "shiftword" | "unblock";

export const colorTokens = tokens.color;
export const puzzleTokens = tokens.puzzle;
export const fontTokens = tokens.font;
export const radiusTokens = tokens.radius;
export const spacingTokens = tokens.spacing;
export const shadowTokens = tokens.shadow;
export const motionTokens = tokens.motion;

export function getPuzzleSignatureColor(puzzleId: PuzzleId, mode: ThemeMode = "light"): string {
  const puzzle = puzzleTokens[puzzleId];
  return colorTokens[mode][puzzle.base as keyof (typeof colorTokens)[ThemeMode]];
}

export default tokens;
