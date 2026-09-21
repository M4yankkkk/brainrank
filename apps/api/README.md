# @brainrank/api

Fastify + Drizzle API that owns all Brainrank business logic. Supabase provides
only Postgres, Auth, and Storage:

- Clients (web now, Flutter later) sign in with the Supabase SDK directly, then
  send the resulting access token as `Authorization: Bearer <token>` on every
  request here. `src/auth/verifyToken.ts` verifies it against Supabase's JWKS.
- This service connects to Postgres with a table-owning role (bypasses RLS);
  every table has RLS enabled with no policies for `anon`/`authenticated`, so
  the Supabase client SDKs can never read/write app data directly (deny by
  default - see `supabase/migrations/0001_init.sql`).
- `src/lib/engineForType.ts` + `src/routes/attempts.ts` import
  `@brainrank/engine` directly to replay a client's move log and compute the
  final score server-side - the client's own score is never trusted.
- Storage uploads (e.g. avatars) go through `POST /storage/avatar-upload-url`,
  which mints a short-lived signed URL with the service role key; clients
  never hold that key.
- Scheduled work (`/internal/cron/daily-rollover`, `/internal/cron/season-end`)
  is plain internal HTTP routes guarded by an `x-cron-secret` header; Render
  Cron Jobs (see `/render.yaml`) just `curl` them on a schedule.

## Development

```bash
cp .env.example .env   # fill in a local Supabase project's values
pnpm dev                # tsx watch
pnpm test
pnpm typecheck
pnpm openapi             # regenerates openapi/openapi.json (for the future Flutter client)
```

## Routes

See `openapi/openapi.json` (or `GET /docs` for Swagger UI) for the full,
generated spec. Summary:

| Route | Auth | Purpose |
|---|---|---|
| `GET /puzzles/today` | user | Today's 3-puzzle set for the caller's local date + their attempt status |
| `GET /puzzles/:id` | user | One puzzle + attempt status |
| `POST /puzzles/:id/attempts` | user | Submit a move log; server replays it and scores it |
| `POST /groups` | user | Create a group (becomes owner, starts season 1) |
| `POST /groups/join` | user | Join by 6-character invite code |
| `GET /groups` | user | Groups the caller belongs to |
| `GET /groups/:id` | user | Members, today's leaderboard, season standings |
| `DELETE /groups/:id/members/:userId` | owner | Remove a member |
| `POST /storage/avatar-upload-url` | user | Signed Storage upload URL |
| `POST /internal/cron/daily-rollover` | cron secret | Roll yesterday's play into streaks + season standings |
| `POST /internal/cron/season-end` | cron secret | Crown champions for ended seasons, start the next one |
