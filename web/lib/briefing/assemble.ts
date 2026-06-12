import { NormalizedEvent, Trip } from "./types";
import { clockTime, dayKey, daysBetween, formatDateLine, weekdayName } from "./time";
import { computeFacts } from "./facts";

// Renders windowed events in the structured per-day format that tested
// clean in the harness experiments (calendar_structured.md).
export function renderEvents(events: NormalizedEvent[], now: Date): string {
  const byDay = new Map<string, NormalizedEvent[]>();
  const spans: NormalizedEvent[] = [];

  for (const e of events) {
    if (e.allDay && daysBetween(e.start, e.end) > 1) {
      spans.push(e);
      continue;
    }
    const day = e.allDay ? e.start : dayKey(new Date(e.start));
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(e);
  }

  const lines: string[] = [];
  for (const span of spans) {
    lines.push(`${span.start} → ${span.end} (end exclusive)  [trip] ${span.title}`);
  }
  if (spans.length) lines.push("");

  for (const day of [...byDay.keys()].sort()) {
    lines.push(`${day} (${weekdayName(day)}):`);
    const evs = byDay
      .get(day)!
      .sort((a, b) => (a.allDay === b.allDay ? a.start.localeCompare(b.start) : a.allDay ? -1 : 1));
    for (const e of evs) {
      const where = e.location ? ` (${e.location})` : "";
      if (e.allDay) {
        lines.push(`  all-day      [reminder] ${e.title}${where}`);
      } else {
        const tag = e.isTransit ? "[transit] " : "";
        lines.push(`  ${clockTime(e.start)}–${clockTime(e.end)}  ${tag}${e.title}${where}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

// The full first-message context: grounding date + computed facts +
// profile + structured today-forward calendar + the user's message.
export function assembleContext(opts: {
  now: Date;
  events: NormalizedEvent[]; // already windowed
  trips: Trip[];
  profile: string;
  userMessage: string;
}): string {
  const { now, events, trips, profile, userMessage } = opts;
  const facts = computeFacts(events, trips, now);

  return [
    `Current date: ${formatDateLine(now)}`,
    "",
    "COMPUTED FACTS (derived deterministically by the calendar system — trust these over your own date arithmetic):",
    ...facts.map((f) => `- ${f}`),
    "",
    profile.trim(),
    "",
    `CALENDAR (today forward only; past events are not shown; structured export, times in America/New_York; [transit] = travel between events, not an event itself):`,
    "",
    renderEvents(events, now),
    "",
    userMessage,
  ].join("\n");
}
