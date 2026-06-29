import { google, calendar_v3 } from "googleapis";
import { GoogleEvent } from "./briefing/types";
import { Store, GoogleTokens } from "./store/types";

// Two scope sets, deliberately:
//  - SCOPES (read-only) backs the legacy web dev console (/api/auth/google).
//  - CALENDAR_SCOPES (read + WRITE on events) backs the SMS product, because
//    the write gate needs write. `calendar.events` is narrower than full
//    `calendar`: Stanley can touch events, not delete calendars or change
//    sharing. Writes still happen ONLY in server code after a confirmed "yes"
//    (lib/conversation.ts) — never inside a model turn.
export const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
export const CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function redirectUri(): string {
  return (
    process.env.GOOGLE_OAUTH_REDIRECT_URI ??
    process.env.GOOGLE_REDIRECT_URI ??
    "http://localhost:3000/api/oauth/google/callback"
  );
}

export function oauthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "Google OAuth not configured — set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (see .env.example).",
    );
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri());
}

export type StoredTokens = GoogleTokens;

// ── Legacy web console: read events with a cookie-stored token blob ──
export async function listEvents(
  tokens: StoredTokens,
  timeMinISO: string,
  timeMaxISO: string,
): Promise<GoogleEvent[]> {
  const auth = oauthClient();
  auth.setCredentials({ ...tokens, scope: tokens.scope ?? undefined });
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

// ── SMS product: per-user authed client with token refresh persisted back ──
async function calendarForUser(store: Store, userId: string): Promise<calendar_v3.Calendar> {
  const tokens = await store.getTokens(userId);
  if (!tokens) throw new Error(`No Google tokens for user ${userId}`);
  const auth = oauthClient();
  auth.setCredentials({ ...tokens, scope: tokens.scope ?? undefined });
  auth.on("tokens", (fresh) => {
    // refresh_token only comes back on first consent; preserve it across refreshes
    void store.setTokens(userId, { ...tokens, ...fresh });
  });
  return google.calendar({ version: "v3", auth });
}

export async function listEventsForUser(
  store: Store,
  userId: string,
  timeMinISO: string,
  timeMaxISO: string,
): Promise<GoogleEvent[]> {
  const calendar = await calendarForUser(store, userId);
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

// ── Write path — called ONLY by the confirmation handler, never by the model ──
export async function moveEvent(
  store: Store,
  userId: string,
  eventId: string,
  newStartISO: string,
  newEndISO: string,
): Promise<void> {
  const calendar = await calendarForUser(store, userId);
  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody: { start: { dateTime: newStartISO }, end: { dateTime: newEndISO } },
  });
}

// Returns the new event id, so a create can be undone (by deleting it).
// If attendees are given, Google emails them an invite (sendUpdates: "all") —
// this only runs inside the confirmation gate, so the user has said yes first.
export async function createEvent(
  store: Store,
  userId: string,
  summary: string,
  startISO: string,
  endISO: string,
  location?: string,
  attendees?: string[],
): Promise<string | undefined> {
  const calendar = await calendarForUser(store, userId);
  const res = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: attendees && attendees.length ? "all" : "none",
    requestBody: {
      summary,
      location,
      start: { dateTime: startISO },
      end: { dateTime: endISO },
      attendees: attendees?.map((email) => ({ email })),
    },
  });
  return res.data.id ?? undefined;
}

export async function deleteEvent(store: Store, userId: string, eventId: string): Promise<void> {
  const calendar = await calendarForUser(store, userId);
  await calendar.events.delete({ calendarId: "primary", eventId });
}

// Current state of one event — used to capture what a change is about to
// overwrite, so it can be reversed by "undo".
export async function getEventTimes(
  store: Store,
  userId: string,
  eventId: string,
): Promise<{ start?: string; end?: string; summary?: string; location?: string } | null> {
  const calendar = await calendarForUser(store, userId);
  try {
    const res = await calendar.events.get({ calendarId: "primary", eventId });
    const e = res.data;
    return {
      start: e.start?.dateTime ?? e.start?.date ?? undefined,
      end: e.end?.dateTime ?? e.end?.date ?? undefined,
      summary: e.summary ?? undefined,
      location: e.location ?? undefined,
    };
  } catch {
    return null;
  }
}
