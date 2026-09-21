-- Brainrank core schema (PRD section 13.3), scoped to the 3 MVP launch puzzles.
--
-- Architecture: Supabase provides Postgres + Auth + Storage only. All reads and
-- writes go through the apps/api Fastify service, which connects with a
-- privileged Postgres role (table owner) and therefore bypasses RLS. Every
-- table below enables RLS with NO policies granted to `anon`/`authenticated`,
-- so the Supabase client SDKs used directly by the web/Flutter apps (for
-- sign-in only) can never read or write application data - deny by default.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  timezone text not null default 'UTC',
  is_plus boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🧠',
  color text not null default '#7E62F0',
  invite_code text not null unique,
  owner_id uuid not null references public.users (id),
  season_length_days integer not null default 14 check (season_length_days in (7, 14, 28)),
  best_n_days integer,
  created_at timestamptz not null default now()
);
alter table public.groups enable row level security;
create index groups_owner_id_idx on public.groups (owner_id);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  is_active boolean not null default true,
  primary key (group_id, user_id)
);
alter table public.group_members enable row level security;
create index group_members_user_id_idx on public.group_members (user_id);

-- ---------------------------------------------------------------------------
-- seasons
-- ---------------------------------------------------------------------------
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  number integer not null,
  start_date date not null,
  end_date date not null,
  champion_user_id uuid references public.users (id),
  unique (group_id, number)
);
alter table public.seasons enable row level security;
create index seasons_group_id_idx on public.seasons (group_id);

-- ---------------------------------------------------------------------------
-- puzzles / daily_sets
-- ---------------------------------------------------------------------------
create table public.puzzles (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('starfield', 'shiftword', 'unblock')),
  release_date date not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'weekend')),
  payload jsonb not null,
  par integer,
  t_fast_ms integer not null,
  t_slow_ms integer not null,
  weights jsonb not null,
  created_at timestamptz not null default now(),
  unique (type, release_date)
);
alter table public.puzzles enable row level security;
create index puzzles_release_date_idx on public.puzzles (release_date);

create table public.daily_sets (
  date date primary key,
  puzzle_ids uuid[] not null,
  bonus_puzzle_id uuid references public.puzzles (id)
);
alter table public.daily_sets enable row level security;

-- ---------------------------------------------------------------------------
-- attempts (one scored attempt per puzzle per user, PRD 6.2 / 13.4)
-- ---------------------------------------------------------------------------
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  puzzle_id uuid not null references public.puzzles (id),
  local_date date not null,
  move_log jsonb not null default '[]',
  active_time_ms integer not null default 0,
  hints_used integer not null default 0,
  solved boolean not null default false,
  points integer not null default 0,
  validated boolean not null default false,
  pause_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, puzzle_id)
);
alter table public.attempts enable row level security;
create index attempts_user_local_date_idx on public.attempts (user_id, local_date);
create index attempts_puzzle_id_idx on public.attempts (puzzle_id);

-- ---------------------------------------------------------------------------
-- cached rollups
-- ---------------------------------------------------------------------------
create table public.daily_scores (
  user_id uuid not null references public.users (id) on delete cascade,
  local_date date not null,
  total_points integer not null default 0,
  puzzles_completed integer not null default 0,
  primary key (user_id, local_date)
);
alter table public.daily_scores enable row level security;

create table public.season_standings (
  season_id uuid not null references public.seasons (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  points integer not null default 0,
  days_played integer not null default 0,
  full_sets integer not null default 0,
  best_day integer not null default 0,
  primary key (season_id, user_id)
);
alter table public.season_standings enable row level security;

create table public.stats (
  user_id uuid not null references public.users (id) on delete cascade,
  puzzle_type text not null check (puzzle_type in ('starfield', 'shiftword', 'unblock')),
  played integer not null default 0,
  avg_points numeric(6, 2) not null default 0,
  best integer not null default 0,
  streak integer not null default 0,
  primary key (user_id, puzzle_type)
);
alter table public.stats enable row level security;

-- ---------------------------------------------------------------------------
-- reactions
-- ---------------------------------------------------------------------------
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references public.users (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  local_date date not null,
  from_user_id uuid not null references public.users (id) on delete cascade,
  emoji text not null check (emoji in ('🔥', '😮', '😂', '👑', '🧠')),
  created_at timestamptz not null default now(),
  unique (target_user_id, group_id, local_date, from_user_id, emoji)
);
alter table public.reactions enable row level security;
create index reactions_group_local_date_idx on public.reactions (group_id, local_date);

-- No policies are created for anon/authenticated on any table above: with RLS
-- enabled and zero policies, every row is denied to those roles by default.
-- The apps/api service connects as the table-owning role and is unaffected.
