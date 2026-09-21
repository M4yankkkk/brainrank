-- Illustrative seed data for local development: 3 days of daily sets using the
-- 3 launch puzzle types, with payloads shaped exactly as @brainrank/engine
-- expects them (see packages/engine/src/puzzles/*.ts). Real puzzles are
-- produced by an offline generator (PRD 13.1), out of scope for this phase -
-- these are hand-built so the app has something playable end to end.

with days as (
  select generate_series(current_date, current_date + interval '2 days', interval '1 day')::date as d
),
starfield_puzzles as (
  insert into public.puzzles (type, release_date, difficulty, payload, par, t_fast_ms, t_slow_ms, weights)
  select
    'starfield',
    d,
    'easy',
    jsonb_build_object(
      'size', 4,
      'regions', jsonb_build_array(
        jsonb_build_array(0, 0, 0, 1),
        jsonb_build_array(2, 0, 1, 1),
        jsonb_build_array(2, 2, 3, 1),
        jsonb_build_array(2, 3, 3, 3)
      )
    ),
    null,
    30000,
    90000,
    jsonb_build_object('wE', 0.3, 'wT', 0.7)
  from days d
  returning id, release_date
),
shiftword_puzzles as (
  insert into public.puzzles (type, release_date, difficulty, payload, par, t_fast_ms, t_slow_ms, weights)
  select
    'shiftword',
    d,
    'easy',
    jsonb_build_object(
      'size', 3,
      'grid', jsonb_build_array(
        jsonb_build_array('A', 'T', 'O'),
        jsonb_build_array('G', 'D', 'G'),
        jsonb_build_array('P', 'I', 'C')
      ),
      'par', 3,
      'dictionary', jsonb_build_array('CAT', 'DOG', 'PIG', 'BAT', 'RAT', 'LOG', 'JOG', 'BIG', 'FIG', 'COT'),
      'solutionGrid', jsonb_build_array(
        jsonb_build_array('C', 'A', 'T'),
        jsonb_build_array('D', 'O', 'G'),
        jsonb_build_array('P', 'I', 'G')
      )
    ),
    3,
    15000,
    60000,
    jsonb_build_object('wE', 0.6, 'wT', 0.4)
  from days d
  returning id, release_date
),
unblock_puzzles as (
  insert into public.puzzles (type, release_date, difficulty, payload, par, t_fast_ms, t_slow_ms, weights)
  select
    'unblock',
    d,
    'easy',
    jsonb_build_object(
      'size', 6,
      'exitRow', 2,
      'blocks', jsonb_build_array(
        jsonb_build_object('id', 'K', 'row', 2, 'col', 1, 'length', 2, 'orientation', 'h', 'isKey', true),
        jsonb_build_object('id', 'A', 'row', 1, 'col', 3, 'length', 2, 'orientation', 'v'),
        jsonb_build_object('id', 'E', 'row', 2, 'col', 4, 'length', 2, 'orientation', 'v'),
        jsonb_build_object('id', 'B', 'row', 4, 'col', 0, 'length', 3, 'orientation', 'h'),
        jsonb_build_object('id', 'C', 'row', 0, 'col', 5, 'length', 2, 'orientation', 'v')
      ),
      -- UnblockPayload.par is read by the engine itself (unblock.init -> state.par,
      -- used by efficiency()); it must live inside the payload, not just the
      -- separate `par` column below (which is for querying/display only).
      'par', 3
    ),
    3,
    20000,
    80000,
    jsonb_build_object('wE', 0.6, 'wT', 0.4)
  from days d
  returning id, release_date
)
insert into public.daily_sets (date, puzzle_ids)
select
  d.d,
  array[sf.id, sw.id, ub.id]
from days d
join starfield_puzzles sf on sf.release_date = d.d
join shiftword_puzzles sw on sw.release_date = d.d
join unblock_puzzles ub on ub.release_date = d.d;
