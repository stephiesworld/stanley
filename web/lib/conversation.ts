import fs from "node:fs";
import path from "node:path";
import { normalizeAll, extractTrips } from "./briefing/normalize";
import { windowEvents } from "./briefing/window";
import { assembleContext } from "./briefing/assemble";
import { addDays, dayKey, weekdayName, PRINCIPAL_TZ } from "./briefing/time";
import { NormalizedEvent } from "./briefing/types";
import { askStanley } from "./stanley";
import { extractProposal } from "./proposal";
import { CalendarSource } from "./calendar-source";
import {
  Store,
  User,
  Channel,
  PendingProposal,
  ProposalAction,
  Message,
} from "./store/types";
import { handleHash, randomToken } from "./crypto";

const WINDOW_DAYS = 14;
const HISTORY_TURNS = 6;
const PROPOSAL_TTL_MIN = 30;

// ── small helpers ────────────────────────────────────────────────────────────

const AFFIRMATIVE = /^(y|yes|yeah|yep|yup|sure|ok|okay|do it|go|please do|approve(d)?|confirm(ed)?)\b/i;
const NEGATIVE = /^(n|no|nope|nah|not quite|cancel|don'?t|stop that|leave it|never mind)\b/i;
const YES_EMOJI = /^(👍|✅|🙏|👌)/u;
const UNDO = /^(undo|put it back|revert|reverse that|take that back)\b/i;

export function isAffirmative(text: string): boolean {
  const t = text.trim();
  return AFFIRMATIVE.test(t) || YES_EMOJI.test(t);
}
export function isNegative(text: string): boolean {
  return NEGATIVE.test(text.trim());
}
export function isUndo(text: string): boolean {
  return UNDO.test(text.trim());
}

function loadProfile(): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), "prompts", "profile.md"), "utf8");
  } catch {
    return "PROFILE — (none on file yet)";
  }
}

// "10pm" / "9:30am" — Stanley's register, not the engine's 24h clock.
function friendlyTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PRINCIPAL_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const ampm = get("dayPeriod").toLowerCase().replace(/[.\s]/g, "");
  const min = get("minute");
  return min === "00" ? `${get("hour")}${ampm}` : `${get("hour")}:${min}${ampm}`;
}

// Deterministic confirmation line — built from the action, not from model echo,
// so what we confirm is exactly what we will write.
export function summarize(action: ProposalAction, byId: Map<string, NormalizedEvent>): string {
  const when = (iso?: string) =>
    iso ? `${weekdayName(dayKey(new Date(iso)))} ${friendlyTime(iso)}` : "";
  if (action.type === "move") {
    const title = byId.get(action.event_id ?? "")?.title ?? "that";
    return `moved ${title} to ${when(action.new_start)}`;
  }
  if (action.type === "create") {
    return `added ${action.title ?? "the event"} ${when(action.new_start)}`;
  }
  if (action.type === "delete") {
    const title = byId.get(action.event_id ?? "")?.title ?? "that";
    return `cleared ${title}`;
  }
  return "done";
}

// The same action phrased as a proposal (for a card awaiting approval),
// in the ledger's arrow idiom: "Dentist → Friday 9am."
export function summarizeProposal(action: ProposalAction, byId: Map<string, NormalizedEvent>): string {
  const when = (iso?: string) =>
    iso ? `${weekdayName(dayKey(new Date(iso)))} ${friendlyTime(iso)}` : "";
  if (action.type === "move") {
    const title = byId.get(action.event_id ?? "")?.title ?? "That";
    return `${title} → ${when(action.new_start)}.`;
  }
  if (action.type === "create") {
    return `Hold ${when(action.new_start)} — “${action.title ?? "as discussed"}.”`;
  }
  if (action.type === "delete") {
    const title = byId.get(action.event_id ?? "")?.title ?? "that";
    return `Clear ${title}.`;
  }
  return "As discussed.";
}

interface TurnContext {
  events: NormalizedEvent[];
  byId: Map<string, NormalizedEvent>;
  context: string;
}

