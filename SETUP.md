# Setup & Testing Guide — Telegram Bot

## 1. Create a Telegram Bot

1. Open Telegram and message **@BotFather**
2. Send `/newbot`
3. Choose a name (e.g. `District Cover Test`) and a username (e.g. `districtcover_test_bot`)
4. BotFather replies with your **bot token** — copy it

## 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # from Supabase > Settings > API
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
TELEGRAM_WEBHOOK_SECRET=any-random-string-you-choose  # e.g. "mywebhooksecret42"
NEXT_PUBLIC_APP_URL=https://YOUR_NGROK_URL         # fill in after step 4
```

## 3. Apply Supabase Schema

1. Go to your Supabase project → **SQL Editor**
2. Paste the contents of `supabase/migrations/20260425000000_initial.sql` and run it
3. Go to **Storage** → **New bucket** → name it `client-uploads`, set to **Private**

## 4. Start the Dev Server + ngrok

```bash
npm run dev
```

In a separate terminal:

```bash
# Install ngrok if you haven't: https://ngrok.com/download
ngrok http 3000
```

Copy the `https://` URL ngrok gives you (e.g. `https://abc123.ngrok.io`).

Update `NEXT_PUBLIC_APP_URL` in `.env.local` with that URL, then restart `npm run dev`.

## 5. Register the Telegram Webhook

Run this once (replace the placeholders):

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://YOUR_NGROK_URL/api/telegram",
    "secret_token": "YOUR_TELEGRAM_WEBHOOK_SECRET"
  }'
```

Expected response: `{"ok":true,"result":true}`

## 6. Seed a Demo Client

1. Go to Supabase → **Authentication > Users** → create a user (or sign up via the app)
2. Copy the user's UUID
3. Open `supabase/seed.sql`, replace `YOUR-AUTH-USER-UUID` with that UUID
4. Paste the seed SQL into **SQL Editor** and run it

This creates a demo client with token `demo-test-token-123` for business "Mission Street Coffee / Maria Garcia".

## 7. Test the Bot

Open this URL in a browser or send it to yourself:

```
https://t.me/YOUR_BOT_USERNAME?start=demo-test-token-123
```

**What you should see:**
- Bot greets: "Hi Maria Garcia! 👋 I'm here to help Mission Street Coffee get ready for commercial insurance..."
- Bot asks the first question: "What's the full legal name of your business?"
- Answer questions — verify rows appear in Supabase `intake_data` table
- Upload a photo — verify it appears in Supabase Storage under `client-uploads/`
- If you stop and reopen the link, bot should resume from where you left off
- After the last question, bot sends "That's everything, Maria Garcia! 🎉..."
- Verify `clients.intake_status` = `'complete'` in Supabase
- Verify a row appears in `readiness_scores`

## 8. Verify in Supabase

After answering a few questions, check:

| Table | What to look for |
|---|---|
| `clients` | `intake_status` changes from `pending` → `in_progress` → `complete` |
| `intake_data` | `section_a`, `section_b` etc. filling up as JSONB; `current_question_key` advancing |
| `uploads` | Row per uploaded file with `label`, `storage_path`, `telegram_file_id` |
| `readiness_scores` | Row with `total_score` 0–100 appears when intake completes |

## Troubleshooting

| Problem | Fix |
|---|---|
| Bot doesn't respond | Check ngrok is running and webhook is registered (`getWebhookInfo` API call) |
| "That link isn't valid" | Make sure seed SQL ran and token matches exactly |
| TypeScript errors | Run `npx tsc --noEmit` — should be zero errors |
| Score not calculated | Check `/api/score/{clientId}` call in server logs; ensure `TELEGRAM_WEBHOOK_SECRET` matches |
