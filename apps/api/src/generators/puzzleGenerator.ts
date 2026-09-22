import { solveStarfield } from "@brainrank/engine";
import { shiftword } from "@brainrank/engine";
import { solveUnblock, unblock, type Block } from "@brainrank/engine";

const WORDS_3 = [
  "CAT", "DOG", "PIG", "SUN", "ICE", "HOT", "RED", "OAK", "ELM", "FOX", "HEN", "OWL", "BAT",
  "FLY", "BEE", "ANT", "BUG", "COW", "APE", "EEL", "JAY", "RAM", "YAK", "BOA", "COD", "GAR",
  "RAY", "PUP", "CUB", "KID", "DOE", "ROE", "SOW", "HOG", "EWE", "RAT", "LOG", "JOG", "BIG",
  "FIG", "COT", "CUP", "MUG", "TEA", "JAM", "PIE", "EGG", "HAM", "NUT", "PEA", "YAM", "RYE",
  "OAT", "BUN", "DIP", "POP", "OIL", "GEL", "WAX", "TIN", "INK", "PEN", "PAD", "MAP", "KEY",
  "BAG", "BOX", "CAP", "HAT", "TIE", "BOW", "PIN", "GEM", "ROD", "BAR", "NET", "WEB", "FAN",
  "PAN", "POT", "JAR", "CAN", "BIN", "TUB", "MOP", "RUG", "MAT", "BED", "CAB", "VAN", "BUS",
  "CAR", "JET", "SKI", "ROW", "SEA", "BAY", "SKY", "AIR", "FOG", "DEW", "DAY", "EVE"
];

const WORDS_4 = [
  "BIRD", "FISH", "LION", "BEAR", "WOLF", "DEER", "DUCK", "FROG", "CRAB", "SWAN", "HAWK",
  "DOVE", "CROW", "SEAL", "TOAD", "GOAT", "MULE", "COLT", "BULL", "CALF", "LAMB", "PONY",
  "MARE", "STAG", "BOAR", "PUMA", "LYNX", "MOLE", "MICE", "HARE", "NEWT", "CARP", "BASS",
  "PIKE", "TUNA", "SOLE", "GRAY", "BLUE", "TEAL", "GOLD", "RUBY", "ROSE", "LILY", "IRIS",
  "FERN", "MOSS", "REED", "PALM", "PINE", "BARK", "LEAF", "ROOT", "SEED", "TWIG", "WOOD",
  "RAIN", "SNOW", "WIND", "MIST", "HAIL", "GALE", "WAVE", "TIDE", "SURF", "LAKE", "POND",
  "PEAK", "ROCK", "HILL", "SAND", "SOIL", "CLAY", "DUST", "STAR", "MOON", "DAWN", "DUSK"
];

export type DifficultyLevel = "easy" | "medium" | "hard" | "weekend";

export interface GeneratedPuzzle {
  type: "starfield" | "shiftword" | "unblock";
  releaseDate: string;
  difficulty: DifficultyLevel;
  payload: Record<string, unknown>;
  par: number | null;
  tFastMs: number;
  tSlowMs: number;
  weights: { wE: number; wT: number };
}

export function generateStarfield(size: number) {
  function findPlacements() {
    const results: number[][] = [];
    function solve(row: number, cols: number[]) {
      if (row === size) { results.push([...cols]); return; }
      for (let c = 0; c < size; c++) {
        if (cols.includes(c)) continue;
        if (row > 0 && Math.abs(cols[row - 1] - c) <= 1) continue;
        cols.push(c);
        solve(row + 1, cols);
        cols.pop();
      }
    }
    solve(0, []);
    return results;
  }

  const placements = findPlacements();
  const pick = placements[Math.floor(Math.random() * placements.length)];
  const stars: Array<[number, number]> = pick.map((c, r) => [r, c]);

  for (let attempt = 0; attempt < 100; attempt++) {
    const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(-1));
    const queue: Array<[number, number, number]> = [];
    stars.forEach(([r, c], id) => {
      grid[r][c] = id;
      queue.push([r, c, id]);
    });

    while (queue.length > 0) {
      const idx = Math.floor(Math.random() * queue.length);
      const [r, c, id] = queue.splice(idx, 1)[0];
      const neighbors: Array<[number, number]> = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === -1) {
          grid[nr][nc] = id;
          queue.push([nr, nc, id]);
        }
      }
    }

    const sol = solveStarfield(size, grid);
    if (sol && sol.length === size) {
      return { size, regions: grid };
    }
  }
  // Fallback default partition if randomized fill fails
  return {
    size,
    regions: Array.from({ length: size }, (_, r) => Array.from({ length: size }, () => r))
  };
}

