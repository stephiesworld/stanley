import { GoogleEvent } from "./briefing/types";

// A relatable sample week for the /demo — a normal working person's calendar
// (not anyone's private life). Designed to show off what Stanley does: a
// back-to-back conflict, a trip with travel + recovery, all-day reminders, an
// evening social, and a big anchor down the line. Simulated "today" is Friday
// June 12, 2026. Includes a couple of past events so today-forward windowing
// visibly drops them. Offsets: America/New_York is -04:00 in June.
const T = (day: string, time: string) => `${day}T${time}:00-04:00`;

function timed(day: string, start: string, end: string, summary: string, location?: string): GoogleEvent {
  return { id: `${day}-${start}-${summary}`, summary, location, start: { dateTime: T(day, start) }, end: { dateTime: T(day, end) } };
}
function allDay(startDay: string, endDayExclusive: string, summary: string): GoogleEvent {
  return { id: `${startDay}-${summary}`, summary, start: { date: startDay }, end: { date: endDayExclusive } };
}

export const MOCK_EVENTS: GoogleEvent[] = [
  // — past (must be windowed out) —
  timed("2026-06-10", "18:00", "19:00", "Run club"),
  timed("2026-06-11", "12:30", "13:30", "Lunch with Dana"),

  // — Friday June 12 (today) —
  timed("2026-06-12", "09:00", "09:30", "Team standup"),
  timed("2026-06-12", "11:00", "12:00", "Dentist cleaning"),
  timed("2026-06-12", "13:00", "14:00", "Lunch with Priya", "Cafe Mogador"),
  timed("2026-06-12", "15:00", "16:00", "Design review"),
  timed("2026-06-12", "16:00", "17:00", "1:1 with Sam"),
  timed("2026-06-12", "19:30", "22:00", "Dinner with friends", "Lilia"),

  // — Saturday June 13 —
  allDay("2026-06-13", "2026-06-14", "Mom's birthday"),
  timed("2026-06-13", "10:00", "11:00", "Yoga class"),
  timed("2026-06-13", "13:00", "15:00", "Apartment viewing"),
  timed("2026-06-13", "19:00", "22:00", "Alex's birthday dinner", "Carbone"),

  // — Sunday June 14 —
  timed("2026-06-14", "12:00", "13:30", "Brunch with Mom"),
  timed("2026-06-14", "20:00", "21:00", "Pack for Chicago"),

  // — Monday June 15 + work trip —
  timed("2026-06-15", "07:15", "08:00", "Drive to the airport"),
  timed("2026-06-15", "09:00", "11:00", "Flight to Chicago, UA 512", "LGA"),
  allDay("2026-06-15", "2026-06-19", "Chicago — work trip"),
  timed("2026-06-16", "18:30", "20:00", "Dinner with the Chicago team"),
  timed("2026-06-17", "10:00", "11:00", "Client presentation"),
  timed("2026-06-18", "16:00", "18:00", "Flight home, UA 877", "ORD"),

  // — reminders & the wedding weekend —
  allDay("2026-06-19", "2026-06-20", "Q3 plan due"),
  allDay("2026-06-22", "2026-06-25", "Cat-sitting for Dana"), // multi-day, no travel — a span, not a trip
  timed("2026-06-25", "18:00", "19:00", "Dinner with Grandma"),
  timed("2026-06-26", "16:00", "17:00", "Drive to the venue"),
  timed("2026-06-26", "18:30", "22:00", "Rehearsal dinner", "The Riverhouse"),
  allDay("2026-06-27", "2026-06-28", "Jordan & Alex's wedding!"),
];
