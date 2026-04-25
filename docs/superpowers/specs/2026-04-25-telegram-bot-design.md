# Telegram Intake Bot — Design Spec (Khem / Option A)

**Date:** 2026-04-25
**Owner:** Khem
**Status:** Approved — building

## What We're Building

Full self-contained build of Khem's Telegram intake bot workstream, including the project bootstrap and shared Supabase infrastructure needed to run and test it. Pratik's dashboard and Haarish's score engine are stubbed minimally so the app compiles; those owners flesh them out independently.

## Architecture

```
Telegram User
     │  sends message / file
     ▼
Telegram API  (POST webhook with secret token)
     │
     ▼
app/api/telegram/route.ts   — validates TELEGRAM_WEBHOOK_SECRET header
     │
     ▼
lib/telegram/bot.ts         — Grammy bot: /start + message + file handlers
     │
     ├── lib/telegram/questions.ts   — 35 ACORD A–E questions, skip logic
     ├── lib/telegram/session.ts     — Supabase reads/writes, markIntakeComplete
     └── Supabase
           ├── DB: clients, intake_data, uploads, brokers, readiness_scores
           └── Storage: client-uploads (private bucket)
```

## Data Flow (one conversation turn)

1. Owner sends message → Telegram POSTs to `/api/telegram`
2. Bot resolves client by `telegram_chat_id` → loads `intake_data.current_question_key`
3. Answer saved to section JSONB column (`section_a`–`section_e`)
4. `getNextQuestionKey(currentKey, allAnswers)` applies skip logic → sends next question
5. On last answer: `markIntakeComplete(clientId)` sets `intake_status = 'complete'`, fires score API

## Resumable Sessions

`current_question_key` is written after every answer. If the owner leaves and returns, `/start` or any message picks up from that key with no data loss.

## File Uploads

- Bot receives `photo` or `document` from Telegram
- Downloads from `api.telegram.org/file/bot{TOKEN}/{file_path}`
- Uploads to Supabase Storage: `client-uploads/{client_id}/{question_key}.{ext}`
- Inserts `uploads` row: `client_id`, `storage_path`, `file_name`, `file_type`, `label`, `telegram_file_id`
- Non-required upload questions can be skipped with text

## Scope Built in This Session

| Component | Owner in Plan | Built here? |
|---|---|---|
| Next.js bootstrap | Task 1 (all) | Yes — boilerplate only |
| Supabase schema SQL | Haarish (Task 2) | Yes — exact schema from plan |
| Supabase clients + types | Haarish (Task 3) | Yes — exact code from plan |
| middleware.ts | Haarish (Task 3) | Yes |
| ACORD question sequence | Khem (Task 6) | Yes |
| Session helpers | Khem (Task 7) | Yes |
| Bot handler + webhook route | Khem (Task 8) | Yes |
| Score engine stub | Haarish (Task 9) | Stub only |
| Broker dashboard | Pratik (Tasks 4–5, 10–13) | Stub only |

## Testing Flow

1. Create bot via BotFather → copy token
2. Fill `.env.local` (Supabase URL, anon key, service role key, bot token, webhook secret, app URL)
3. Apply schema SQL in Supabase SQL Editor
4. Create `client-uploads` storage bucket (private)
5. `npm run dev` + `ngrok http 3000`
6. Register webhook: `curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" -d '{"url":"https://NGROK/api/telegram","secret_token":"SECRET"}'`
7. Seed one client row in Supabase with a known `intake_token`
8. Open `t.me/YourBot?start={token}` → bot greets by name → complete intake → verify in Supabase

## References

- Full implementation plan: `docs/superpowers/plans/2026-04-25-phase1-mvp.md` (Tasks 1–3, 6–8)
- Worksplit contract: `docs/specs/2026-04-25-phase1-worksplit.md`
- PRD: `PRD.md` Sections 6.1, 8, 11
