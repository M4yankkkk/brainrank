import type { PuzzleEngine } from "../types";

/**
 * Unblock, PRD section 8.9 (Rush Hour-style sliding block puzzle).
 * 6x6 board, exit on the right of the key block's row. Horizontal blocks
 * slide left/right, vertical blocks slide up/down; one continuous drag
 * (however far) counts as one move.
 */

export type Orientation = "h" | "v";

export interface Block {
  id: string;
  /** Leading cell: top-left for both orientations (row for "v" varies, col for "h" varies). */
  row: number;
  col: number;
  length: 2 | 3;
  orientation: Orientation;
  isKey?: boolean;
}

export interface UnblockPayload {
  size: number;
  exitRow: number;
  blocks: Block[];
  par: number;
}

export interface UnblockState {
  size: number;
  exitRow: number;
  blocks: Block[];
  par: number;
  moves: number;
}

export interface UnblockMove {
  type: "slide";
  blockId: string;
  /** New leading row (vertical blocks) or column (horizontal blocks). */
  to: number;
}

export interface UnblockResult {
  par: number;
  moves: number;
}

function cellsOf(block: Block): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let i = 0; i < block.length; i++) {
    cells.push(block.orientation === "h" ? [block.row, block.col + i] : [block.row + i, block.col]);
  }
  return cells;
}

function occupancy(blocks: Block[], excludeId?: string): Set<string> {
  const set = new Set<string>();
  for (const block of blocks) {
    if (block.id === excludeId) continue;
    for (const [r, c] of cellsOf(block)) set.add(`${r},${c}`);
  }
  return set;
}

function findBlock(state: UnblockState, id: string): Block {
  const block = state.blocks.find((b) => b.id === id);
  if (!block) throw new Error(`Unblock: no block with id "${id}"`);
  return block;
}

/** All leading positions a block can reach in a single uninterrupted slide, excluding its current position. */
function reachablePositions(state: UnblockState, block: Block): number[] {
  const others = occupancy(state.blocks, block.id);
  const axisLen = state.size;
  const isFree = (leading: number): boolean => {
    if (leading < 0 || leading + block.length > axisLen) return false;
    for (let i = 0; i < block.length; i++) {
      const [r, c] = block.orientation === "h" ? [block.row, leading + i] : [leading + i, block.col];
      if (others.has(`${r},${c}`)) return false;
    }
    return true;
  };

  const current = block.orientation === "h" ? block.col : block.row;
  const positions: number[] = [];
  for (let leading = current - 1; leading >= 0 && isFree(leading); leading--) positions.push(leading);
  for (let leading = current + 1; leading + block.length <= axisLen && isFree(leading); leading++) positions.push(leading);
  return positions;
}

export const unblock: PuzzleEngine<UnblockPayload, UnblockState, UnblockMove, UnblockResult> = {
  id: "unblock",
  weights: { wE: 0.6, wT: 0.4 },

  init(payload) {
    return {
      size: payload.size,
      exitRow: payload.exitRow,
      blocks: payload.blocks.map((b) => ({ ...b })),
      par: payload.par,
      moves: 0
    };
  },

  applyMove(state, move) {
    const block = findBlock(state, move.blockId);
    const reachable = reachablePositions(state, block);
    if (!reachable.includes(move.to)) {
      throw new Error(`Unblock: block "${move.blockId}" cannot slide to ${move.to}`);
    }
    const blocks = state.blocks.map((b) =>
      b.id === move.blockId ? { ...b, ...(b.orientation === "h" ? { col: move.to } : { row: move.to }) } : b
    );
    return { ...state, blocks, moves: state.moves + 1 };
  },

  isSolved(state) {
    const key = state.blocks.find((b) => b.isKey);
    if (!key) return false;
    return key.row === state.exitRow && key.col === state.size - key.length;
  },

  efficiency(result) {
    if (result.moves <= 0) return 0;
    return Math.min(1, result.par / result.moves);
  },

  resultOf(state) {
    return { par: state.par, moves: state.moves };
  },

  hint(state) {
    if (unblock.isSolved(state)) return null;
    const path = solveUnblock(state);
    return path && path.length > 0 ? path[0] : null;
  }
};

function serialize(blocks: Block[]): string {
  return blocks
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((b) => `${b.id}:${b.row},${b.col}`)
    .join("|");
}

/** BFS over block configurations (each edge = one full slide) for the shortest solution from the given state. */
export function solveUnblock(state: UnblockState, maxDepth = 60): UnblockMove[] | null {
  const start: UnblockState = { ...state, blocks: state.blocks.map((b) => ({ ...b })) };
  const startKey = serialize(start.blocks);
  if (unblock.isSolved(start)) return [];

  const visited = new Set<string>([startKey]);
  let frontier: Array<{ state: UnblockState; path: UnblockMove[] }> = [{ state: start, path: [] }];

  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
    const nextFrontier: typeof frontier = [];
    for (const { state: cur, path } of frontier) {
      for (const block of cur.blocks) {
        for (const to of reachablePositions(cur, block)) {
          const move: UnblockMove = { type: "slide", blockId: block.id, to };
          const nextState = unblock.applyMove(cur, move);
          const key = serialize(nextState.blocks);
          if (visited.has(key)) continue;
          visited.add(key);
          const nextPath = [...path, move];
          if (unblock.isSolved(nextState)) return nextPath;
          nextFrontier.push({ state: nextState, path: nextPath });
        }
      }
    }
    frontier = nextFrontier;
  }
  return null;
}
