# Phase 1 MVP Worksplit Spec

**Date:** April 25, 2026
**Source of truth:** `PRD.md` Section 11 and `docs/superpowers/plans/2026-04-25-phase1-mvp.md`
**Goal:** Partition Phase 1 into three equal, independently shippable workstreams for Haarish, Khem, and Pratik.

---

## Product Goal

Phase 1 replaces the broker's manual commercial insurance intake call with a Telegram intake bot and broker dashboard. A broker should be able to create a client, send a Telegram deep link, receive a complete ACORD-aligned intake dossier with uploaded files and a readiness score, and export a PDF package for review/submission.

---

## Workstream Split

| Owner | Workstream | Boundary | Done When |
|---|---|---|---|
| **Khem** | Telegram intake bot | Business-owner chat experience, intake sequencing, upload capture, resumable sessions | A business owner can open the deep link, complete ACORD Sections A–E, upload required photos/PDFs, resume after leaving, and trigger intake completion. |
| **Pratik** | Broker dashboard + export | Broker-facing UI, demo login, client creation, dossier review, PDF export | A demo broker can enter any email/password, create a client, copy the Telegram link, view a completed dossier with score/uploads, and export the Phase 1 PDF package. |
| **Haarish** | Shared platform, scoring, contracts, QA | Supabase schema, shared types, score engine, integration contracts, acceptance test path | Bot and dashboard use the same persisted contract; scores calculate from intake data; final demo flow passes end to end. Production auth/RLS tightening is deferred. |

The split is intentionally equal by product responsibility, not by number of files. Khem owns the highest-risk external interaction surface, Pratik owns the broker workflow and export, and Haarish owns the data/scoring backbone plus integration quality.

---

## Implementation Status — Apr 25, 2026

**Haarish workstream status:**
- Supabase migration and shared TypeScript data contract are implemented locally.
- Supabase migration has been applied to the shared project and verified for `brokers`, `clients`, `intake_data`, `uploads`, `readiness_scores`, and private `client-uploads`.
- `brokers.id` is app-owned for Phase 1 demo login and no longer requires a matching Supabase Auth user.
- Shared demo broker seeded: `be21add1-fd45-4505-b642-3dc690edf514` / `demo@districtcover.local`.
- Supabase client/server/service helpers are implemented.
- Score engine and score tests are implemented locally.
- Score API and broker notification API helpers/routes are implemented.
- Repo-level `npm test` and `npm run typecheck` pass for the current TypeScript slice.

**Still pending before Khem/Pratik can fully integrate:**
- Haarish still needs to add the single `markIntakeComplete(clientId)` helper that updates `clients.intake_status`, recalculates/upserts score, and triggers broker notification.
- Next.js dashboard/bot surfaces from Pratik and Khem.
- Final end-to-end QA after bot/dashboard integration.

**Phase 1 auth decision:**
- The broker dashboard uses permissive demo login. Any email/password should allow entry.
- This is intentionally not production authentication.
- The dashboard should use a shared/default demo broker context for Phase 1 data until real broker accounts are implemented.
- Real Supabase Auth, broker account provisioning, broker-specific authorization, and strict per-broker RLS behavior move to Phase 2+.

---

## Khem — Telegram Intake Bot

**Owned Phase 1 requirements:**
- Accept `t.me/DistrictCoverBot?start={unique_token}` and load the matching client.
- Greet the business owner by name and explain the intake in plain English.
- Ask ACORD Sections A–E one question at a time.
- Persist each answer as it is received.
- Resume from the next unanswered question if the owner leaves and returns.
- Accept photos and PDFs from Telegram.
- Label each upload against the active intake question.
- Store upload metadata in the shared `uploads` contract.
- Mark intake complete and trigger the shared completion event.

**Primary files:**
- `app/api/telegram/route.ts`
- `lib/telegram/bot.ts`
- `lib/telegram/questions.ts`
- `lib/telegram/session.ts`
- Upload handling code that writes to Supabase Storage and `uploads`

**Interfaces Khem depends on:**
- `clients.intake_token`
- `clients.intake_status`
- `intake_data.section_a` through `intake_data.section_e`
- `intake_data.current_question_key`
- `uploads.client_id`, `uploads.storage_path`, `uploads.file_name`, `uploads.file_type`, `uploads.label`, `uploads.telegram_file_id`

