// Registers the Telegram webhook so the bot delivers messages to this app.
// Run once after deploy (and again if APP_BASE_URL or the secret changes):
//   npm run telegram:setup
// Reads TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, APP_BASE_URL from
// web/.env.local (or the environment).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(here, "..", ".env.local");

// minimal .env.local loader (no dependency)
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* fall back to process.env */
}

const { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, APP_BASE_URL } = process.env;
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_WEBHOOK_SECRET || !APP_BASE_URL) {
  console.error("Missing TELEGRAM_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET / APP_BASE_URL in web/.env.local");
  process.exit(1);
}

const url = `${APP_BASE_URL.replace(/\/$/, "")}/api/telegram`;
const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url, secret_token: TELEGRAM_WEBHOOK_SECRET, allowed_updates: ["message"] }),
});
const json = await res.json();
console.log(json.ok ? `✓ Webhook set → ${url}` : `✗ Failed: ${JSON.stringify(json)}`);
process.exit(json.ok ? 0 : 1);
