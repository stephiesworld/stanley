import { GoogleEvent } from "./briefing/types";

// Stephie's June 2026 calendar as Google-API-shaped events — the same data
// the harness validated against, INCLUDING past events (June 10–11) so the
// today-forward windowing demonstrably drops them.
// Offsets: America/New_York is -04:00 in June.
const T = (day: string, time: string) => `${day}T${time}:00-04:00`;

function timed(day: string, start: string, end: string, summary: string, location?: string): GoogleEvent {
  return { id: `${day}-${start}-${summary}`, summary, location, start: { dateTime: T(day, start) }, end: { dateTime: T(day, end) } };
}
function allDay(startDay: string, endDayExclusive: string, summary: string): GoogleEvent {
  return { id: `${startDay}-${summary}`, summary, start: { date: startDay }, end: { date: endDayExclusive } };
}

export const MOCK_EVENTS: GoogleEvent[] = [
  // — past (must be windowed out) —
  timed("2026-06-10", "17:00", "18:00", "Tennis match", "Riverside Park Tennis Courts"),
  timed("2026-06-11", "14:30", "17:00", "Write Mack's MOH speech"),

  // — Friday June 12 —
  timed("2026-06-12", "11:00", "12:30", "EMDR"),
  timed("2026-06-12", "13:00", "14:00", "Run to eyebrow appt"),
  timed("2026-06-12", "14:00", "15:00", "Eyebrow appt"),
  timed("2026-06-12", "15:00", "16:00", "Perrotin visit"),
  timed("2026-06-12", "16:00", "17:00", "Transit back"),
  timed("2026-06-12", "21:00", "23:00", "World Cup viewing"),

  // — Saturday June 13 —
  allDay("2026-06-13", "2026-06-14", "Gemini card payment due"),
  timed("2026-06-13", "10:45", "15:45", "Steffeity hang"),
  timed("2026-06-13", "17:00", "19:00", "Superbueno"),
  timed("2026-06-13", "19:00", "21:00", "Markette", "326 7th Ave"),
  timed("2026-06-13", "20:30", "23:00", "NBA Finals Game 5 watch party"),

  // — Sunday June 14 —
  timed("2026-06-14", "17:00", "18:00", "Travel"),
  timed("2026-06-14", "18:00", "19:00", "Tennis match", "McCarren Park"),
  timed("2026-06-14", "19:00", "20:00", "Travel"),
  timed("2026-06-14", "21:00", "23:00", "Pack for France"),

  // — Monday June 15 + France —
  timed("2026-06-15", "16:20", "17:35", "Barry's", "Barry's Williamsburg"),
  timed("2026-06-15", "18:30", "20:30", "In Conversation: Firelei Báez, Jeffrey Gibson & Candice Hopkins", "The Great Hall at Cooper Union"),
  timed("2026-06-15", "21:00", "22:00", "Delta Sky Club", "JFK"),
  timed("2026-06-15", "22:30", "23:59", "Flight to Paris, DL 264", "JFK"),
  allDay("2026-06-15", "2026-06-25", "FRANCE"),
  timed("2026-06-16", "15:30", "17:00", "Burning Bar — Hot Pilates (21:30 Paris time)", "Paris"),

  // — reminders & the wedding stretch —
  allDay("2026-06-18", "2026-06-19", "Bilt payment due"),
  allDay("2026-06-18", "2026-06-19", "Capital One payment due"),
  allDay("2026-06-22", "2026-06-23", "Amex Prime card payment due"),
  allDay("2026-06-23", "2026-06-27", "Prime Day"),
  allDay("2026-06-24", "2026-06-25", "Return from France"),
  timed("2026-06-25", "13:00", "16:00", "Pickleball and pool", "480 Kent Ave"),
  timed("2026-06-26", "13:00", "15:00", "Head to NJ"),
  timed("2026-06-26", "15:00", "16:00", "Check into hotel", "SpringHill Suites, Somerset/Franklin Township"),
  timed("2026-06-26", "18:30", "23:00", "[Mackenzie & Allen] Rehearsal Dinner", "Maggiano's Little Italy"),
  allDay("2026-06-27", "2026-06-28", "MACKENZIE'S WEDDING!!!!!!"),
];
