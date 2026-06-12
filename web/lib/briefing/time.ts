// All date math happens in the principal's timezone, expressed as plain
// YYYY-MM-DD strings (lexicographically comparable). No date libraries.
export const PRINCIPAL_TZ = "America/New_York";

const DAY_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: PRINCIPAL_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD for an instant, in the principal's timezone */
export function dayKey(d: Date): string {
  return DAY_FMT.format(d);
}

/** Add n days to a YYYY-MM-DD string */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (both YYYY-MM-DD); positive if to is later */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** "Monday" for a YYYY-MM-DD */
export function weekdayName(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** "Friday, June 12, 2026, 8:00pm" — same format the harness validated */
export function formatDateLine(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PRINCIPAL_TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const ampm = get("dayPeriod").toLowerCase().replace(/\./g, "").replace(/\s/g, "");
  return `${get("weekday")}, ${get("month")} ${get("day")}, ${get("year")}, ${get("hour")}:${get("minute")}${ampm}`;
}

/** "16:20" for an ISO datetime, in the principal's timezone */
export function clockTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: PRINCIPAL_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** "June 15" for a YYYY-MM-DD */
export function monthDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
