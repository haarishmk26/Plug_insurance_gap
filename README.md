# District Cover — Insurance Readiness Platform

Phase 1 builds a Telegram intake bot and broker dashboard for San Francisco small-business insurance readiness. The canonical product scope lives in `PRD.md`; the current implementation plan lives in `docs/superpowers/plans/2026-04-25-phase1-mvp.md`.

## Current Implementation Status

Haarish's shared-platform foundation is implemented locally:

- Supabase schema migration: `supabase/migrations/20260425000000_initial.sql`
- Shared Supabase/data types: `lib/supabase/types.ts`
- Supabase client/server/service helpers: `lib/supabase/client.ts`, `lib/supabase/server.ts`
- Shared Phase 1 demo broker context: `lib/supabase/demo-broker.ts`
- Readiness score engine: `lib/score/engine.ts`
- Score API helper/route: `lib/api/score-route.ts`, `app/api/score/[clientId]/route.ts`
- Notification API helper/route: `lib/api/notify-route.ts`, `app/api/notify/[clientId]/route.ts`
- Score tests: `tests/score/engine.test.ts`
- API/helper tests: `tests/api/`, `tests/supabase/`

The readiness score engine uses the ACORD 125 (2016/03) commercial insurance application as the Phase 1 source of truth for core documentation completeness. The required completeness contract currently covers applicant identity/contact, premises, employee counts, operations, and prior carrier fields.

Remaining Haarish work:

- Add the single `markIntakeComplete(clientId)` helper that Khem's Telegram bot calls at the end of intake. It should set `clients.intake_status = 'complete'`, recalculate/upsert the readiness score, and trigger the Phase 1 broker notification.
- Run final end-to-end QA once Khem's Telegram bot and Pratik's dashboard/export surfaces are wired.

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

Phase 1 uses permissive dashboard login for hackathon speed: any email/password can enter. Real broker authentication, account provisioning, and broker-specific authorization are deferred to Phase 2+.

The shared Phase 1 demo broker context is:

```text
DEMO_BROKER_ID=be21add1-fd45-4505-b642-3dc690edf514
DEMO_BROKER_EMAIL=demo@districtcover.local
DEMO_BROKER_NAME=Demo Broker
```

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
- broker-owned RLS policies for the later production-auth path

For Phase 1 dashboard work, use a shared/default demo broker context through server-side routes. Do not block the hackathon demo on Supabase Auth or per-broker account provisioning.

## Haarish API Contracts

The Telegram bot should call these server routes after intake completion:

```text
POST /api/score/{clientId}
POST /api/notify/{clientId}
```

Both routes require:

```text
x-internal-secret: TELEGRAM_WEBHOOK_SECRET
```

`/api/score/{clientId}` recalculates and upserts `readiness_scores`.

`/api/notify/{clientId}` logs/returns the Phase 1 broker notification payload for the dashboard handoff.

Apply `supabase/migrations/20260425000000_initial.sql` with:

```bash
npm run db:migrate
```

The migration has been applied once to the shared Supabase project and verified to create the five Phase 1 tables plus the private `client-uploads` bucket.
