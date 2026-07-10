import { NextRequest, NextResponse } from "next/server";
import { GoogleEvent } from "@/lib/briefing/types";
import { ProposalAction, LastChange } from "@/lib/store/types";
import { prepareContext, summarize, summarizeProposal, isAffirmative, isNegative, isUndo } from "@/lib/conversation";
import { askStanley } from "@/lib/stanley";
import { extractProposal } from "@/lib/proposal";
import { mockCalendarSource } from "@/lib/calendar-source";
import { MOCK_EVENTS } from "@/lib/mock-calendar";

export const runtime = "nodejs";

// Stateless demo endpoint for /demo. The browser owns the calendar + history, so
// concurrent visitors never collide and nothing persists. It runs the SAME
// conversation brain and the SAME propose→confirm→write gate as SMS — the only
// difference is the calendar is the in-memory mock, not a real Google account.

// A neutral, nameless profile so demo visitors aren't addressed by anyone's
// real name (the live bot uses the principal's own profile instead).
const DEMO_PROFILE = `PROFILE — demo user

The user's name is not on file. Address them directly, without a first name.

Hard rules:
- No back-to-back meetings; at least 15 minutes between.
- Slow mornings: nothing before 10am unless unavoidable.

Strong preferences:
- One big social event per day, maximum; recovery time after big events.
- A recovery day after travel when possible.
- Protect focused work blocks during the day.`;

interface DemoBody {
  message: string;
  date?: string; // simulated "now"
  events?: GoogleEvent[]; // current mock calendar (omit on first turn)
  history?: { role: "user" | "assistant"; content: string }[];
  pending?: ProposalAction | null; // armed proposal awaiting Y/N
  lastChange?: LastChange | null; // inverse of the last write, for undo
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as DemoBody;
  const message = (body.message ?? "").trim();
  const now = body.date ? new Date(body.date) : new Date("2026-06-12T08:00:00-04:00");
  const events: GoogleEvent[] = body.events ?? structuredClone(MOCK_EVENTS);
  const history = Array.isArray(body.history) ? body.history : [];
  const pending = body.pending ?? null;
  const lastChange = body.lastChange ?? null;

  try {
    // "undo" reverses the last write on the mock calendar.
    if (isUndo(message)) {
      if (!lastChange) return NextResponse.json({ reply: "Nothing to undo just now.", events });
      const cal = mockCalendarSource(() => events, () => {});
      await cal.apply(lastChange.action);
      return NextResponse.json({ reply: "Put it back, as it was.", events, lastChange: null, pending: null });
    }

    // Armed proposal + an affirmative → execute the write on the mock calendar.
    if (pending && isAffirmative(message)) {
      const { byId } = prepareContext(events, message, now, DEMO_PROFILE);
      const summary = summarize(pending, byId);
      const cal = mockCalendarSource(() => events, () => {});
      const inverse = await cal.apply(pending);
      const reply = `Done — ${summary}.`;
      return NextResponse.json({ reply, events, pending: null, wrote: true, lastChange: inverse ? { action: inverse, summary } : null });
    }
    if (pending && isNegative(message)) {
      return NextResponse.json({ reply: "Left as is.", events, pending: null });
    }

    // Normal turn.
    const { events: windowed, byId, context } = prepareContext(events, message, now, DEMO_PROFILE);
    const reply = await askStanley(context, history);
    const action = await extractProposal({
      userMessage: message,
      stanleyReply: reply,
      history,
      candidateEvents: windowed,
      now,
    });
    return NextResponse.json({
      reply,
      events,
      pending: action ?? null,
      // Proposal-tense summary so the client can render an approval card
      // without re-deriving titles from event ids.
      pendingSummary: action ? summarizeProposal(action, byId) : null,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// First load: hand the browser the seed calendar so it can render it.
export async function GET() {
  return NextResponse.json({ events: MOCK_EVENTS });
}
