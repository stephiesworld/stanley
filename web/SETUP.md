# Stanley — local setup

## Run it

```bash
cd web
npm install
npm run dev        # syncs the soul file, starts http://localhost:3000
npm test           # briefing-engine tests
```

`web/.env.local` needs:

```
ANTHROPIC_API_KEY=sk-ant-...        # already copied from the harness
GOOGLE_CLIENT_ID=                   # see below
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

Without Google credentials, the app runs against the built-in mock
calendar (Stephie's June 2026) — full pipeline, real Stanley.

## Google Calendar (read-only) — one-time setup

1. [console.cloud.google.com](https://console.cloud.google.com) → create project "stanley"
2. **APIs & Services → Library** → enable **Google Calendar API**
3. **APIs & Services → OAuth consent screen** → External → add yourself as a test user
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy the client ID + secret into `web/.env.local`
6. Restart `npm run dev`, click **Connect Google Calendar**

Scope is `calendar.readonly` — Stanley cannot move, create, or delete
anything. Propose-only is brand AND safety.

## Architecture notes

- **The soul file** (`system_prompt.md`) is canonical at the repo root.
  Single-writer rule: Fable edits it, nobody else. `npm run sync-prompt`
  (auto-runs before dev/build) copies it into `web/prompts/`.
- **The briefing engine** (`web/lib/briefing/`) implements the three
  harness-validated input-shaping specs:
  1. *Structured events* — normalized, transit-tagged (`normalize.ts`)
  2. *Today-forward windowing* — past events never reach Stanley (`window.ts`)
  3. *Computed-facts header* — code derives, Stanley narrates (`facts.ts`)
- **Token storage** is a dev-only httpOnly cookie; moves to Supabase
  when Eluna's auth plumbing is cherry-picked in.
- **Stripe** is deliberately last per Part 4 scope — not yet wired.
