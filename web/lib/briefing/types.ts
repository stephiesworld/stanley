// A calendar event after normalization — the only shape the rest of the
// engine ever sees. Mirrors the structured format that tested clean in the
// harness experiments (transit tagged, explicit start/end, all-day flagged).
export interface NormalizedEvent {
  id: string;
  title: string;
  /** ISO datetime for timed events, YYYY-MM-DD for all-day */
  start: string;
  /** ISO datetime for timed events; for all-day, exclusive end date YYYY-MM-DD */
  end: string;
  allDay: boolean;
  /** travel between events, not an event itself — "Run to eyebrow appt" */
  isTransit: boolean;
  location?: string;
}

export interface Trip {
  title: string;
  /** YYYY-MM-DD inclusive */
  startDate: string;
  /** YYYY-MM-DD inclusive (Google all-day ends are exclusive; we convert) */
  endDate: string;
}

// Minimal slice of a Google Calendar API event we consume.
export interface GoogleEvent {
  id?: string | null;
  summary?: string | null;
  location?: string | null;
  start?: { date?: string | null; dateTime?: string | null } | null;
  end?: { date?: string | null; dateTime?: string | null } | null;
  status?: string | null;
}