export function generateShiftword(size: number, par: number) {
  const pool = size === 3 ? WORDS_3 : WORDS_4;
  for (let attempt = 0; attempt < 50; attempt++) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const words = shuffled.slice(0, size);
    const solutionGrid = words.map((w) => w.split(""));
    let grid = solutionGrid.map((row) => [...row]);

    for (let s = 0; s < par; s++) {
      const isRow = Math.random() > 0.5;
      const idx = Math.floor(Math.random() * size);
      const dir = Math.random() > 0.5 ? (isRow ? "left" : "up") : (isRow ? "right" : "down");
      if (isRow) {
        grid[idx] =
          dir === "left"
            ? [...grid[idx].slice(1), grid[idx][0]]
            : [grid[idx][size - 1], ...grid[idx].slice(0, -1)];
      } else {
        const col = grid.map((r) => r[idx]);
        const shifted = dir === "up" ? [...col.slice(1), col[0]] : [col[size - 1], ...col.slice(0, -1)];
        for (let r = 0; r < size; r++) grid[r][idx] = shifted[r];
      }
    }

    const payload = {
      size,
      grid,
      par,
      dictionary: pool,
      solutionGrid
    };
    const state = shiftword.init(payload);
    if (!shiftword.isSolved(state)) {
      return payload;
    }
  }
  throw new Error(`Failed to scramble shiftword size ${size}`);
}

const UNBLOCK_FALLBACKS: Record<number, Block[]> = {
  3: [
    { id: "K", row: 2, col: 1, length: 2, orientation: "h", isKey: true },
    { id: "A", row: 1, col: 3, length: 2, orientation: "v" },
    { id: "B", row: 3, col: 3, length: 2, orientation: "v" },
    { id: "C", row: 4, col: 0, length: 3, orientation: "h" }
  ],
  4: [
    { id: "K", row: 2, col: 0, length: 2, orientation: "h", isKey: true },
    { id: "A", row: 1, col: 2, length: 2, orientation: "v" },
    { id: "B", row: 0, col: 1, length: 2, orientation: "h" },
    { id: "C", row: 3, col: 2, length: 3, orientation: "h" },
    { id: "D", row: 2, col: 5, length: 3, orientation: "v" },
    { id: "E", row: 0, col: 3, length: 2, orientation: "v" }
  ],
  6: [
    { id: "K", row: 2, col: 0, length: 2, orientation: "h", isKey: true },
    { id: "A", row: 3, col: 1, length: 2, orientation: "v" },
    { id: "B", row: 1, col: 5, length: 2, orientation: "v" },
    { id: "C", row: 1, col: 1, length: 3, orientation: "h" },
    { id: "D", row: 4, col: 3, length: 3, orientation: "h" },
    { id: "E", row: 0, col: 4, length: 3, orientation: "v" },
    { id: "F", row: 5, col: 2, length: 2, orientation: "h" },
    { id: "G", row: 0, col: 0, length: 3, orientation: "h" }
  ],
  8: [
    { id: "K", row: 2, col: 0, length: 2, orientation: "h", isKey: true },
    { id: "A", row: 2, col: 5, length: 2, orientation: "v" },
    { id: "B", row: 4, col: 2, length: 2, orientation: "v" },
    { id: "C", row: 0, col: 1, length: 2, orientation: "h" },
    { id: "D", row: 3, col: 1, length: 2, orientation: "v" },
    { id: "E", row: 3, col: 3, length: 2, orientation: "h" },
    { id: "F", row: 0, col: 4, length: 3, orientation: "v" },
    { id: "G", row: 1, col: 1, length: 2, orientation: "h" },
    { id: "H", row: 3, col: 0, length: 2, orientation: "v" },
    { id: "I", row: 4, col: 4, length: 2, orientation: "h" }
  ],
  10: [
    { id: "K", row: 2, col: 0, length: 2, orientation: "h", isKey: true },
    { id: "A", row: 1, col: 3, length: 2, orientation: "h" },
    { id: "B", row: 2, col: 5, length: 2, orientation: "v" },
    { id: "C", row: 0, col: 2, length: 3, orientation: "v" },
    { id: "D", row: 3, col: 1, length: 2, orientation: "h" },
    { id: "E", row: 0, col: 3, length: 2, orientation: "h" },
    { id: "F", row: 2, col: 4, length: 2, orientation: "v" },
    { id: "G", row: 0, col: 1, length: 2, orientation: "v" },
    { id: "H", row: 5, col: 0, length: 3, orientation: "h" },
    { id: "I", row: 4, col: 1, length: 3, orientation: "h" }
  ]
};

