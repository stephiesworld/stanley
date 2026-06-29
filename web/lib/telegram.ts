// Telegram Bot API — the live channel. Free, no per-message cost, no carrier
// registration, and the bot can message first once the user has /start-ed it.
// Just two HTTP calls and a header check; no SDK needed.

const API = "https://api.telegram.org";

function token(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN not set — see SETUP.md.");
  return t;
}

// Telegram sends back the secret we set via setWebhook, so we can verify the
// request actually came from Telegram (the equivalent of a signed webhook).
export function verifyTelegramSecret(headerSecret: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return false; // refuse if we can't verify
  return headerSecret === expected;
}

export async function sendTelegram(chatId: string, text: string): Promise<void> {
  const res = await fetch(`${API}/bot${token()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Telegram send failed (${res.status}): ${detail.slice(0, 300)}`);
  }
}

// Telegram caps messages at 4096 chars; Stanley stays well under, but guard.
export function clampTelegram(text: string, max = 4000): string {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}

// The shape we consume from an inbound update (only text messages).
export interface TelegramUpdate {
  message?: { text?: string; chat?: { id?: number } };
}

// One-time setup: point Telegram at our webhook with the shared secret.
// Call from `npm run telegram:setup` (scripts/setup-telegram.mjs).
export async function setWebhook(url: string, secret: string): Promise<unknown> {
  const res = await fetch(`${API}/bot${token()}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, secret_token: secret, allowed_updates: ["message"] }),
  });
  return res.json();
}
