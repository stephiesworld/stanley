import { google } from "googleapis";
import { GoogleEvent } from "./briefing/types";

// Read-only by design — propose-only is brand AND safety (Part 4 scope).
export const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

export function oauthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth not configured — see SETUP.md (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).");
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/auth/google/callback",
  );
}

export interface StoredTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
}

export async function listEvents(
  tokens: StoredTokens,
  timeMinISO: string,
  timeMaxISO: string,
): Promise<GoogleEvent[]> {
  const auth = oauthClient();
  auth.setCredentials(tokens);
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMinISO,
    timeMax: timeMaxISO,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });
  return (res.data.items ?? []) as GoogleEvent[];
}