export function generateUnblock(minMoves: number, maxMoves: number) {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "L", "M", "N", "P", "Q", "R"];
  
  for (let trial = 0; trial < 150; trial++) {
    const kCol = Math.random() > 0.4 ? 0 : 1;
    const blocks: Block[] = [{ id: "K", row: 2, col: kCol, length: 2, orientation: "h", isKey: true }];
    const grid = Array.from({ length: 6 }, () => Array(6).fill(false));
    for (let c = kCol; c < kCol + 2; c++) grid[2][c] = true;

    // More obstacles for harder target pars
    const count = minMoves >= 7 ? 8 + Math.floor(Math.random() * 4) : 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const len: 2 | 3 = Math.random() > 0.4 ? 2 : 3;
      const orient: "h" | "v" = Math.random() > 0.5 ? "h" : "v";
      for (let t = 0; t < 20; t++) {
        const r = Math.floor(Math.random() * (orient === "v" ? 6 - len + 1 : 6));
        const c = Math.floor(Math.random() * (orient === "h" ? 6 - len + 1 : 6));
        let collides = false;
        for (let k = 0; k < len; k++) {
          const cr = orient === "v" ? r + k : r;
          const cc = orient === "h" ? c + k : c;
          if (grid[cr][cc]) {
            collides = true;
            break;
          }
        }
        if (!collides) {
          for (let k = 0; k < len; k++) {
            const cr = orient === "v" ? r + k : r;
            const cc = orient === "h" ? c + k : c;
            grid[cr][cc] = true;
          }
          blocks.push({ id: letters[i], row: r, col: c, length: len, orientation: orient });
          break;
        }
      }
    }

    // Must have at least one vertical blocker in row 2 in front of the key
    const hasBlocker = blocks.some(
      (b) => !b.isKey && b.orientation === "v" && b.col > kCol + 1 && b.row <= 2 && b.row + b.length > 2
    );
    if (!hasBlocker) continue;

    const state = { size: 6, exitRow: 2, blocks, par: 0, moves: 0 };
    const sol = solveUnblock(state, maxMoves + 4);
    if (sol && sol.length >= minMoves && sol.length <= maxMoves) {
      return {
        size: 6,
        exitRow: 2,
        blocks,
        par: sol.length
      };
    }
  }

  // Tiered fallback if random search completes without matching bracket
  const fallbackKey = minMoves <= 3 ? 3 : minMoves <= 4 ? 4 : minMoves <= 6 ? 6 : minMoves <= 8 ? 8 : 10;
  const fallbackBlocks = UNBLOCK_FALLBACKS[fallbackKey] ?? UNBLOCK_FALLBACKS[3];
  const sol = solveUnblock({ size: 6, exitRow: 2, blocks: fallbackBlocks, par: 0, moves: 0 });

  return {
    size: 6,
    exitRow: 2,
    blocks: fallbackBlocks.map((b) => ({ ...b })),
    par: sol?.length ?? fallbackKey
  };
}

