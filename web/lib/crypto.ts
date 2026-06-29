import crypto from "node:crypto";

// AES-256-GCM at-rest encryption for Google OAuth tokens.
// Key comes from TOKEN_ENCRYPTION_KEY (32 bytes, base64 or hex). Stored form is
// `v1:<iv>:<authTag>:<ciphertext>`, all base64 — self-describing so we can
// rotate the scheme later without guessing.

const VERSION = "v1";

function key(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is not set — required to encrypt Google tokens at rest. " +
        'Generate one: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    );
  }
  // accept base64 or hex; must decode to exactly 32 bytes
  const buf = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must decode to 32 bytes (got ${buf.length}). Regenerate it.`,
    );
  }
  return buf;
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(":");
}

export function decrypt(payload: string): string {
  const [version, ivB64, tagB64, ctB64] = payload.split(":");
  if (version !== VERSION) throw new Error(`Unknown ciphertext version: ${version}`);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
}

// Stable, non-reversible id for a channel handle (Telegram chat id or E.164
// phone) — used as the user id and in log lines so we never put the raw handle
// in URLs or logs. Namespaced by channel so the same number on two channels
// maps to two distinct users.
export function handleHash(channel: string, handle: string): string {
  return crypto.createHash("sha256").update(`${channel}:${handle}`).digest("hex").slice(0, 16);
}

// Opaque, single-use-ish token for the SMS→browser OAuth handoff.
export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
