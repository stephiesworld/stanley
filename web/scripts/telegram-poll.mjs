// Local "live" runner — no public URL needed. Long-polls Telegram for new
// messages and forwards each to the running dev server's /api/telegram webhook,
// exactly as Telegram would in production. Lets you text your bot and move your
// real calendar from your laptop, with zero infrastructure.
//
//   Terminal 1:  npm run dev
//   Terminal 2:  npm run telegram:poll
//
// Reads TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, APP_BASE_URL from
// web/.env.local (APP_BASE_URL defaults to http://localhost:3000).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of readFileSync(path.join(here, "..", ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* fall back to process.env */
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const BASE = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
if (!TOKEN || !SECRET) {
  console.error("Missing TELEGRAM_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET in web/.env.local");
  process.exit(1);
}

const api = (method) => `https://api.telegram.org/bot${TOKEN}/${method}`;

// Polling and webhooks are mutually exclusive — clear any webhook first.
await fetch(api("deleteWebhook"), { method: "POST" }).catch(() => {});
console.log(`Stanley is listening on Telegram → forwarding to ${BASE}/api/telegram`);
console.log("Send your bot /start to begin. Ctrl-C to stop.\n");

let offset = 0;
for (;;) {
  try {
    const res = await fetch(api("getUpdates") + `?timeout=30&offset=${offset}&allowed_updates=["message"]`);
    const { result = [] } = await res.json();
    for (const update of result) {
      offset = update.update_id + 1;
      const text = update.message?.text;
      const from = update.message?.chat?.id;
      if (text) console.log(`  ← ${from}: ${text}`);
      const r = await fetch(`${BASE}/api/telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-telegram-bot-api-secret-token": SECRET },
        body: JSON.stringify(update),
      }).catch((e) => ({ ok: false, statusText: String(e) }));
      if (!r.ok) console.error(`  ! forward failed: ${r.status ?? ""} ${r.statusText ?? ""} — is "npm run dev" running?`);
    }
  } catch (e) {
    console.error("poll error:", e.message, "— retrying in 3s");
    await new Promise((r) => setTimeout(r, 3000));
  }
}
