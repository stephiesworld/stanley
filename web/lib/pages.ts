// Standalone HTML for the OAuth return page. Self-contained styles (no React /
// globals.css here — it's served raw from the callback route). Brass-and-ink:
// deep ink ground, brass rule, a serif calling-card voice.
export function youreSetPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Stanley — you're set</title>
<style>
  :root { --ink:#122019; --ink-2:#16271e; --brass:#c9a24b; --brass-2:#e3c97e; --paper:#efe7d6; --muted:#9aa890; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center;
    background: radial-gradient(140% 120% at 50% 0%, var(--ink-2), var(--ink));
    color: var(--paper); font-family: ui-serif, Georgia, "Times New Roman", serif; }
  .card { max-width: 30rem; margin: 2rem; padding: 2.5rem 2.75rem; text-align:center;
    border: 1px solid rgba(201,162,75,.35); border-radius: 14px;
    background: linear-gradient(180deg, rgba(201,162,75,.06), rgba(0,0,0,.15)); }
  .crest { width:48px; height:48px; margin:0 auto .4rem; border-radius:50%;
    background: linear-gradient(180deg, var(--brass-2), var(--brass)); color:#2a2008;
    display:flex; align-items:center; justify-content:center; font-size:1.7rem; font-weight:600;
    box-shadow: 0 0 0 1px rgba(201,162,75,.35), inset 0 0 0 2px rgba(42,32,8,.18); }
  .mark { font-size: .8rem; letter-spacing: .35em; text-transform: uppercase; color: var(--brass); }
  h1 { font-size: 2.1rem; margin: .6rem 0 .2rem; font-weight: 600; }
  .rule { width: 56px; height: 2px; margin: 1.1rem auto; background: linear-gradient(90deg, transparent, var(--brass-2), transparent); }
  p { line-height: 1.6; color: #d9cfba; }
  .hint { color: var(--muted); font-size: .92rem; margin-top: 1.4rem; }
</style>
</head>
<body>
  <main class="card">
    <svg width="72" height="72" viewBox="0 0 96 96" role="img" aria-label="Stanley the butler bear" style="display:block;margin:0 auto .2rem">
      <circle cx="26" cy="24" r="14" fill="#b3893f"/><circle cx="70" cy="24" r="14" fill="#b3893f"/>
      <circle cx="26" cy="25" r="6.5" fill="#ecdcb6"/><circle cx="70" cy="25" r="6.5" fill="#ecdcb6"/>
      <circle cx="48" cy="50" r="32" fill="#b3893f"/><ellipse cx="48" cy="60" rx="17" ry="13" fill="#ecdcb6"/>
      <circle cx="32" cy="58" r="3.5" fill="#6e2a2a" opacity=".32"/><circle cx="64" cy="58" r="3.5" fill="#6e2a2a" opacity=".32"/>
      <circle cx="37" cy="45" r="3" fill="#241c14"/><circle cx="59" cy="45" r="3" fill="#241c14"/>
      <ellipse cx="48" cy="54" rx="4.4" ry="3" fill="#241c14"/>
      <path d="M48 57 V60 M48 60 q-4.5 3.5 -8 1 M48 60 q4.5 3.5 8 1" fill="none" stroke="#241c14" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M48 80 L39 75 L39 86 Z" fill="#6e2a2a"/><path d="M48 80 L57 75 L57 86 Z" fill="#6e2a2a"/><circle cx="48" cy="80.5" r="3" fill="#5a2020"/>
    </svg>
    <div class="mark">Stanley</div>
    <h1>You're set.</h1>
    <div class="rule"></div>
    <p>Your calendar's connected. I've sent a note to your phone — a short read of
       the week ahead is on its way.</p>
    <p class="hint">You can close this tab. We'll carry on by text.</p>
  </main>
</body>
</html>`;
}