/**
 * Generates the 3 daily puzzles for any calendar date, enforcing the PRD
 * difficulty curve (Monday easiest -> Friday hardest, weekend special).
 */
export function generateDailyPuzzlesForDate(dateStr: string): GeneratedPuzzle[] {
  // Parse date safely at UTC midnight
  const dateObj = new Date(`${dateStr}T00:00:00Z`);
  const dayOfWeek = dateObj.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat

  let difficulty: DifficultyLevel;
  let sfSize: number;
  let sfFast: number;
  let sfSlow: number;

  let swSize: number;
  let swPar: number;
  let swFast: number;
  let swSlow: number;

  let ubMinPar: number;
  let ubMaxPar: number;
  let ubFast: number;
  let ubSlow: number;

  switch (dayOfWeek) {
    case 1: // Monday: Easiest
      difficulty = "easy";
      sfSize = 4;
      sfFast = 25000;
      sfSlow = 70000;

      swSize = 3;
      swPar = 3;
      swFast = 20000;
      swSlow = 60000;

      ubMinPar = 3;
      ubMaxPar = 4;
      ubFast = 20000;
      ubSlow = 60000;
      break;

    case 2: // Tuesday: Easy-Medium
      difficulty = "easy";
      sfSize = 5;
      sfFast = 30000;
      sfSlow = 85000;

      swSize = 3;
      swPar = 4;
      swFast = 25000;
      swSlow = 75000;

      ubMinPar = 4;
      ubMaxPar = 5;
      ubFast = 25000;
      ubSlow = 75000;
      break;

    case 3: // Wednesday: Medium
      difficulty = "medium";
      sfSize = 5;
      sfFast = 35000;
      sfSlow = 95000;

      swSize = 4;
      swPar = 5;
      swFast = 35000;
      swSlow = 95000;

      ubMinPar = 5;
      ubMaxPar = 7;
      ubFast = 35000;
      ubSlow = 95000;
      break;

    case 4: // Thursday: Medium-Hard
      difficulty = "medium";
      sfSize = 6;
      sfFast = 45000;
      sfSlow = 110000;

      swSize = 4;
      swPar = 6;
      swFast = 40000;
      swSlow = 110000;

      ubMinPar = 7;
      ubMaxPar = 9;
      ubFast = 40000;
      ubSlow = 110000;
      break;

    case 5: // Friday: Hardest Weekday
      difficulty = "hard";
      sfSize = 6;
      sfFast = 55000;
      sfSlow = 130000;

      swSize = 4;
      swPar = 8;
      swFast = 50000;
      swSlow = 130000;

      ubMinPar = 9;
      ubMaxPar = 12;
      ubFast = 50000;
      ubSlow = 130000;
      break;

    default: // 0 (Sun) or 6 (Sat): Weekend Special
      difficulty = "weekend";
      sfSize = 6;
      sfFast = 65000;
      sfSlow = 150000;

      swSize = 4;
      swPar = 8;
      swFast = 60000;
      swSlow = 150000;

      ubMinPar = 10;
      ubMaxPar = 14;
      ubFast = 55000;
      ubSlow = 150000;
      break;
  }

  const starfieldPayload = generateStarfield(sfSize);
  const shiftwordPayload = generateShiftword(swSize, swPar);
  const unblockPayload = generateUnblock(ubMinPar, ubMaxPar);

  return [
    {
      type: "starfield",
      releaseDate: dateStr,
      difficulty,
      payload: starfieldPayload,
      par: null,
      tFastMs: sfFast,
      tSlowMs: sfSlow,
      weights: { wE: 0.3, wT: 0.7 }
    },
    {
      type: "shiftword",
      releaseDate: dateStr,
      difficulty,
      payload: shiftwordPayload,
      par: shiftwordPayload.par,
      tFastMs: swFast,
      tSlowMs: swSlow,
      weights: { wE: 0.6, wT: 0.4 }
    },
    {
      type: "unblock",
      releaseDate: dateStr,
      difficulty,
      payload: unblockPayload,
      par: unblockPayload.par,
      tFastMs: ubFast,
      tSlowMs: ubSlow,
      weights: { wE: 0.6, wT: 0.4 }
    }
  ];
}
