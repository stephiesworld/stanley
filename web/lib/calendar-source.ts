import { GoogleEvent } from "./briefing/types";
import { Store, ProposalAction } from "./store/types";
import {
  listEventsForUser,
  moveEvent,
  createEvent,
  deleteEvent,
  getEventTimes,
} from "./google";

// The conversation brain reads and (after a confirmed yes) writes through this
// interface, so it doesn't care whether it's talking to a real Google calendar
// or the demo's in-memory mock. Both honor the same propose→confirm→write gate.
//
// apply() returns the INVERSE of what it just did (or null if not reversible),
// so the caller can store it and offer "undo".
export interface CalendarSource {
  list(timeMinISO: string, timeMaxISO: string): Promise<GoogleEvent[]>;
  apply(action: ProposalAction): Promise<ProposalAction | null>;
}

// Real Google Calendar for an onboarded SMS/Telegram user.
export function googleCalendarSource(store: Store, userId: string): CalendarSource {
  return {
    list: (min, max) => listEventsForUser(store, userId, min, max),
    apply: async (a) => {
      if (a.type === "move") {
        const old = await getEventTimes(store, userId, a.event_id!);
        await moveEvent(store, userId, a.event_id!, a.new_start!, a.new_end!);
        return old?.start && old?.end
          ? { type: "move", event_id: a.event_id, new_start: old.start, new_end: old.end }
          : null;
      }
      if (a.type === "create") {
        const id = await createEvent(store, userId, a.title ?? "(untitled)", a.new_start!, a.new_end!, a.location);
        return id ? { type: "delete", event_id: id } : null;
      }
      if (a.type === "delete") {
        const old = await getEventTimes(store, userId, a.event_id!);
        await deleteEvent(store, userId, a.event_id!);
        return old?.start && old?.end
          ? { type: "create", title: old.summary, new_start: old.start, new_end: old.end, location: old.location }
          : null;
      }
      return null;
    },
  };
}

// In-memory mock used by /demo. Persistence is supplied by the caller (the demo
// route keeps the events per browser session).
export function mockCalendarSource(
  get: () => GoogleEvent[],
  set: (events: GoogleEvent[]) => void,
): CalendarSource {
  const startOf = (e: GoogleEvent) => e.start?.dateTime ?? e.start?.date ?? undefined;
  const endOf = (e: GoogleEvent) => e.end?.dateTime ?? e.end?.date ?? undefined;
  return {
    list: async (minISO, maxISO) => {
      const min = new Date(minISO).getTime();
      const max = new Date(maxISO).getTime();
      return get().filter((e) => {
        const s = startOf(e);
        if (!s) return false;
        const t = new Date(s).getTime();
        return t >= min && t < max;
      });
    },
    apply: async (a) => {
      const events = get();
      if (a.type === "move" && a.event_id) {
        const e = events.find((x) => x.id === a.event_id);
        if (!e) return null;
        const old = { start: startOf(e), end: endOf(e) };
        e.start = { dateTime: a.new_start! };
        e.end = { dateTime: a.new_end! };
        set(events);
        return old.start && old.end
          ? { type: "move", event_id: a.event_id, new_start: old.start, new_end: old.end }
          : null;
      }
      if (a.type === "create") {
        const id = `mock-${a.new_start}-${a.title}`;
        events.push({
          id,
          summary: a.title ?? "(untitled)",
          location: a.location,
          start: { dateTime: a.new_start! },
          end: { dateTime: a.new_end! },
        });
        set(events);
        return { type: "delete", event_id: id };
      }
      if (a.type === "delete" && a.event_id) {
        const i = events.findIndex((x) => x.id === a.event_id);
        if (i < 0) return null;
        const e = events[i];
        const snap = { title: e.summary ?? undefined, start: startOf(e), end: endOf(e), location: e.location ?? undefined };
        events.splice(i, 1);
        set(events);
        return snap.start && snap.end
          ? { type: "create", title: snap.title, new_start: snap.start, new_end: snap.end, location: snap.location }
          : null;
      }
      return null;
    },
  };
}
