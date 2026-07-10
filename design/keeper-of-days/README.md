# Handoff: Stanley — "Keeper of Days"

## Overview
A full redesign of Stanley (personal calendar butler, currently at stanley-butler.vercel.app). Concept: **"A calendar is the only honest autobiography"** — the calendar as the single repository of a whole human life (work, love, health, family, milestones), and Stanley as an AI that learns the human through acts of service: he proposes, the user approves or corrects, and every correction teaches him. Voice: dry, funny British butler ("A butler, technically. A biographer, really.").

Three deliverables:
1. **Desktop landing page** (`Keeper of Days.dc.html`)
2. **Product console** — the app itself (`Stanley Console.dc.html`)
3. **Mobile landing page** (`Keeper of Days Mobile.dc.html`)

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. They use a proprietary streaming-template format (`.dc.html`): the markup between `<x-dc>…</x-dc>` is the template (with `{{ hole }}` bindings), and the `<script data-dc-script>` block contains a React-class-style logic component that supplies data and handlers. Read them as: template = JSX markup, `renderVals()` = props/state wiring.

**Task: recreate these designs in the target codebase's existing environment** (the existing Stanley Next.js/Vercel app) using its established patterns and libraries. If starting fresh, Next.js + React is the natural fit.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and interactions are final. Recreate pixel-perfectly. All copy is intentional and voice-critical — do not paraphrase it.

## Design Tokens

### Colors
- Background: `#0E0D0B` (warm near-black)
- Panel / raised surface: `#12110E`; chat bubble / card: `#181611`; tipping-day tint: `#181310`
- Foreground: `#F2EFE6`; secondary text: `#B8B3A6`; muted/labels: `#6B675C`
- Hairline borders: `#2A2721`; row dividers / unlit grid cells: `#221F1A`
- Accent: `#FF4D2E` (configurable; approved alternates: `#D8FF3E`, `#3E8BFF`, `#FFB13E`). Text on accent: `#0E0D0B`.

### Typography
- **Archivo** (Google Fonts) — display. Headings: weight 900, uppercase, letter-spacing -1px to -3px, line-height 0.92–1. Italic weight 800 for accent-colored emphasis words.
- **Space Mono** (Google Fonts) — all labels, eyebrows, ledger rows, chat text, nav. Labels: 11–14px, letter-spacing 1–3px, uppercase.
- Scale (desktop): h1 116px, section h2 64px, interlude 72px italic (weight 400), body 20–24px, mono labels 13–14px, ledger rows 15px.
- Scale (mobile): h1 37px, h2 34px, body 15–16px, mono 10–12px.