// Pure: turn raw calendar events into the windowed, structured, fact-headed
// context string the soul was tuned against. Shared by the SMS turn and /demo.
export function prepareContext(
  raw: { id?: string | null }[] | unknown[],
  userMessage: string,
  now: Date,
  profileOverride?: string,
): TurnContext {
  const events = windowEvents(normalizeAll(raw as never[]), now, WINDOW_DAYS);
  const trips = extractTrips(events);
  const profile = profileOverride ?? loadProfile();
  const context = assembleContext({ now, events, trips, profile, userMessage });
  const byId = new Map(events.map((e) => [e.id, e]));
  return { events, byId, context };
}

async function buildContext(
  calendar: CalendarSource,
  userMessage: string,
  now: Date,
): Promise<TurnContext> {
  const today = dayKey(now);
  const raw = await calendar.list(
    `${today}T00:00:00-04:00`,
    `${addDays(today, WINDOW_DAYS)}T00:00:00-04:00`,
  );
  return prepareContext(raw, userMessage, now);
}

async function history(store: Store, userId: string) {
  const msgs = await store.recentMessages(userId, HISTORY_TURNS);
  return msgs.map((m) => ({
    role: (m.direction === "in" ? "user" : "assistant") as "user" | "assistant",
    content: m.body,
  }));
}

let counter = 0;
function id(prefix: string): string {
  // monotonic-ish without Date.now in the hot path of tests; fine for storage keys
  counter += 1;
  return `${prefix}_${new Date().toISOString()}_${counter}`;
}

// ── the shared brain: one conversational turn ────────────────────────────────

export interface TurnResult {
  reply: string;
  proposal: PendingProposal | null;
  wrote: boolean;
}

export async function runTurn(opts: {
  store: Store;
  user: User;
  text: string;
  calendar: CalendarSource;
  now: Date;
}): Promise<TurnResult> {
  const { store, user, text, calendar, now } = opts;

  await store.appendMessage(msg(user.id, "in", text));
  await store.appendEpisode({ id: id("ep"), user_id: user.id, text, created_at: now.toISOString() });

  const { events, byId, context } = await buildContext(calendar, text, now);
  const hist = await history(store, user.id);
  // history already includes the inbound we just logged; drop its last entry so
  // the fresh, calendar-grounded context is the final user turn instead.
  hist.pop();

  const reply = await askStanley(context, hist);
  await store.appendMessage(msg(user.id, "out", reply));

  // Did Stanley propose a concrete change? If so, arm the write gate. The
  // extractor sees the conversation (not just Stanley's last line) so it can
  // resolve "it"/"that" to the right event — and refuses to arm if unsure.
  let proposal: PendingProposal | null = null;
  const action = await extractProposal({
    userMessage: text,
    stanleyReply: reply,
    history: hist,
    candidateEvents: events,
    now,
  });
  if (action) {
    proposal = {
      id: id("prop"),
      user_id: user.id,
      action,
      human_summary: summarize(action, byId),
      created_at: now.toISOString(),
      expires_at: new Date(now.getTime() + PROPOSAL_TTL_MIN * 60_000).toISOString(),
    };
    await store.putProposal(proposal);
  } else {
    // a turn with no live proposal supersedes any stale one
    await store.clearProposals(user.id);
  }

  return { reply, proposal, wrote: false };
}

// ── the write: only reached after an affirmative reply to a live proposal ─────

export async function confirmPending(opts: {
  store: Store;
  user: User;
  calendar: CalendarSource;
}): Promise<TurnResult | null> {
  const { store, user, calendar } = opts;
  const pending = await store.latestPendingProposal(user.id);
  if (!pending) return null;

  const inverse = await calendar.apply(pending.action); // the one and only write site
  await store.clearProposals(user.id);
  // remember how to reverse it, for "undo"
  await store.setLastChange(user.id, inverse ? { action: inverse, summary: pending.human_summary } : null);

  const reply = `Done — ${pending.human_summary}.`;
  await store.appendMessage(msg(user.id, "out", reply));
  return { reply, proposal: null, wrote: true };
}

