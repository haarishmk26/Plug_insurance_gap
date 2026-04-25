# District Cover — Insurance Readiness Platform

Phase 1 builds a Telegram intake bot and broker dashboard for San Francisco small-business insurance readiness. The canonical product scope lives in `PRD.md`; the current implementation plan lives in `docs/superpowers/plans/2026-04-25-phase1-mvp.md`.

## Current Implementation Status

Haarish's shared-platform workstream has started:

- Supabase schema migration: `supabase/migrations/20260425000000_initial.sql`
- Shared Supabase/data types: `lib/supabase/types.ts`
- Readiness score engine: `lib/score/engine.ts`
- Score tests: `tests/score/engine.test.ts`

## Local Setup

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run TypeScript checks:

```bash
npm run typecheck
```

Apply the Supabase schema migration:

```bash
npm run db:migrate
```

## Environment

Local secrets live in `.env`, which is ignored by git. Use `.env.example` for the expected shape.

Current known Supabase pooler values:

```text
SUPABASE_DB_HOST=aws-1-us-east-2.pooler.supabase.com
SUPABASE_DB_PORT=6543
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.ijnahwfuiqikntjlmyty
```

Still needed from Supabase:

- demo broker Auth user/profile

Still needed for Telegram/local webhook work:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- Telegram bot username

## Supabase Migration

The Phase 1 migration creates:

- `brokers`
- `clients`
- `intake_data`
- `uploads`
- `readiness_scores`
- private `client-uploads` storage bucket
- broker-owned RLS policies

Apply `supabase/migrations/20260425000000_initial.sql` with:

```bash
npm run db:migrate
```

The migration has been applied once to the shared Supabase project and verified to create the five Phase 1 tables plus the private `client-uploads` bucket.
