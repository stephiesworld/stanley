import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { normalizeAll, extractTrips } from "@/lib/briefing/normalize";
import { windowEvents } from "@/lib/briefing/window";
import { assembleContext } from "@/lib/briefing/assemble";
import { listEvents, StoredTokens } from "@/lib/google";
import { MOCK_EVENTS } from "@/lib/mock-calendar";
import { askStanley } from "@/lib/stanley";
import { addDays, dayKey } from "@/lib/briefing/time";

const WINDOW_DAYS = 14;

interface Turn {
  role: "user" | "assistant";
  content: string;
}

function loadProfile(): string {
  // v1: profile ships as a file; becomes the user-editable Layer 1 later.
  return fs.readFileSync(path.join(process.cwd(), "prompts", "profile.md"), "utf-8");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userMessage: string = body.message ?? "Morning briefing";
  // simulate any date in dev, same as the harness --date flag
  const now = body.date ? new Date(body.date) : new Date();
  // prior turns; history[0].content is the assembled context from turn one,
  // so the calendar/profile/date grounding is sent exactly once per thread
  const history: Turn[] = Array.isArray(body.history) ? body.history : [];

  // Follow-up turn: no reassembly, just continue the conversation.
  if (history.length > 0) {
    try {
      const briefing = await askStanley(userMessage, history);
      return NextResponse.json({ briefing, source: "(thread)", context: userMessage });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }

  let source = "mock";
  let raw = MOCK_EVENTS;
  const cookie = req.cookies.get("g_tokens")?.value;
  if (cookie) {
    try {
      const tokens: StoredTokens = JSON.parse(cookie);
      const today = dayKey(now);
      raw = await listEvents(
        tokens,
        `${today}T00:00:00-04:00`,
        `${addDays(today, WINDOW_DAYS)}T00:00:00-04:00`,
      );
      source = "google";
    } catch {
      source = "mock (google fetch failed)";
    }
  }

  const events = windowEvents(normalizeAll(raw), now, WINDOW_DAYS);
  const trips = extractTrips(events);
  const context = assembleContext({
    now,
    events,
    trips,
    profile: loadProfile(),
    userMessage,
  });

  try {
    const briefing = await askStanley(context);
    return NextResponse.json({ briefing, source, context });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, source, context },
      { status: 500 },
    );
  }
}