### Spacing & shape
- Desktop sections: padding 88–120px vertical, 56px horizontal; max content width 1440px centered.
- **No border radius anywhere** except chat bubbles (12–14px with a 4px corner on the speaker's side) and small pills.
- Buttons: rectangular, accent background, `#0E0D0B` text, weight 900 uppercase, letter-spacing 1px, padding ~20px 44px.
- Every panel/divider is a 1px hairline — no shadows anywhere.

### Motion
- Blinking cursor block (9×16px accent rect, `step-end` 1.1s infinite) after hero microcopy.
- Marquee quip ticker: duplicated content, `translateX(0 → -50%)` linear infinite, ~30s desktop / 40s mobile.
- Year-grid lit cells: opacity pulse 1 → 0.35 → 1, ease-in-out, randomized 2.4–5.4s per cell.
- Ledger auto-scroll: duplicated list, `translateY(0 → -50%)` linear 26s infinite, with 90px gradient fades top/bottom.
- Dashed circle in interlude: 700px, 1px dashed `#2A2721`, 60s linear rotation.
- Elements entering (chat bubbles, proposals, moved events): fade + 12–16px rise, 0.4–0.6s ease, staggered ~0.25s.

## Screens / Views

### 1. Landing page (desktop) — `Keeper of Days.dc.html`
Sections top to bottom:
1. **Nav** — hairline bottom border; left: 12px accent square + "STANLEY / KEEPER OF DAYS" (mono); right: THE LEDGER / THE MANNER / THE SERVICE / "EMPLOY HIM →" (accent). Anchor links.
2. **Hero** — eyebrow "A BUTLER, TECHNICALLY. A BIOGRAPHER, REALLY." (accent mono, 3px tracking); h1 "A CALENDAR IS THE ONLY HONEST *AUTOBIOGRAPHY.*" (last word italic accent); 2-col row: intro paragraph left, CTA button "EMPLOY STANLEY" + microcopy "he reads before he touches. he asks before he moves. always." + blinking cursor right.
3. **Quip ticker** — hairline top/bottom, marquee of butler quips separated by "✦" (see files for full copy).
4. **Year grid** — 1px bordered panel, header row "YOUR YEAR, AS STANLEY SEES IT · 371 CELLS" / "■ = A THING YOU REFUSED TO FORGET" (accent). 53-column grid of square cells, 5px gap; ~26 accent cells pulse. Legend below: "■ 037 — the first date — he booked nothing after 10pm since", etc.
5. **The Ledger (02)** — split: left copy panel ("ONE REPOSITORY HOLDS EVERYTHING."), right 640px-tall auto-scrolling ledger (bg `#12110E`): rows of [time (accent) | title + italic Stanley footnote (muted) | tag]. e.g. "FRI 20:00 · Dan's stag — you are the best man, act like it · stanley: Saturday has been emptied. Preemptively."
6. **The Manner (03)** — split: copy ("HE NEVER NAGS. HE *MURMURS.*") left; 4 chat bubbles right (Stanley: dark bubble, left, 4px bottom-left corner; user: accent bubble, right).
7. **The Service (04)** — "HE LEARNS YOU BY SERVING YOU." + 4-row table: [SVC id | OBSERVED … | PROPOSED … | status]. Statuses: APPROVED (accent), CORRECTED, PENDING.
8. **Interlude** — centered, rotating dashed circle behind; "ASK YOURSELF" + 72px italic "What do you put in a calendar? THE THINGS YOU REFUSE TO FORGET." (second half accent, bold, uppercase, non-italic).
9. **CTA** — 96px "GIVE STANLEY THE KEYS TO YOUR *DAYS.*", accent button "EMPLOY STANLEY →", footer mono line "HE PROPOSES. YOU DECIDE. THE LEDGER REMEMBERS. THE TEA IS HIS OWN."

### 2. Product console — `Stanley Console.dc.html`
Full-viewport app, three columns under a top bar.
- **Top bar**: brand left; right: "WEEK OF 6 JUL 2026" + pulsing accent dot + week status: "THE WEEK IS TIPPING" (accent) → "THE WEEK IS BREATHING" (secondary) after the first proposal is approved.
- **Left rail (220px)**: nav items THE WEEK / SERVICE LOG (active = white text + 2px accent left border; mono 13px). Bottom: stats "LEANINGS LEARNED" (count) and "CORRECTIONS TAKEN" (accent count) — these update live from the service log.
- **Center — Week view**: 7 equal day columns (MON–SUN) separated by 1px `#221F1A` lines. Day header: name (mono, muted) + right-aligned badge (WED: "TIPPING" in accent, becomes "BREATHING"; THU: "SACRED 18:00"; SAT: "EMPTIED"; SUN: "PROTECTED"). Events: 1px bordered cards with time (mono 11px), title (14px/600), tag (mono 10px). Accent border + accent time = Stanley-flagged events. WED column bg tinted `#181310` while tipping.
- **Center — Service log view**: rows [id | OBSERVED / PROPOSED stacked | status right-aligned]. New entries prepend with entrance animation.
- **Right rail (400px, bg `#12110E`) — "THE MURMUR"**: header "THE MURMUR / STANLEY IS READING (accent)". Chat thread + inline **proposal cards**: accent 1px border, "PROPOSAL · SVC-0121" label, proposal text, two buttons: **SAY THE WORD** (accent, filled) and **NOT QUITE** (ghost, hairline border). Input at bottom: "a word in his ear…" + accent "→" send button.

### 3. Mobile landing — `Keeper of Days Mobile.dc.html`
Same sections as desktop, single column at ~390px width: ledger becomes a static stacked card list, service log stacks vertically per entry, year grid compresses to 28 columns × 168 cells with 3 legend lines, chat bubbles max-width 300px. 58px top safe-area spacer before nav (status bar clearance). The `ios-frame.jsx` device shell in the file is presentation only — not part of the design.

## Interactions & Behavior (console)
State machine, two scripted proposals:
1. `p1` (SVC-0121, pending on load): "Dentist → Friday 9am. The 1pm sync becomes an email."
   - **Approve** ("SAY THE WORD"): user bubble "yes please"; Stanley confirms; WED dentist card removed, WED "Quick sync" gets strikethrough + retitled "Quick sync → became an email" at 45% opacity; FRI gains accent-bordered "Dentist (moved by Stanley, with permission)" card with entrance animation; WED badge TIPPING→BREATHING, bg un-tints; top-bar status flips; SVC-0121 APPROVED prepends to service log; ~900ms later Stanley murmurs the anniversary follow-up and `p2` appears.
   - **Correct** ("NOT QUITE"): user bubble "not quite"; Stanley: "Understood — I've left Wednesday untouched and made a note: you like your chaos artisanal."; week unchanged; SVC-0121 CORRECTED logged; `p2` still appears.
2. `p2` (SVC-0122): hold next Friday evening for the anniversary. Approve/correct → in-character confirmations, log entry.
- **Chat input**: Enter or send button posts user message; Stanley replies after ~800ms via keyword matching (greeting / thanks / move / cancel / availability / overwhelm / apology / "who are you" / negation / question / fallback — exact strings in the file). **In production, replace with a real LLM call**; replies must stay in voice and always restate the consent rule.
- All state is client-side; leanings/corrections counters derive from log statuses.

## State Management
- Landing pages: static (no state).
- Console: `view` ('week' | 'log'), `p1`/`p2` ('pending' | 'approved' | 'corrected'), chat message list, input draft. Week-view event data derives from proposal state (no separate stores).

## Assets
None. No images, no icon fonts, no SVGs. Everything is type, hairlines, and rectangles. Fonts via Google Fonts: Archivo (400/600/800/900 + italics), Space Mono (400/700 + italic).

## Screenshots
In `screenshots/`: `landing-desktop.png`, `01-console.png` (week tipping, proposal pending), `02-console.png` (after "SAY THE WORD" — dentist moved, week breathing), `landing-mobile.png`.

## Files
- `Keeper of Days.dc.html` — desktop landing (canonical design)
- `Stanley Console.dc.html` — product console with interactions
- `Keeper of Days Mobile.dc.html` — mobile landing
- `ios-frame.jsx` — presentation-only device shell used by the mobile file (do not implement)
