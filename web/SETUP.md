# Stanley — setup & go-live

Stanley is a calendar butler you reach by chat: you message him, he watches the
shape of your week and proposes changes, and he **never writes to your calendar
without a "yes."** The live channel is **Telegram** (free, no per-message cost,
no carrier registration). One Next.js app serves the landing page, the live
demo, the Telegram webhook, the Google OAuth handoff, and the cron jobs.
(SMS via Twilio is an optional alternate channel — see the end.)

## TL;DR — what works with zero accounts

```bash
cd web
npm install
npm run dev          # syncs the soul file, starts http://localhost:3000
```

- **/** — landing page
- **/demo** — the full propose→confirm→write gate against a sample calendar.
  No Telegram, no Google, no database. **This is what a hiring manager clicks.**
- **/console** — the internal voice-testing console (date simulation, probes).
- `npm test` — the briefing engine + write-gate tests.

Only `ANTHROPIC_API_KEY` is needed for the demo to talk to the real Stanley
(already in `.env.local`). Everything else below is for taking the chat live.

---

## Architecture

```
  Telegram bot
     │  inbound message (webhook, secret-token verified)
     ▼
  POST /api/telegram ─► routeInbound():
     ├─ /start / /stop / /help          → onboarding + controls
     ├─ affirmative + live proposal      → execute the calendar WRITE, confirm
     └─ everything else                  → a conversation turn:
            read calendar → assemble context → Stanley (sonnet) replies
                                              │ a Haiku pass extracts any
                                              │ concrete change → pending_proposal
                                              ▼
                                         outbound message (notify → Telegram)

  GET /api/oauth/google/start?token=…   → resolve handoff, Google consent
  GET /api/oauth/google/callback        → store encrypted tokens, send first briefing

  Vercel Cron → /api/cron/morning  (daily briefing)
              → /api/cron/evening  (daily check-in)
              → /api/cron/distill  (nightly Episode Log → Quirks Profile)
```

**The write gate is enforced in server code, not by the model.** Stanley is
never given a tool that writes. He replies in prose; a separate Haiku pass
(`lib/proposal.ts`) turns a concrete proposal into a structured, executable
action stored as a `pending_proposal`. The only place a calendar write happens
is `confirmPending()` (`lib/conversation.ts`), reached only after an affirmative
reply. (This also keeps the soul file untouched — single-writer rule.)

Everything is **channel-agnostic**: `lib/notify.ts` dispatches outbound to
Telegram or SMS based on `user.channel`, and `routeInbound` handles both.

---

## Accounts you need to create (only you can do these)

Fill values into `web/.env.local` (copy from `.env.example`). Add them as
environment variables in your host too.

### 1. Anthropic — ✅ you have this

`ANTHROPIC_API_KEY` (Studio Felix key).

### 2. Telegram bot (the live channel — free)

1. In Telegram, open **@BotFather** → `/newbot` → give it a name and an @handle.
2. Copy the **token** → `TELEGRAM_BOT_TOKEN`; put the @handle (without `@`) in
   `TELEGRAM_BOT_USERNAME` (shown on the landing page).
3. Make a webhook secret and put it in `TELEGRAM_WEBHOOK_SECRET`:
   `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`
4. After deploy: `npm run telegram:setup` registers the webhook
   (`https://YOUR_DOMAIN/api/telegram`) with that secret.

No A2P, no per-message cost, and the bot can message you first once you've
`/start`-ed it.

### 3. Google Cloud (Calendar, read + write)

1. [console.cloud.google.com](https://console.cloud.google.com) → new project.
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **OAuth consent screen** → External → add yourself (and any testers) as test
   users. (Calendar is a sensitive scope; staying in "testing" is fine for the
   prototype — published apps need Google verification.)
4. **Credentials → Create OAuth client ID → Web application.** Authorized
   redirect URI: `https://YOUR_DOMAIN/api/oauth/google/callback` (and
   `http://localhost:3000/api/oauth/google/callback` for local).
5. Copy client id/secret → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and set
   `GOOGLE_OAUTH_REDIRECT_URI` to match.

The scope is `calendar.events` (read + write events only — narrower than full
calendar access).

### 4. Supabase (persistence)

1. Reuse the Eluna project or make a new one at
   [supabase.com](https://supabase.com).
2. **SQL Editor** → paste and run `web/db/schema.sql`.
3. **Project settings → API** → copy the URL → `SUPABASE_URL` and the
   **service_role** key → `SUPABASE_SERVICE_KEY`.

> Leave Supabase blank and the app uses a local JSON file store (`web/.data/`).
> Good for local testing; use Supabase in production.

### 5. Secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  # TOKEN_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"     # CRON_SECRET
```

Set `APP_BASE_URL` to your deployed URL (used for the OAuth handoff + webhook).

---

## Deploy (recommended: Vercel)

One app, one deploy, and `vercel.json` already declares the three crons. Vercel
sends `CRON_SECRET` as a Bearer token automatically, which the cron routes check.

1. `vercel` (or import the repo at vercel.com). Root directory: `web`.
2. Add every env var from `.env.example` in **Project → Settings →
   Environment Variables**.
3. Deploy. Note the URL → set `APP_BASE_URL` and the Google redirect URI to
   point at it, then redeploy.
4. Register the Telegram webhook: `npm run telegram:setup` (or call it once
   from anywhere with the prod env vars).
5. Cron times are UTC in `vercel.json` (currently 7am / 8pm / 3am ET). Adjust as
   needed.

> Render/Railway also work. Vercel is the cleanest fit — one project for the
> web app + webhook + cron.

### Going live, end to end

1. Open your bot in Telegram and send **/start**.
2. Stanley replies with a one-time link → tap it → Google consent.
3. He confirms and sends a first briefing.
4. Morning/evening briefings arrive on schedule; reply **Y** to any proposal to
   let him make the change.

---

## Optional: SMS via Twilio

The code supports SMS as a second channel (`/api/sms/inbound`, `lib/twilio.ts`).
It costs money and needs **US A2P 10DLC** registration (days). Only wire it if
you want a real phone number — set `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` /
`TWILIO_PHONE_NUMBER`, point the number's messaging webhook at
`https://YOUR_DOMAIN/api/sms/inbound`, and `notify()` will route SMS users over
Twilio automatically. Telegram users are unaffected.

---

## Notes

- **The soul file** (`/system_prompt.md`, repo root) is canonical and edited by
  Fable only. `npm run sync-prompt` (auto-runs before dev/build) copies it into
  `web/prompts/`.
- **Single-user first** is the fastest way to validate the voice live (just you,
  your Telegram chat, your calendar). The data model is already multi-user
  (channel + chat-id keyed), so opening it up is just Google verification.
- **Stripe** (~$20/mo) is deliberately last — not yet wired.
