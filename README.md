# Brainrank

Daily brain-puzzle game for friend groups — web MVP (PRD_Group_Puzzle_App.md).
This phase: the shared puzzle engine, the API/backend, and the React web app
for the 3 launch puzzles (Starfield, Shiftword, Unblock).

## Architecture

- **Supabase**: Postgres + Auth (Google + email magic link) + Storage only.
  Every table has RLS enabled with no policies for `anon`/`authenticated` -
  deny by default. Clients use the Supabase SDK only to sign in.
- **`apps/api`**: Fastify + Drizzle, deployed to Render. Owns all business
  logic. Verifies the client's Supabase access token via JWKS, imports
  `@brainrank/engine` directly to replay move logs and score attempts
  server-side, and serves an OpenAPI spec (`apps/api/openapi/openapi.json`)
  for a future Flutter client. Scheduled work (season end, daily rollover,
  cached standings) runs as Render Cron Jobs hitting internal API routes.
- **`packages/engine`**: pure, dependency-free TypeScript puzzle engine
  (no DOM/Node/browser APIs), shared between the web app (client-side move
  application) and the API (server-side validation/scoring) - and later a
  Flutter port, verified against `packages/engine/test-vectors/*.json`.
- **`packages/tokens`**: design tokens extracted from `brainrank-home.html`,
  as JSON (for the future Flutter app) and generated CSS custom properties
  (for the web app).
- **`apps/web`**: Next.js (App Router) + Tailwind + Motion + `@use-gesture/react`.

## Layout

```
packages/engine     puzzle rules + scoring (PRD 6.3, 8.1, 8.4, 8.9)
packages/tokens      design tokens (JSON + generated CSS)
apps/api             Fastify + Drizzle API (Render)
apps/web              Next.js web app (3 launch puzzles)
supabase              migrations, RLS, seed data (Postgres/Auth/Storage only)
render.yaml           API web service + cron jobs
```

## Getting started

```bash
corepack enable && corepack prepare pnpm@9 --activate
pnpm install

# engine: tests + golden vectors
pnpm --filter @brainrank/engine test
pnpm --filter @brainrank/engine gen-vectors   # regenerate test-vectors/*.json from the engine

# tokens: generate dist/tokens.css consumed by the web app
pnpm --filter @brainrank/tokens build

# supabase (local): postgres + auth + storage only
supabase start
supabase db reset   # applies supabase/migrations + supabase/seed/seed.sql

# api
cp apps/api/.env.example apps/api/.env   # fill in local Supabase values
pnpm --filter @brainrank/api dev

# web
cp apps/web/.env.local.example apps/web/.env.local
pnpm --filter @brainrank/web dev
```

## Not in this phase

Payments, push notifications, the other 7 puzzle types, and the Flutter app
(built later against the same `apps/api` + OpenAPI spec, verified against
`packages/engine/test-vectors`).
