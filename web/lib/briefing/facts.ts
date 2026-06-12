import { NormalizedEvent, Trip } from "./types";
import { clockTime, dayKey, daysBetween, monthDay, weekdayName } from "./time";

// The computed-facts header — the experiment-validated fix for derivation
// errors ("you leave Sunday"). Code computes; Stanley narrates. He is told
// to trust these lines over his own arithmetic.

const FLIGHT_RE = /flight|✈|airline|\b[A-Z]{2}\s?\d{2,4}\b/;

export function computeFacts(
  events: NormalizedEvent[],
  trips: Trip[],
  now: Date,
): string[] {
  const today = dayKey(now);
  const facts: string[] = [];

  // Today's shape
  const todayTimed = events.filter(
    (e) => !e.allDay && !e.isTransit && dayKey(new Date(e.start)) === today,
  );
  const todayReminders = events.filter(
    (e) => e.allDay && e.start === today && daysBetween(e.start, e.end) <= 1,
  );
  if (todayTimed.length === 0) {
    facts.push("Today has no timed events.");
  } else {
    const first = todayTimed[0];
    const last = todayTimed[todayTimed.length - 1];
    facts.push(
      `Today has ${todayTimed.length} timed event${todayTimed.length === 1 ? "" : "s"}: first at ${clockTime(first.start)}, last ends ${clockTime(last.end)}.`,
    );
  }
  for (const r of todayReminders) {
    facts.push(`Due today: ${r.title}.`);
  }

  // Trips: active or upcoming
  for (const trip of trips) {
    if (trip.startDate <= today && today <= trip.endDate) {
      const dayN = daysBetween(trip.startDate, today) + 1;
      const total = daysBetween(trip.startDate, trip.endDate) + 1;
      facts.push(
        `Currently on trip: ${trip.title} (day ${dayN} of ${total}; returns ${weekdayName(trip.endDate)} ${monthDay(trip.endDate)}).`,
      );
    } else if (trip.startDate > today) {
      const inDays = daysBetween(today, trip.startDate);
      const flight = events.find(
        (e) =>
          !e.allDay &&
          dayKey(new Date(e.start)) === trip.startDate &&
          FLIGHT_RE.test(e.title),
      );
      if (flight) {
        facts.push(
          `Upcoming trip: ${trip.title} — departs in ${inDays} day${inDays === 1 ? "" : "s"} (${weekdayName(trip.startDate)} ${monthDay(trip.startDate)}); departure: ${flight.title}, ${clockTime(flight.start)}.`,
        );
      } else {
        // multi-day all-day events without a flight are spans, not travel
        facts.push(
          `Multi-day span: ${trip.title} (${monthDay(trip.startDate)} – ${monthDay(trip.endDate)}).`,
        );
      }
    }
  }

  return facts;
}
