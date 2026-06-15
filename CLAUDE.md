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

## State (June 12, 2026)

- Voice: passed the 12-probe battery; register defined by the sample
  exchanges in the soul file.
- Known open issue for Fable: retreat-pattern decision-question never fires
  (0/5 attempts, morning + evening + multi-turn).
- App: scaffold + briefing engine + tests done; runs on mock calendar.
  Waiting on Stephie's Google Cloud OAuth creds (web/SETUP.md). Then:
  onboarding interview, evening check-in + episode log (Layer 2), nightly
  distillation, Stripe last. No autonomous calendar writes, ever, in v1.
