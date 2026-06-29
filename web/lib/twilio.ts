import crypto from "node:crypto";

// Twilio request validation + outbound SMS without the SDK — just the documented
// HMAC-SHA1 scheme and the Messages REST endpoint. Keeps the dependency surface
// small and the security logic auditable in one place.

// Validate X-Twilio-Signature: base64( HMAC-SHA1( url + sorted(k+v)..., authToken ) ).
// `url` must be the exact public URL Twilio hit (scheme+host+path+query).
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null,
  authToken = process.env.TWILIO_AUTH_TOKEN,
): boolean {
  if (!authToken) return false; // refuse to accept anything if we can't verify
  if (!signature) return false;
  const data =
    url +
    Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join("");
  const expected = crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf8")).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function sendSms(to: string, body: string): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    // In local/demo mode there are no Twilio creds — surface clearly rather than
    // pretending to send. The /demo path never calls this.
    throw new Error("Twilio not configured — set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER.");
  }
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: TWILIO_PHONE_NUMBER, To: to, Body: body }),
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Twilio send failed (${res.status}): ${detail.slice(0, 300)}`);
  }
}

// SMS has a soft 1600-char ceiling; keep Stanley terse anyway, but guard.
export function clampSms(text: string, max = 1500): string {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}