**Acceptance checks:**
- Starting the bot with a valid token greets the correct owner.
- Starting the bot with an invalid token gives a safe error and does not create data.
- Answering questions updates `intake_data`.
- Uploading a photo/PDF creates an `uploads` row with a useful label.
- Leaving and restarting resumes from the correct question.
- Completing the last question sets `clients.intake_status = 'complete'`.

---

## Pratik — Broker Dashboard + Export

**Owned Phase 1 requirements:**
- Permissive demo login that accepts any email/password.
- Dashboard route gate based on local demo session state, not production Supabase Auth.
- Client list with business name, owner, intake status, readiness score, and updated timestamp.
- New client form that creates a client and generates the unique Telegram link.
- Copy/display flow for the Telegram deep link.
- Client detail dossier showing ACORD sections, uploads, and readiness score.
- PDF export containing ACORD field summary, upload list, loss history, and score details.

**Primary files:**
- `app/(auth)/login/page.tsx`
- `app/(dashboard)/layout.tsx`
- `app/(dashboard)/page.tsx`
- `app/(dashboard)/clients/new/page.tsx`
- `app/(dashboard)/clients/[id]/page.tsx`
- `app/api/clients/route.ts`
- `components/client-list-table.tsx`
- `components/new-client-form.tsx`
- `components/client-dossier.tsx`
- `components/score-badge.tsx`
- `app/api/export/[clientId]/route.ts`
- `lib/pdf/dossier-pdf.tsx`

**Interfaces Pratik depends on:**
- `clients` for client identity, owner contact, token, and intake status.
- `intake_data` for ACORD answer display.
- `uploads` for document/photo list.
- `readiness_scores` for broker-visible scoring.
- Haarish-owned score details JSON shape.

**Acceptance checks:**
- Any email/password combination enters the broker dashboard in Phase 1.
- Broker can create a new client without using the database dashboard manually.
- The generated Telegram link includes the unique client token.
- Client list separates pending, in-progress, and complete intake states.
- Client detail loads all persisted ACORD sections and uploads.
- PDF export downloads and includes client identity, ACORD summary, uploads list, and readiness score.

---

## Haarish — Shared Platform, Scoring, Contracts, QA

**Owned Phase 1 requirements:**
- Supabase schema and private storage bucket setup.
- Shared DB types and server/client Supabase helpers.
- ACORD field key contract used by bot, dashboard, score, and PDF export.
- Readiness score engine for five Phase 1 dimensions.
- Score persistence/recalculation contract.
- Broker notification contract when intake is complete.
- Final PRD, spec, and plan alignment.
- End-to-end demo acceptance path.

