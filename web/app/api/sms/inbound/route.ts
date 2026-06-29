import { NextRequest, NextResponse } from "next/server";
import { verifyTwilioSignature, sendSms, clampSms } from "@/lib/twilio";
import { routeInbound } from "@/lib/conversation";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

// Twilio inbound SMS webhook — the OPTIONAL alternate channel. Telegram is the
// default live channel (free, no A2P); SMS is here for when you want a real
// phone number. Every request is signature-verified before we act on it.
// Reply is sent via the REST API; we return empty TwiML so Twilio stays silent.
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
function twiml() {
  return new NextResponse(EMPTY_TWIML, { headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const params = Object.fromEntries(new URLSearchParams(raw)) as Record<string, string>;

  // The URL Twilio signed is the public webhook URL it was configured with.
  const base = process.env.APP_BASE_URL ?? new URL(req.url).origin;
  const url = `${base}/api/sms/inbound`;
  const signature = req.headers.get("x-twilio-signature");

  if (!verifyTwilioSignature(url, params, signature)) {
    return new NextResponse("invalid signature", { status: 403 });
  }

  const from = params.From;
  const body = params.Body ?? "";
  if (!from) return twiml();

  try {
    const result = await routeInbound({
      store: getStore(),
      channel: "sms",
      chatId: from,
      text: body,
      baseUrl: base,
      now: new Date(),
    });
    await sendSms(from, clampSms(result.reply));
  } catch (e) {
    console.error("inbound handling failed:", (e as Error).message);
    // best-effort apology; never leak internals over SMS
    try {
      await sendSms(from, "Apologies — something went wrong on my end. Try me again in a moment.");
    } catch {
      /* nothing more we can do */
    }
  }
  return twiml();
}
