import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramSecret, sendTelegram, clampTelegram, TelegramUpdate } from "@/lib/telegram";
import { routeInbound } from "@/lib/conversation";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

// Telegram inbound webhook. Telegram echoes our shared secret in a header, which
// we verify before acting — the equivalent of a signed webhook. Reply is sent
// via the Bot API; we return 200 so Telegram considers the update delivered.
export async function POST(req: NextRequest) {
  if (!verifyTelegramSecret(req.headers.get("x-telegram-bot-api-secret-token"))) {
    return new NextResponse("invalid secret", { status: 403 });
  }

  const update = (await req.json().catch(() => ({}))) as TelegramUpdate;
  const text = update.message?.text;
  const chatId = update.message?.chat?.id;
  if (!text || chatId == null) return NextResponse.json({ ok: true });

  const base = process.env.APP_BASE_URL ?? new URL(req.url).origin;
  try {
    const result = await routeInbound({
      store: getStore(),
      channel: "telegram",
      chatId: String(chatId),
      text,
      baseUrl: base,
      now: new Date(),
    });
    await sendTelegram(String(chatId), clampTelegram(result.reply));
  } catch (e) {
    console.error("telegram handling failed:", (e as Error).message);
    try {
      await sendTelegram(String(chatId), "Apologies — something went wrong on my end. Try me again in a moment.");
    } catch {
      /* nothing more we can do */
    }
  }
  return NextResponse.json({ ok: true });
}
