# PRD: Brainrank — Daily Brain Puzzles for Your Group

**Working name:** Brainrank (placeholder — check Play Store and trademark availability)
**Version:** 1.0 (MVP)
**Platform:** Android first (Google Play), iOS + web later
**Owner:** Solo founder
**Status:** Draft
**Replaces:** The earlier single-puzzle "Shiftword" PRD

---

## 1. Summary

Brainrank is a daily puzzle challenge for friend groups. Every day, everyone gets the same small set of short brain puzzles (logic, words, numbers, spatial). Players solve them whenever they like, earn points, and climb their group's leaderboard. Points add up across a season, and at the end one player is crowned the group's champion.

**One-line pitch:** "Your group's daily brain battle."

**Positioning:** Existing group-challenge apps (e.g., playus) focus on reflex and skill mini-games. Brainrank is the thinking version: puzzles that reward reasoning, not touch speed, so scores are fair on every phone. It is built and optimized Android-first.

---

## 2. Problem and Opportunity

- Daily puzzles (Wordle, Sudoku, LinkedIn's puzzles, NYT Games) have proven that a short daily ritual builds strong habits.
- Group challenge apps have proven that friends competing on a shared leaderboard keeps people coming back.
- Nobody has combined the two well: a polished, puzzle-first, group-competition app.
- Reflex-based games can feel unfair across devices (touch latency, screen size, multi-touch differences). Puzzles avoid that problem.

---

## 3. Target Users

**Primary:** 16–35 year olds who enjoy Wordle-style puzzles, logic games, and friendly competition, and who live in group chats.

**Typical groups:**
- College friends / hostel groups
- Office teams (a fun daily ritual)
- Families spread across cities
- Online communities (Discord, X circles)

**Personas**
| Persona | Situation | What they want |
|---|---|---|
| Karan, 20 | College, 6 close friends in a group chat | Bragging rights every day |
| Priya, 28 | Works in a team of 8 | A 5-minute daily ritual that brings the team together |
| Anil, 52 | Parent, family in different cities | A reason to connect with kids daily |

---

## 4. Goals and Success Metrics

**Product goals**
1. Daily set takes 4–7 minutes total.
2. Joining a group and playing the first puzzle takes under 60 seconds.
3. Scoring feels fair and understandable across different puzzle types.

**Metrics (first 3 months)**
| Metric | Target |
|---|---|
| Day-1 retention | ≥ 45% |
| Day-7 retention | ≥ 25% |
| Day-30 retention | ≥ 15% |
| Avg group size | ≥ 4 |
| % users in at least one group | ≥ 70% |
| Full daily set completion (of daily players) | ≥ 60% |
| % of players who share their result | ≥ 10% |
| Free → Plus conversion | 2–4% |

**North star metric:** Number of active groups (≥ 3 members played in the last 7 days).

---

## 5. Core Loop

```
Join / create a group (invite link)
        ↓
Daily notification: "Today's puzzles are live"
        ↓
Play today's set (3 puzzles, ~5 min)
        ↓
Points → group leaderboard (today + season)
        ↓
See friends' results, react, trash-talk
        ↓
Share result card → new players join
        ↓
Season ends → champion crowned → new season
```

---

## 6. Game Structure

### 6.1 Daily set
- Each day has **3 puzzles** from the active puzzle pool, same for everyone worldwide.
- Rotation ensures variety: a mix of categories (e.g., 1 logic, 1 word, 1 spatial or number) each day.
- Every puzzle type appears at least twice a week once the pool is large enough.
- **Difficulty curve:** Monday easiest → Friday hardest; weekend has larger "special" versions.
- **Sunday bonus:** a 4th puzzle worth bonus points (optional, v1.1).
- New puzzles unlock at the player's local midnight.

### 6.2 One scored attempt
- Each puzzle can be played **once for points** per day. Puzzles are deterministic, so retries would just reward memorizing.
- If the app is closed mid-puzzle, the attempt resumes where it left off; the timer counts only active time (paused when app is backgrounded, with a cap on total pauses to prevent abuse — see anti-cheat).
- After finishing, the player can view the solution and friends' results.

### 6.3 Scoring (normalized 0–100 per puzzle)
All puzzles convert their result to 0–100 points so different types can be added together.

**Components**
- **Efficiency score (E):** based on moves/taps/guesses vs. par, or mistakes. 0–1.
- **Time score (T):** based on solve time vs. two per-puzzle reference times:
  - `t_fast` = time of a strong player (≈ 20th percentile from beta/playtest)
  - `t_slow` = time of a slow player (≈ 90th percentile)
  - `T = clamp(1 − (t − t_fast) / (t_slow − t_fast), 0, 1)`
- **Hint penalty (H):** −15 points per hint used.

**Formula**
```
points = round(100 × (wE × E + wT × T)) − H
points = max(points, 10) if solved, else partial points (per puzzle rules)
```
Each puzzle defines its own weights `wE` and `wT` (see puzzle specs). Solving always gives at least 10 points so finishing matters.

`t_fast` and `t_slow` start from estimates (by solver difficulty), then are recalibrated automatically after the first ~200 plays of each puzzle type/difficulty. Scores shown to players are final at submission (recalibration applies to future puzzles only).

**Daily score:** sum of the day's puzzles (max 300, or 400 on bonus days).

### 6.4 Groups
- 2–30 members per group (free: up to 3 groups joined).
- Create: name, emoji, color. Invite via link and 6-character code.
- **Today tab:** who has played, points per puzzle, ranking.
- **Season tab:** standings, points, days played, full sets completed.
- Reactions on each member's daily result (🔥 😮 😂 👑 🧠) and short comments.
- Group owner can remove members and choose season length.

### 6.5 Seasons
- Default **14 days**; group owner can pick 7, 14, or 28.
- Season score = sum of daily scores. Optional rule (owner setting, on by default): **"best N days count"** (e.g., best 12 of 14) so one busy day doesn't ruin a season.
- Tiebreak: more full sets completed, then higher single-day best.
- End of season: animated podium, champion badge (👑) shown next to their name for the next season, shareable "Season Champion" card.
- New season starts automatically the next day.

### 6.6 Global and personal stats
- **Global percentile per puzzle:** "You beat 82% of players today."
- Global daily leaderboard (top 100) per puzzle type — mainly for the competitive players who want it.
- Personal stats per puzzle type: games played, average points, best, streak, time trend chart.
- Streaks: daily streak (played at least 1 puzzle) and full-set streak.

---

## 7. Shared Puzzle Frame (UI/UX consistency)

Every puzzle uses the same frame so a new type feels familiar instantly.

```
┌─────────────────────────────┐
│ ←   Starfield      ⏱ 0:42  │  ← top bar: back, name, timer
│     Moves 7 · Par 9         │  ← puzzle-specific counter
├─────────────────────────────┤
│                             │
│         [ BOARD ]           │  ← only this area changes
│                             │
├─────────────────────────────┤
│  ↶ Undo    💡 Hint    ?     │  ← bottom bar: undo, hint, rules
└─────────────────────────────┘
```

**Common rules**
- **First-time tutorial** for each puzzle type: an interactive 15–30 second mini-puzzle, not text. Skippable, always available via "?".
- **Undo** always available (whether it counts as a move is defined per puzzle).
- **Hint** reveals one helpful step; costs 15 points; confirmation before use.
- **Haptics:** light tick on each action, stronger pulse on progress (row complete, region lit), success pattern on solve.
- **Sound:** subtle and optional; off by default if phone is on silent.
- **Solve moment:** 1–2 second celebration animation specific to each puzzle, then the result screen.
- **Result screen (same for all):** points earned with breakdown (efficiency / time / hints), group rank today, global percentile, "Next puzzle" button, share button.
- **Accessibility:** color-blind safe palettes (patterns/symbols in addition to color), large tap targets (≥ 44dp), dark mode, adjustable text size.
- **Performance target:** 60fps on mid-range Android devices; puzzle opens in < 300ms (puzzles pre-downloaded).

---
## 8. Puzzle Library (10 puzzles)

**Launch set (MVP):** Starfield, Shiftword, Unblock
**Rollout after launch:** roughly one new type every 3–4 weeks, in this order: Flow Pipes → Target → Codebreaker → Flip → Word Ladder → Pixel Logic → Groups

| # | Puzzle | Category | Content source | Avg time | Launch |
|---|---|---|---|---|---|
| 1 | Shiftword | Word | Generated | 1–3 min | MVP |
| 2 | Word Ladder | Word | Generated | 1–2 min | Later |
| 3 | Groups | Word / knowledge | Hand-written | 2–3 min | Later |
| 4 | Starfield | Logic | Generated | 1–3 min | MVP |
| 5 | Pixel Logic | Logic | Curated art + generated clues | 2–3 min | Later |
| 6 | Codebreaker | Logic / deduction | Generated | 1–2 min | Later |
| 7 | Target | Numbers | Generated | 1–2 min | Later |
| 8 | Flow Pipes | Spatial | Generated | 1–2 min | Later |
| 9 | Unblock | Spatial | Generated | 1–2 min | MVP |
| 10 | Flip | Spatial / logic | Generated | 1–2 min | Later |

---

### 8.1 Shiftword

**Category:** Word · **Weights:** wE 0.6, wT 0.4

**Concept:** A letter grid where every row hides a word, but the rows and columns have been shifted out of place.

**Rules**
- The board is an N×N grid of letters (3×3 easy, 4×4 standard, 5×5 weekend).
- Swiping a row left/right shifts all its letters one position, with the end letter wrapping around to the other side.
- Swiping a column up/down does the same vertically.
- Goal: every row reads as a valid word (left to right).
- Any arrangement where all rows are valid words counts as solved, not only the intended one.

**Controls**
- Swipe horizontally on a row to shift it; swipe vertically on a column to shift it.
- Direction is locked after the first ~10px of the swipe to avoid accidental diagonal moves.
- Each swipe = 1 move. Undo reverses a move but still counts as 1 move.

**Difficulty**
| Level | Grid | Scramble depth |
|---|---|---|
| Easy (Mon) | 3×3 | 3–5 shifts |
| Medium (Tue–Thu) | 4×4 | 6–9 shifts |
| Hard (Fri) | 4×4 | 10–13 shifts |
| Weekend | 5×5 | 10–15 shifts |

**Generation**
1. Curated list of common words per length (no offensive, obscure, or overly technical words).
2. Pick N words for rows.
3. Scramble with K random row/column shifts; reject if any row is already a valid word at start.
4. Solver (IDA* search) computes the minimum moves → **par**.
5. Reject puzzles where the minimum is much lower than intended difficulty.

**Scoring:** E = min(1, par / moves). Time as standard.

**UI/UX**
- Big rounded tiles with bold letters; slide animation with a slight spring.
- A row that forms a word turns green and gets a subtle glow; if a later move breaks it, it fades back.
- Moves counter vs. par in the top bar, turning amber when you exceed par.
- Solve animation: rows flip over one by one, revealing the words.

**Edge cases:** Words that exist but are unfamiliar to many users should be avoided at generation, but accepted if the player forms them (dictionary check on device).

**Tutorial:** 2×2 board, one swipe needed.

---

### 8.2 Word Ladder

**Category:** Word · **Weights:** wE 0.6, wT 0.4

**Concept:** Transform a start word into a goal word, one letter at a time.

**Rules**
- Given a start word and a goal word of the same length (e.g., COLD → WARM).
- Each step changes exactly one letter, and each new word must be a valid word.
- Letters can't be added, removed, or reordered.
- Goal: reach the target word in as few steps as possible. Maximum 15 steps; after that, the puzzle ends unsolved.

**Controls**
- Tap a letter in the current word to select it.
- A compact alphabet strip appears; tap a new letter.
- Invalid word → tile shakes, no step is used.
- Undo removes the last step (doesn't count against you).

**Difficulty**
| Level | Word length | Shortest path |
|---|---|---|
| Easy | 3 letters | 3–4 steps |
| Medium | 4 letters | 4–5 steps |
| Hard | 4–5 letters | 6–7 steps |

**Generation**
1. Build a graph where each word is a node, and words differing by one letter are connected.
2. Pick start/goal pairs whose shortest path length fits the difficulty (BFS).
3. Prefer pairs with a meaningful link (COLD → WARM, LOVE → HATE) for charm; maintain a list of "nice pairs," fill gaps with random pairs.
4. Use only common words in the graph for generation; the player may use any valid dictionary word.

**Scoring:** E = min(1, shortest / steps). If unsolved: 0 efficiency, and time score is not applied; points = 0.

**UI/UX**
- Start word at the top, goal word pinned at the bottom, steps stack in between like rungs of a ladder.
- Letters that already match the goal word's letters in the same position are highlighted, helping players see progress.
- Solve animation: the ladder "climbs," rungs light up top to bottom.

**Edge cases:** Allow proper validation of plurals and common forms from the dictionary; block proper nouns and abbreviations.

**Tutorial:** CAT → COT → DOT (2 steps).

---

### 8.3 Groups

**Category:** Word / knowledge · **Weights:** wE 0.7, wT 0.3

**Concept:** Sort 16 words into 4 hidden groups of 4 that share a connection.

**Rules**
- Board shows 16 words in a 4×4 grid.
- Select 4 words and submit. If they form a group, they lock together and the category is revealed.
- Wrong submission = 1 mistake. 4 mistakes and the puzzle ends.
- If a guess has 3 of 4 correct, show "One away."
- Groups have difficulty levels: easy, medium, hard, tricky (color-coded after solving).

**Controls**
- Tap to select/deselect (max 4 selected).
- Buttons: Shuffle, Deselect all, Submit.

**Difficulty:** Comes from category cleverness and red herrings (words that seem to fit multiple groups). Monday puzzles have obvious categories; Friday puzzles use wordplay (e.g., "words before *fish*").

**Content creation**
- Hand-written; this is the only puzzle that needs a human each day.
- Internal content tool (simple admin page): enter 4 categories × 4 words, mark difficulty, preview.
- Aim to have 30+ days written ahead. Later, can accept community submissions with review.
- Avoid culture-specific trivia that excludes international players; offer regional packs later.

**Scoring**
- E = 1 − (mistakes × 0.2). Solved with 0 mistakes → E = 1.0.
- Failed (4 mistakes): points = 5 per group found (max 15).

**UI/UX**
- Word tiles in soft neutral color; selected tiles raise slightly with a darker color.
- Correct group: 4 tiles slide together into a colored bar showing the category name.
- Mistakes shown as 4 dots that empty as you use them.
- After finishing, all groups revealed with explanations.
- Share card shows the order of guesses as colored squares (spoiler-free).

**Tutorial:** 8 words, 2 groups (e.g., fruits vs. colors).

---

### 8.4 Starfield

**Category:** Logic · **Weights:** wE 0.3, wT 0.7

**Concept:** Place stars on a grid of colored regions so that every row, column, and region has exactly one star.

**Rules**
- An N×N grid (6×6 to 9×9) divided into N colored regions.
- Place exactly one star in each row, each column, and each region.
- Stars cannot touch each other, including diagonally.
- There is always exactly one solution.

**Controls**
- Tap a cell once → mark X (ruled out).
- Tap again → star.
- Tap again → clear.
- Long-press + drag → mark X across many cells quickly.
- Optional setting: "Auto-X" automatically marks cells that can't hold a star after placing one (off in competitive scoring? — see open questions).

**Difficulty**
| Level | Size | Required techniques |
|---|---|---|
| Easy | 6×6 | Single-cell regions, simple elimination |
| Medium | 7×7 | Row/region interactions |
| Hard | 8×8 | Multi-region counting |
| Weekend | 9×9 | Advanced deductions |

**Generation**
1. Randomly place N non-touching stars, one per row and column (backtracking).
2. Grow N regions from the stars using a randomized flood fill until every cell belongs to a region.
3. Run a logical solver that uses human-style techniques; accept only puzzles with a **unique** solution solvable without guessing.
4. Difficulty rating = hardest technique the solver needed + number of steps.
5. Reshape regions and retry if not unique.

**Scoring**
- Efficiency counts **wrong stars placed** (a star later removed because it conflicted): E = max(0, 1 − 0.25 × wrong_stars).
- Xs never count against you.
- Time is the main factor.

**UI/UX**
- Soft pastel region colors, each with a subtle texture pattern for color-blind users.
- Conflicting stars turn red instantly with a gentle shake.
- When a row, column, or region is complete, it gets a soft glow.
- Solve animation: stars twinkle in sequence and the board's colors brighten.

**Tutorial:** 4×4 board with 2 cells pre-filled.

---

### 8.5 Pixel Logic

**Category:** Logic · **Weights:** wE 0.3, wT 0.7

**Concept:** Use number clues to figure out which cells are filled, revealing a hidden pixel picture (nonogram).

**Rules**
- Grid of 5×5 to 10×10 cells.
- Each row and column has clue numbers showing the lengths of filled runs, in order. "3 1" = a run of 3 filled cells, at least one empty cell, then 1 filled cell.
- Goal: fill exactly the right cells. Every puzzle has one unique solution solvable by logic.

**Controls**
- Tap a cell to fill; tap again to clear.
- Mode toggle at bottom: ■ Fill / ✕ Mark empty.
- Drag across cells to fill or mark a line in one gesture (direction locks to a row or column).
- Pinch-to-zoom disabled for sizes up to 8×8; enabled for 10×10.

**Difficulty**
| Level | Size |
|---|---|
| Easy | 5×5 |
| Medium | 7×7 |
| Hard | 8×8 |
| Weekend | 10×10 |

**Content and generation**
1. A curated library of pixel images (icons: animals, food, objects) drawn by you or commissioned, in original designs only.
2. Clues are computed automatically from the image.
3. A line solver checks the puzzle is uniquely solvable by pure logic; if not, adjust the image slightly or drop it.
4. Store images with a color palette for the final reveal (puzzle is solved in one color, then revealed in full color).

**Scoring**
- Mistakes = filled cells that are wrong at the moment a line is completed (the app checks each line when its clue count is satisfied).
- E = max(0, 1 − 0.2 × mistakes).
- Setting (off by default): "check mistakes instantly," which shows errors immediately but applies a penalty.

**UI/UX**
- Clue numbers that are satisfied fade to grey.
- Row/column under the finger is highlighted to help reading clues.
- Solve animation: the grid bursts into the full-color image, with the title revealed ("A little fox!").
- The revealed image is the share moment (share card shows it after the day ends to avoid spoilers, or shows the silhouette only).

**Tutorial:** 3×3 image with obvious clues.

---

### 8.6 Codebreaker

**Category:** Logic / deduction · **Weights:** wE 0.7, wT 0.3

**Concept:** Crack a secret color code using feedback from each guess.

**Rules**
- A secret code of 4 slots, each one of 6 colors.
- Each guess gives feedback:
  - ● (filled) = right color in the right slot
  - ○ (hollow) = right color in the wrong slot
- Feedback shows counts only, not which slots.
- Maximum 8 guesses.

**Controls**
- Tap a color in the palette to fill the next empty slot.
- Tap a filled slot to clear it.
- "Submit" enabled when all 4 slots are filled.
- Long-press a slot to mark a color as "ruled out" in a notes row (optional helper).

**Difficulty**
| Level | Slots | Colors | Duplicates |
|---|---|---|---|
| Easy | 4 | 5 | No |
| Medium | 4 | 6 | No |
| Hard | 4 | 6 | Yes |
| Weekend | 5 | 7 | Yes |

**Generation:** Random code under the difficulty's rules. Trivial to generate.

**Fairness note:** Because everyone has the same code, a lucky first guess can happen. To reduce luck:
- Efficiency uses guesses relative to a solver's worst-case optimal (≈ 5 guesses for 4×6): E = min(1, 5 / guesses), capped at 1.0 — so finishing in 3 isn't worth much more than finishing in 5.
- Time weight is lower (0.3) since thinking time matters less than guess efficiency.

**Scoring:** As above. Unsolved after 8 guesses: points = 10.

**UI/UX**
- Each guess appears as a row: 4 colored pegs + a small 2×2 feedback cluster.
- Colors also carry a symbol (●▲■◆★✚) for color-blind users.
- Previous guesses remain visible so players can reason.
- Solve animation: the hidden code at the top "unlocks" with a click and a slide.
- Share card: rows of feedback symbols only (spoiler-free), like Wordle.

**Tutorial:** 3 slots, 4 colors, guided first guess.

---

### 8.7 Target

**Category:** Numbers · **Weights:** wE 0.7, wT 0.3

**Concept:** Combine number tiles with +, −, ×, ÷ to hit a target number exactly.

**Rules**
- 6 number tiles, e.g., small numbers (1–10) and large ones (25, 50, 75, 100).
- A target number (e.g., 347).
- Combine two tiles with an operation → they merge into one new tile with the result.
- Each tile can be used once. You don't have to use all tiles.
- No negative numbers or fractions: subtraction must give a positive result, division must be exact.
- Submit when a tile equals the target, or submit your closest tile.

**Controls**
- Tap tile → tap operator (+ − × ÷) → tap second tile → merged tile appears.
- Undo reverses the last merge.
- Reset returns to the starting tiles (no penalty).
- "Submit closest" button available anytime.

**Difficulty**
| Level | Target range | Solution complexity |
|---|---|---|
| Easy | 20–100 | 2–3 operations |
| Medium | 100–500 | 3–4 operations |
| Hard | 500–999 | 4–5 operations |

**Generation**
1. Pick 6 tiles from a pool based on difficulty.
2. Build random valid expression trees to produce candidate targets in range.
3. Exhaustive solver checks: target reachable exactly, and computes the minimum number of tiles used.
4. Reject targets reachable in trivial ways (e.g., one multiplication).

**Scoring**
- Exact hit: E = 1.0, plus a 10% bonus if you used the minimum number of tiles (capped at 100 total points).
- Not exact: E = max(0, 1 − |target − result| / 10) × 0.6 (within 10 still gets partial credit).
- Time as standard.

**UI/UX**
- Tiles look like chunky rounded cards; merging animates two tiles flying together into one.
- Target number displayed large at the top with the difference from your closest tile shown underneath ("12 away").
- Big, friendly operator buttons, so it feels like a game rather than a math test.
- Solve animation: the final tile flies into the target and it bursts.

**Tutorial:** Tiles 2, 3, 5; target 25 → (2 + 3) × 5.

---

### 8.8 Flow Pipes

**Category:** Spatial · **Weights:** wE 0.5, wT 0.5

**Concept:** Rotate pipe tiles to connect the water source to every outlet with no leaks.

**Rules**
- A grid (5×5 to 8×8) of pipe tiles: straight, corner, T-junction, cross, and end pieces.
- One water source; several outlets (e.g., flowers or houses).
- Tap a tile to rotate it 90° clockwise.
- Solved when water reaches every outlet and no pipe has an open end.
- Any valid full connection counts as solved.

**Controls**
- Tap to rotate clockwise.
- Long-press to lock a tile (visual marker) so you don't accidentally rotate it; locked tiles don't count as taps.

**Difficulty**
| Level | Grid | Outlets |
|---|---|---|
| Easy | 5×5 | 3 |
| Medium | 6×6 | 4–5 |
| Hard | 7×7 | 6 |
| Weekend | 8×8 | 7–8 |

**Generation**
1. Generate a random spanning tree on the grid starting from the source (randomized DFS or Prim's algorithm).
2. Place outlets at leaf nodes.
3. Convert each cell's connections into a tile type.
4. Rotate every tile randomly.
5. **Par** = sum of minimum rotations needed per tile to reach a valid solution (accounting for symmetrical tiles like straights and crosses).

**Scoring:** E = min(1, par / taps). Time as standard.

**UI/UX**
- Water visibly flows through connected pipes in real time, animated from the source.
- Connected pipes are colored; disconnected ones stay grey.
- Leaking open ends show a small drip animation.
- Solve animation: all outlets light up / flowers bloom.

**Tutorial:** 3×3 with 2 tiles to rotate.

---

### 8.9 Unblock

**Category:** Spatial · **Weights:** wE 0.6, wT 0.4

**Concept:** Slide blocks out of the way to get the key block to the exit.

**Rules**
- 6×6 board with an exit on the right side of the 3rd row.
- Blocks are 2 or 3 cells long, horizontal or vertical.
- Horizontal blocks only slide left/right; vertical blocks only up/down.
- Blocks can't pass through each other.
- The key block (highlighted) is horizontal in the exit row. Goal: slide it out through the exit.

**Controls**
- Drag a block along its axis; it snaps to the nearest grid position on release.
- One continuous drag = 1 move, regardless of distance.
- Undo reverses the last move (still counts as a move).

**Difficulty**
| Level | Minimum moves | Blocks |
|---|---|---|
| Easy | 6–10 | 7–9 |
| Medium | 11–18 | 9–11 |
| Hard | 19–30 | 11–13 |
| Weekend | 30+ | 12–14 |

**Generation**
1. Generate random board layouts with the key block in the exit row.
2. BFS solver finds the minimum solution; discard unsolvable boards.
3. Keep boards whose minimum move count fits the difficulty.
4. Pre-generate a large database (thousands) offline; pick daily puzzles from it by difficulty and uniqueness of layout.

**Scoring:** E = min(1, par / moves). Time as standard.

**UI/UX**
- Wooden or clean flat blocks with a soft shadow; key block in the accent color.
- Smooth drag with finger-follow physics and snapping; blocks can't be dragged into others (they stop at the edge).
- Soft "clack" sound on snap (optional).
- Solve animation: key block slides out through the exit with a whoosh; board fades.

**Tutorial:** 1 blocker to move, then slide the key out.

---

### 8.10 Flip

**Category:** Spatial / logic · **Weights:** wE 0.6, wT 0.4

**Concept:** Tapping a tile flips it and its neighbors. Make the whole board one color.

**Rules**
- A 5×5 grid (4×4 easy, 6×6 weekend) of two-sided tiles, light and dark.
- Tapping a tile flips it and its up/down/left/right neighbors.
- Goal: make all tiles light.
- Order of taps doesn't matter mathematically, and tapping the same tile twice cancels out, so the minimum solution is well-defined.

**Controls**
- Tap to flip.
- Undo reverses the last tap (tapping again does the same, but undo doesn't count as a move).

**Difficulty**
| Level | Grid | Minimum taps |
|---|---|---|
| Easy | 4×4 | 3–5 |
| Medium | 5×5 | 6–9 |
| Hard | 5×5 | 10–13 |
| Weekend | 6×6 | 12–16 |

**Generation**
1. Start from all-light; apply a random set of taps.
2. Compute the true minimum solution using linear algebra over GF(2) (check all equivalent solutions, since some grid sizes have multiple).
3. **Par** = minimum taps. Keep only puzzles whose par fits the difficulty.

**Scoring:** E = min(1, par / taps). Time as standard.

**UI/UX**
- Tiles flip with a quick 3D card-flip animation; neighbors flip with a tiny delay for a ripple effect.
- Light side and dark side use very different brightness plus a small icon, for accessibility.
- Solve animation: the entire board ripples out from the last tapped tile.

**Tutorial:** 3×3 solvable in 1 tap (center).

---
## 9. App Features

### 9.1 MVP (v1.0)
- Play first puzzle without signing in (guest mode); sign in with Google or phone OTP to save progress and join groups.
- Invite link opens directly into "Join [Group name]" (deep link; if app isn't installed, Play Store → then auto-join after install via install referrer).
- Daily set of 3 puzzles (from Starfield, Shiftword, Unblock).
- Groups: create, join, invite, today leaderboard, season leaderboard, reactions.
- Seasons with champion podium and badge.
- Result screen with points breakdown, group rank, global percentile.
- Daily share card (text + image).
- Personal stats and streaks.
- Notifications (see 9.4).
- Plus subscription (see section 12).

### 9.2 v1.1
- New puzzle type every 3–4 weeks.
- Group chat (lightweight, text + emoji only) on the group page.
- Sunday bonus puzzle.
- Home screen widget: today's set progress + group rank.
- Archive and practice mode (Plus).

### 9.3 Later
- Web version for instant play from shared links.
- Async duels: challenge one friend to a specific puzzle.
- Public leagues (join a random group of similar-skill players for a season).
- Community-submitted Groups puzzles.
- Regional/language puzzle packs.
- iOS app.

### 9.4 Notifications
| Notification | When | Limit |
|---|---|---|
| "Today's puzzles are live" | User-chosen time | 1/day |
| "Riya just scored 278 — can you beat her?" | Friend beats your usual score, you haven't played | 1/day |
| "You're 12 points behind 1st place" | Evening, if not played, during a close season | 1/day |
| "Streak ends at midnight" | Evening, if streak ≥ 3 and not played | 1/day |
| "Season ends tomorrow" | Day before season end | Per season |
| "👑 Karan won the season!" | Season end | Per season |
| "New puzzle type: Flow Pipes" | Launch of a new type | Rare |

Hard cap: max 2 push notifications per day per user.

---

## 10. Key Screens

| Screen | Contents |
|---|---|
| Welcome | One-line pitch, "Play today's puzzle" (guest) |
| Sign in | Google / phone OTP |
| Home | Today's 3 puzzle cards (status: new / in progress / done with points), total today, streak, group rank snippets |
| Puzzle | Shared frame + board (section 7) |
| Result | Points breakdown, group rank, global percentile, next puzzle, share |
| Daily summary | After finishing all 3: total score, group ranking, share card |
| Groups list | All groups with your rank in each |
| Group detail | Today tab / Season tab / Members / Settings |
| Season end | Podium animation, champion card, share |
| Stats | Per-puzzle stats, streaks, charts |
| Settings | Notifications, theme, sound, haptics, account |
| Paywall | Plus features |

**Home card design:** each puzzle is a card with its icon, name, difficulty dots, and a small illustration. Cards flip to show points when done. A progress bar across the top shows 0/3 → 3/3.

---

## 11. Share Card

**Text version (WhatsApp / X):**
```
Brainrank #57 🧠
⭐ Starfield   94
🔤 Shiftword   81
🧱 Unblock     88
Total 263/300 · #2 in Hostel Crew
brainrank.app/g/abc123
```

**Image version (Instagram Stories):** styled card with puzzle icons, scores, group rank, and QR/link. No puzzle answers shown.

The link opens the group invite (if shared from a group) or the app download page.

---

## 12. Monetization

**Model:** Freemium. The daily set, groups, and seasons are free forever — that's the social core and must stay free.

| Free | Brainrank Plus |
|---|---|
| Daily set (3 puzzles) | Daily set (3 puzzles) |
| Join/create up to 3 groups | Unlimited groups |
| 1 hint per week | 1 hint per day |
| Basic stats | Advanced stats, trends, per-type insights |
| — | Full archive of past puzzles |
| — | Practice mode: unlimited puzzles of every type |
| Default theme | All themes, custom tile styles, app icons |
| — | Custom season lengths and rules (for groups you own) |
| — | Profile badge/frame |

**Group Plus (v1.1):** one member pays a bit more to unlock Plus perks for everyone in a single group (e.g., office teams). Good for B2B-lite growth.

**Pricing:** Low monthly price, annual at ~50% off (default selection), regional pricing in Play Console. Test a lifetime "Founding Member" option for early fans.

**Ads:** No ads during puzzles or on result screens. Optional later: rewarded ad for one extra hint, only for free users, never forced.

**Paywall moments:** joining a 4th group, running out of hints, tapping the archive, tapping practice mode, viewing advanced stats.

---

## 13. Technical Approach

### 13.1 Stack
- **App:** React Native with Expo, Reanimated + Gesture Handler (smooth gestures), React Native Skia for board rendering and animations. (Flutter is a valid alternative.)
- **Backend:** Supabase — Postgres, Auth, Storage, Realtime (live leaderboard updates), Edge Functions.
- **Puzzle engine:** TypeScript package shared between app and Edge Functions (rules, move validation, scoring).
- **Generators and solvers:** Offline scripts (Python or TypeScript) run locally or in CI; output puzzles to the database weeks ahead.
- **Push notifications:** Expo Notifications / Firebase Cloud Messaging.
- **Payments:** RevenueCat + Google Play Billing.
- **Analytics:** PostHog or Firebase Analytics.
- **Crash reporting:** Sentry.
- **Deep links / invites:** Android App Links + Play Install Referrer for post-install auto-join.

### 13.2 Puzzle engine design
Each puzzle type implements a common interface:
```ts
interface PuzzleType<State, Move> {
  id: string;                         // "starfield", "shiftword", ...
  init(payload): State;               // build board from stored puzzle data
  applyMove(state: State, move: Move): State;
  isSolved(state: State): boolean;
  efficiency(result): number;         // 0–1, per puzzle rules
  hint(state: State): Move | null;
}
```
- Adding a new puzzle type = implement this interface + a board component. The frame, timer, scoring, result screen, and sharing are reused.
- Moves are recorded as a log for server validation.

### 13.3 Data model (simplified)
```
users
  id, username, avatar, timezone, created_at, is_plus

groups
  id, name, emoji, color, invite_code, owner_id,
  season_length_days, best_n_days, created_at

group_members
  group_id, user_id, role, joined_at, is_active

seasons
  id, group_id, number, start_date, end_date, champion_user_id

puzzles
  id, type, release_date, difficulty, payload (json),
  par, t_fast, t_slow, weights (json)

daily_sets
  date, puzzle_ids (array), bonus_puzzle_id

attempts
  id, user_id, puzzle_id, local_date, move_log (json),
  active_time_ms, hints_used, solved, points,
  validated, created_at

daily_scores (cached)
  user_id, local_date, total_points, puzzles_completed

season_standings (cached)
  season_id, user_id, points, days_played, full_sets, best_day

reactions
  id, target_user_id, group_id, local_date, from_user_id, emoji

stats (cached)
  user_id, puzzle_type, played, avg_points, best, streak
```

### 13.4 Anti-cheat and fairness (lightweight)
- **Server validation:** the Edge Function replays the move log against the puzzle payload to confirm it's solved and recompute points. The client never decides the final score.
- **Time sanity:** solve times below a per-puzzle minimum (faster than physically possible) are flagged and excluded from global leaderboards.
- **Pause limits:** time pauses when the app is backgrounded, but total pause count is capped (e.g., 3) and long pauses show "paused" on the result, visible to the group.
- **Payload protection:** tomorrow's puzzles are pre-downloaded encrypted; the key is fetched at unlock time, so the app opens instantly without spoilers leaking early.
- **One attempt per puzzle per day** enforced server-side.

### 13.5 Timezones
- Each player's day = their local date. A group season spans calendar dates; each member plays each date's puzzles in their own local day.
- Leaderboard for "today" uses each player's local date.

### 13.6 Performance
- Target 60fps on mid-range Android devices (test on 2–3 real budget phones).
- All boards rendered with Skia; avoid heavy re-renders.
- App cold start < 2s; puzzle open < 300ms.

---

## 14. Analytics Events

| Event | Properties |
|---|---|
| guest_puzzle_started | puzzle_type |
| signup_completed | method, from_invite |
| group_created | — |
| invite_shared | channel |
| invite_joined | group_id, installed_via_link |
| puzzle_started | type, difficulty |
| puzzle_completed | type, solved, points, efficiency, time, hints |
| puzzle_abandoned | type, moves_so_far |
| tutorial_completed | type |
| daily_set_completed | total_points |
| share_card_shared | format, channel |
| reaction_sent | emoji |
| season_ended | group_size, champion_points |
| paywall_viewed | trigger |
| subscription_started | plan |

**Key dashboards:** retention by group size, daily set completion rate, per-puzzle average points and abandon rate (to tune difficulty), invite funnel.

---

## 15. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Competing with playus and similar apps | Clear positioning: puzzles vs. reflex; best Android performance; seasons + puzzles combo |
| Players without friends on the app | Solo play with global percentile; later, public leagues |
| Scores feel unfair across puzzle types | Normalized 0–100 scoring, auto-calibrated time references, "best N days" in seasons |
| Some puzzles too hard/easy | Solver-based difficulty ratings + recalibration from live data; monitor abandon rates |
| Content workload (Groups puzzle) | Launch without it; add once there's time or help; content tool; queue ahead |
| Cheating (solvers, second devices) | Server validation, time sanity checks, friends-only competition limits motivation |
| Scope creep with 10 puzzle types | Launch with 3; strict one-at-a-time rollout; shared engine interface |
| Notification fatigue | Max 2/day, user-controlled |

---

## 16. Milestones

| Week | Deliverable |
|---|---|
| 1 | Paper/web prototypes of Starfield, Shiftword, Unblock; test with 10 people |
| 2 | Generators + solvers for the 3 launch puzzles; 60 days of puzzles queued |
| 3 | Design system, shared puzzle frame, home and result screens (Figma) |
| 4–5 | Puzzle engine + 3 boards with polished gestures, animations, haptics |
| 6 | Auth, guest mode, scoring, server validation |
| 7 | Groups, invites (deep links), today + season leaderboards |
| 8 | Seasons, share cards, stats, streaks, notifications |
| 9 | Closed beta: 10+ real friend groups for 2 weeks; calibrate t_fast/t_slow |
| 10–11 | Fixes, polish, paywall + RevenueCat, Play Store listing |
| 12 | Launch on Play Store |
| +3–4 weeks each | Flow Pipes → Target → Codebreaker → Flip → Word Ladder → Pixel Logic → Groups |

**Beta success gate:** ≥ 50% of beta groups still playing daily after 2 weeks, and ≥ 60% of daily players completing all 3 puzzles.

---

## 17. Open Questions
1. Should Starfield's "Auto-X" helper be allowed in scored play, or only in practice mode?
2. 3 puzzles per day, or 2 on weekdays and 3–4 on weekends?
3. Should the group see each member's time, or only points?
4. Season length default: 14 days or 7 days for faster payoff?
5. Guest mode: allow joining a group as a guest, or require sign-in?
6. Final name and brand identity.
