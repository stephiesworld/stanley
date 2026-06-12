import { NormalizedEvent } from "./types";
import { addDays, dayKey } from "./time";

// Today-forward windowing — the experiment-validated fix for past-event
// confusion. Stanley never sees an event that has already happened; he
// cannot misplace what isn't in context.
export function windowEvents(
  events: NormalizedEvent[],
  now: Date,
  daysAhead: number,
): NormalizedEvent[] {
  const today = dayKey(now);
  const horizon = addDays(today, daysAhead); // exclusive
  return events.filter((e) => {
    const startDay = e.allDay ? e.start : dayKey(new Date(e.start));
    // all-day spans: end is exclusive; include if the span reaches today
    const endDay = e.allDay ? addDays(e.end, -1) : dayKey(new Date(e.end));
    return endDay >= today && startDay < horizon;
  });
}