function msg(userId: string, direction: "in" | "out", body: string): Message {
  return { id: id("msg"), user_id: userId, direction, body, created_at: new Date().toISOString() };
}

// ── Channel-neutral entry point: command routing + onboarding + turn/confirm ──
// Works for Telegram (/start, /stop, /help) and SMS (STANLEY, STOP, HELP, START).

export interface InboundResult {
  reply: string;
  // when set, the route should NOT also run a normal turn (already handled)
  handled: boolean;
}

const IS_STOP = /^(stop|unsubscribe|cancel|quit|\/stop)\b/i;
const IS_HELP = /^(help|info|\/help)\b/i;
const IS_RESUME = /^(start|unstop|\/start)\b/i; // /start may carry a payload
const IS_ONBOARD = /^(stanley|\/start)\b/i; // explicit "begin" triggers

export async function routeInbound(opts: {
  store: Store;
  channel: Channel;
  chatId: string;
  text: string;
  baseUrl: string;
  now: Date;
}): Promise<InboundResult> {
  const { store, channel, chatId, text, baseUrl, now } = opts;
  const trimmed = text.trim();

  if (IS_STOP.test(trimmed)) {
    const u = await store.getUserByChatId(chatId);
    if (u) await store.setUserStatus(u.id, "stopped");
    return { reply: "Understood — I'll go quiet. Message me again any time to resume.", handled: true };
  }
  if (IS_HELP.test(trimmed)) {
    return {
      reply:
        "Stanley — your calendar butler. I watch the shape of your week and propose changes; I never move anything without your yes. Send STOP to pause me.",
      handled: true,
    };
  }

  let user = await store.getUserByChatId(chatId);

  if (IS_RESUME.test(trimmed) && user && user.status === "stopped") {
    await store.setUserStatus(user.id, "active");
    return { reply: "Good to have you back. I'll resume.", handled: true };
  }

  // Onboarding: a brand-new chat, or an explicit "begin" (STANLEY / /start).
  if (!user || IS_ONBOARD.test(trimmed)) {
    if (!user) {
      user = await store.upsertUser({
        id: handleHash(channel, chatId),
        channel,
        chat_id: chatId,
        timezone: PRINCIPAL_TZ,
        status: "pending",
        created_at: now.toISOString(),
      });
    }
    const tokens = await store.getTokens(user.id);
    if (!tokens) {
      const handoff = randomToken();
      await store.putOAuthHandoff(handoff, user.id);
      const link = `${baseUrl}/api/oauth/google/start?token=${handoff}`;
      return {
        reply:
          `Stanley here. I'll need to see your calendar to be of any use — connect it once and we're set:\n${link}\n\nRead and write to events only; I never move anything without asking first.`,
        handled: true,
      };
    }
    // already connected — fall through to a normal turn
  }

  // "undo" reverses the last executed write — works regardless of any pending.
  if (isUndo(trimmed)) {
    const last = await store.getLastChange(user!.id);
    if (!last) return { reply: "Nothing to undo just now.", handled: true };
    const calendar = (await import("./calendar-source")).googleCalendarSource(store, user!.id);
    await calendar.apply(last.action);
    await store.setLastChange(user!.id, null);
    return { reply: "Put it back, as it was.", handled: true };
  }

  // A pending proposal + an affirmative = execute the write.
  const pending = await store.latestPendingProposal(user!.id);
  if (pending && isAffirmative(trimmed)) {
    const calendar = (await import("./calendar-source")).googleCalendarSource(store, user!.id);
    const result = await confirmPending({ store, user: user!, calendar });
    if (result) return { reply: result.reply, handled: true };
  }
  if (pending && isNegative(trimmed)) {
    await store.clearProposals(user!.id);
    return { reply: "Left as is.", handled: true };
  }

  // Otherwise: a normal conversational turn against the live calendar.
  const calendar = (await import("./calendar-source")).googleCalendarSource(store, user!.id);
  if (user!.status === "pending") await store.setUserStatus(user!.id, "active");
  const result = await runTurn({ store, user: user!, text: trimmed, calendar, now });
  return { reply: result.reply, handled: true };
}
