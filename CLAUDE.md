# Stanley

A personal calendar assistant with the manner of a great English butler —
dry, brief, entirely on his principal's side. He protects the SHAPE of the
week, not just the slots. Propose-only: he never acts without a yes.
Paid from day one (~$20/mo). Google Calendar read-only for v1, email later.
Successor to Eluna (~/eluna — leave that repo and its live deploy untouched).

## Governance — the single-writer rule (non-negotiable)

`system_prompt.md` (repo root) is "the soul file." It is edited by **Fable
only** (a Claude chat Stephie runs; edits arrive through her, verbatim).
Claude Code NEVER modifies it on its own judgment — findings flow back to
Fable, edits flow one direction. Commit soul changes with Fable's exact
message when one is given.

## Layout

- `system_prompt.md` — the soul, canonical, single source (currently v1.4.1)
- `harness/` — voice-testing harness: `chat.py` + profile/calendar fixtures;
  transcripts committed in `harness/transcripts/`
- `web/` — the app (Next.js 16 + TS). See `web/SETUP.md` for run +
  Google OAuth setup. Briefing engine in `web/lib/briefing/` implements the
  three experiment-validated input-shaping specs: structured/transit-tagged
  events, today-forward windowing, computed-facts header (code derives,
  Stanley narrates).

## Working agreements

- Test harness: `cd harness && export $(grep ANTHROPIC_API_KEY ../.env) &&
  python3 chat.py [--date "YYYY-MM-DD HH:MM"] [--calendar f] [--profile f]`
- Probe gradings use three axes: facts / judgment / voice. Report format:
  scorecard, worst two with transcript quotes, best one.
- Voice tells to watch for (graded out in v1.4, don't let them return):
  template openers, hedge-chains, service-closers, coverage-instead-of-
  choosing, toasts/sendoffs.
- Register taste (from the variation exercise): `voice/register-memo-for-
  fable.md`. Short version — Stanley is a dry, quick-witted conspirator on
  her side; teases lightly, remembers her *feelings/rhythms* (not her
  performance), cares via logistics he *offers* (never claims dominion:
  "I've got the week from here" was rejected). NOT precise/spreadsheet-y,
  clipped, anxious/hovering, mock-formal, or a feelings-corrector.
- Model: claude-sonnet-4-6, max_tokens 1000, system prompt cached.
- Visual brand (redesigned July 10, from Stephie's design handoff — spec kept
  in `design/keeper-of-days/`): **"Keeper of Days"** — warm near-black
  (`#0E0D0B`), hairlines (`#2A2721`), cream-white (`#F2EFE6`), signal accent
  (`#FF4D2E`; approved alternates `#D8FF3E`/`#3E8BFF`/`#FFB13E`); Archivo 900
  uppercase display + Space Mono for every label/ledger/chat line; no border
  radius except chat bubbles, no shadows, everything hairlines and rectangles.
  Concept: "a calendar is the only honest autobiography." Defined in
  `web/app/keeper.css` (`.kd-*` landing, `.kdc-*` console). Revised July 10
  per Stephie: big headings are **sentence case** (not all-caps), emphasis
  words sit in a **1px accent box** (a lit cell — never the italic-accent-word
  cliché), and copy runs a notch softer than the handoff (goodbye not funeral,
  "keeps the week from getting the better of you", CTA "Give Stanley the week.
  He'll give most of it back."). Labels/nav/buttons stay uppercase mono. The
  old gentleman's-club tokens remain in `globals.css` only for the `/console`
  voice tool.

## State (July 10, 2026)

- Voice: passed the 12-probe battery; register defined by the sample
  exchanges in the soul file.
- Known open issue for Fable: retreat-pattern decision-question never fires
  (0/5 attempts, morning + evening + multi-turn).
- App is now the **chat butler** built into `web/` (one Next.js app, deploys to
  Vercel; see `web/SETUP.md`). Live channel is **Telegram** (free, no A2P, no
  per-message cost — Stephie chose this over paying for Twilio SMS). Twilio SMS
  kept as an optional alternate channel. Built + locally verified:
  - Channel-agnostic: `routeInbound` (`lib/conversation.ts`) + `lib/notify.ts`
    dispatch by `user.channel`. Telegram webhook `/api/telegram` (secret-token
    verified); Twilio `/api/sms/inbound` (signature-verified) still present.
    Users keyed by `channel` + `chat_id` (was `phone`).
  - **Write gate**: Stanley replies in prose (soul untouched); a Haiku pass
    (`lib/proposal.ts`) extracts a concrete change → `pending_proposal`; the
    ONLY write site is `confirmPending()`, reached only after a texted yes.
    Calendar writes via `lib/google.ts` (scope `calendar.events`).
  - Storage abstraction (`lib/store/`): Supabase in prod, JSON file store as
    the zero-account local fallback. Tokens AES-256-GCM encrypted at rest.
  - Crons (`vercel.json`): morning/evening briefings + nightly distillation
    (Episode Log → Quirks Profile, `lib/distill.ts`).
  - **`/demo` is the Stanley Console** (July 10 redesign): fixed sample week
    (6–12 Jul 2026), two scripted proposals (SVC-0121/0122) carry the opening
    choreography, and the murmur chat runs the REAL brain (`/api/demo` —
    same propose→confirm→write gate, browser-owned mock calendar; the API
    returns `pendingSummary` so extracted proposals render as SAY THE WORD /
    NOT QUITE cards). Still stateless, still the "hiring managers can use it
    now" surface. `/console` keeps the voice-testing tool (old brand).
- **Live in production** since June 30: https://stanley-butler.vercel.app
  (Vercel project `web` + Supabase; Telegram bot @StanleyBearBot). Deploy with
  `vercel --cwd web --prod --yes`, then re-point the alias:
  `vercel alias set <new-deployment> stanley-butler.vercel.app`.
- Stripe last. No autonomous calendar writes, ever, in v1.