**Primary files:**
- `supabase/migrations/20260425000000_initial.sql`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/types.ts`
- `lib/score/engine.ts`
- `app/api/score/[clientId]/route.ts`
- `app/api/notify/[clientId]/route.ts`
- Shared contract docs/specs under `docs/specs/`
- Phase 1 plan maintenance under `docs/superpowers/plans/`

**Interfaces Haarish owns:**
- Table definitions for `brokers`, `clients`, `intake_data`, `uploads`, and `readiness_scores`.
- Shared/default demo broker context for Phase 1.
- Storage path convention for client uploads.
- Question key naming convention and section routing.
- Score details JSON shape.
- Intake-complete event behavior.

**Stable intake-complete handoff:**
- Khem calls `markIntakeComplete(clientId)` after the final bot answer/upload step succeeds.
- Haarish owns the implementation of `markIntakeComplete(clientId)`.
- `markIntakeComplete(clientId)` must set `clients.intake_status = 'complete'`, call/recalculate the score contract, and trigger the Phase 1 broker notification.
- Pratik should treat `clients.intake_status = 'complete'` plus a `readiness_scores` row as the dashboard signal that the dossier is ready for review/export.

---

## Shared ACORD Question-Key Contract

Haarish owns this contract and should publish it before Khem and Pratik build against intake JSON. Khem writes these keys into `intake_data`; Pratik reads these same keys for dossier/PDF display; Haarish reads these same keys for scoring.

| Section | Stored JSON Column | Question Keys |
|---|---|---|
| A — Applicant Identity | `intake_data.section_a` | `a_business_name`, `a_entity_type`, `a_fein`, `a_date_started`, `a_website`, `a_phone`, `a_contact_name`, `a_contact_email` |
| B — Premises | `intake_data.section_b` | `b_address`, `b_ownership`, `b_landlord`, `b_total_sqft`, `b_occupied_sqft`, `b_public_sqft`, `b_sublease`, `b_annual_revenue`, `b_fulltime_employees`, `b_parttime_employees`, `b_operations` |
| C — General Information | `intake_data.section_c` | `c_subsidiary`, `c_safety_manual`, `c_hazardous_materials`, `c_other_insurance`, `c_prior_cancellation`, `c_discrimination_claims`, `c_arson`, `c_code_violations`, `c_bankruptcy`, `c_judgements`, `c_trust`, `c_foreign_operations`, `c_other_ventures`, `c_drones` |
| D — Physical Property | `intake_data.section_d` | `d_roof_age`, `d_roof_inspection`, `d_electrical_panel`, `d_electrical_photo`, `d_sprinklers`, `d_sprinkler_certificate`, `d_alarm_system`, `d_alarm_contract`, `d_fire_extinguishers`, `d_extinguisher_photo` |
| E — Loss History | `intake_data.section_e` | `e_prior_carrier`, `e_prior_policy_number`, `e_prior_policy_dates`, `e_prior_premium`, `e_claims`, `e_claims_detail` |

**Contract rules:**
- A key must never move sections after implementation starts.
- Optional answers should be stored as empty string, `false`, or omitted consistently by question type; do not invent alternate key names.
- Dashboard and PDF labels can be user-friendly, but the persisted keys must stay stable.
- A seeded demo client should use this exact key set so all three workstreams can test independently.

---

## Upload Storage and Label Contract

Khem owns upload capture. Haarish owns the storage/table convention. Pratik owns rendering/exporting the upload list.

**Storage path format:**

```text
client-uploads/{client_id}/{question_key}/{upload_id}-{safe_file_name}
```

**Upload row requirements:**
- `client_id`: the client UUID.
- `storage_path`: exact private Supabase Storage path.
- `file_name`: original file name when Telegram provides one; otherwise `{question_key}.{ext}`.
- `file_type`: `photo` for Telegram photos/images, `pdf` for PDF documents.
- `label`: human-readable label derived from the active question, for example `Electrical panel photo` or `Sprinkler inspection certificate`.
- `telegram_file_id`: Telegram file identifier for traceability.

**Display/export rules:**
- Pratik displays uploads grouped by `label`.
- PDF export includes `label`, `file_name`, and uploaded timestamp.
- Phase 1 does not perform AI verification; uploaded files are stored for manual broker review.

**Acceptance checks:**
- Database migration can be applied cleanly to a new Supabase project.
- Phase 1 dashboard can read/write data through the shared/default demo broker context.
- Score engine returns a 0–100 score with five dimension scores.
- Score calculation uses Phase 1 inputs only and does not require SF public data.
- One demo client completes the full path: dashboard client creation → Telegram intake → score calculation → dashboard dossier → PDF export.

---

## Shared Coordination Rules

- No workstream should introduce a second source of truth for client, intake, upload, or score data.
- All workstreams use the ACORD question keys defined for Phase 1.
- Any schema change must be reviewed by Haarish before Khem or Pratik code depends on it.
- Khem and Pratik should not block each other on UI polish; both can work against seeded/demo Supabase data once Haarish publishes the schema.
- Phase 2 features must stay out of Phase 1 unless explicitly approved: advisory Q&A, owner score/checklist view in bot, SF public data, AI photo verification, Kanban pipeline, MGA routing, and Insly integration.

---

## Final Phase 1 Demo Script

1. Broker logs into dashboard.
2. Broker creates a client for an SF business.
3. Dashboard shows and copies the Telegram deep link.
4. Business owner opens the link in Telegram.
5. Bot greets the owner by name and completes ACORD Sections A–E.
6. Owner uploads at least one PDF and one photo.
7. Bot marks intake complete.
8. Score engine calculates the readiness score.
9. Broker opens the client detail dossier.
10. Broker exports the Phase 1 PDF package.
