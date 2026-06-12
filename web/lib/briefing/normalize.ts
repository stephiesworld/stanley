import { GoogleEvent, NormalizedEvent, Trip } from "./types";
import { addDays, daysBetween } from "./time";

// Transit = the title IS movement to/from somewhere, not an activity.
// "Run to eyebrow appt" → transit. "Run and wax brows" → NOT transit.
// "Travel" / "Transit back" / "Head to NJ" → transit.
const TRANSIT_RE =
  /^(?:(?:walk|run|head|drive|bike|commute)(?:ing)?\s+(?:to|back|home|over)\b|travel\b|transit\b)/i;

export function isTransitTitle(title: string): boolean {
  return TRANSIT_RE.test(title.trim());
}

export function normalizeEvent(e: GoogleEvent): NormalizedEvent | null {
  if (e.status === "cancelled") return null;
  const title = (e.summary ?? "").trim() || "(untitled)";
  const allDay = Boolean(e.start?.date);
  const start = e.start?.dateTime ?? e.start?.date;
  const end = e.end?.dateTime ?? e.end?.date ?? start;
  if (!start) return null;
  return {
    id: e.id ?? `${title}-${start}`,
    title,
    start,
    end: end!,
    allDay,
    isTransit: !allDay && isTransitTitle(title),
    location: e.location ?? undefined,
  };
}

export function normalizeAll(events: GoogleEvent[]): NormalizedEvent[] {
  return events.map(normalizeEvent).filter((e): e is NormalizedEvent => e !== null);
}

/** Multi-day all-day events are trips/spans (France, Prime Day, hotel stays). */
export function extractTrips(events: NormalizedEvent[]): Trip[] {
  return events
    .filter((e) => e.allDay && daysBetween(e.start, e.end) > 1)
    .map((e) => ({
      title: e.title,
      startDate: e.start,
      endDate: addDays(e.end, -1), // Google all-day end is exclusive
    }));
}
