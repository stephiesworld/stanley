import { describe, it, expect } from "vitest";
import { isTransitTitle, normalizeAll, extractTrips } from "./normalize";
import { windowEvents } from "./window";
import { computeFacts } from "./facts";
import { assembleContext, renderEvents } from "./assemble";
import { MOCK_EVENTS } from "../mock-calendar";

// Friday June 12, 2026, 9:00am in New York (EDT = -04:00)
const NOW = new Date("2026-06-12T09:00:00-04:00");

describe("transit detection (the eyebrow-appointment class of error)", () => {
  it("tags movement-to-event titles as transit", () => {
    expect(isTransitTitle("Run to eyebrow appt")).toBe(true);
    expect(isTransitTitle("Walk to Barry's")).toBe(true);
    expect(isTransitTitle("Head to Greenpoint")).toBe(true);
    expect(isTransitTitle("Head to NJ")).toBe(true);
    expect(isTransitTitle("Travel")).toBe(true);
    expect(isTransitTitle("Transit back")).toBe(true);
  });
  it("does NOT tag activities that merely start with a movement verb", () => {
    expect(isTransitTitle("Run and wax brows")).toBe(false);
    expect(isTransitTitle("Tennis match")).toBe(false);
    expect(isTransitTitle("Walking tour of Paris")).toBe(false);
  });
});

describe("today-forward windowing (the past-event class of error)", () => {
  it("drops events before today — Stanley cannot misplace what he cannot see", () => {
    const events = windowEvents(normalizeAll(MOCK_EVENTS), NOW, 14);
    const titles = events.map((e) => e.title);
    expect(titles).not.toContain("Write Mack's MOH speech"); // June 11 — yesterday
    expect(titles.some((t) => t.includes("Riverside"))).toBe(false); // June 10
    expect(titles).toContain("EMDR"); // today stays
    expect(titles).toContain("Pickleball and pool"); // June 25 — day 13, in window
    expect(titles).not.toContain("MACKENZIE'S WEDDING!!!!!!"); // June 27 — day 15, beyond horizon
  });
  it("keeps an in-progress trip even if it started before today", () => {
    const midFrance = new Date("2026-06-18T08:00:00-04:00");
    const events = windowEvents(normalizeAll(MOCK_EVENTS), midFrance, 14);
    expect(events.map((e) => e.title)).toContain("FRANCE");
  });
});

describe("computed facts (the trip-departure class of error)", () => {
  it("states France departs in 3 days with the Monday flight — no model arithmetic", () => {
    const events = windowEvents(normalizeAll(MOCK_EVENTS), NOW, 14);
    const facts = computeFacts(events, extractTrips(events), NOW).join("\n");
    expect(facts).toContain("FRANCE — departs in 3 days (Monday June 15)");
    expect(facts).toContain("Flight to Paris, DL 264");
    // Prime Day has no flight — it is a span, not a trip
    expect(facts).not.toContain("Upcoming trip: Prime Day");
    expect(facts).toContain("Multi-day span: Prime Day");
  });
  it("mid-trip: reports day N of total and the return day", () => {
    const midFrance = new Date("2026-06-18T08:00:00-04:00");
    const events = windowEvents(normalizeAll(MOCK_EVENTS), midFrance, 14);
    const facts = computeFacts(events, extractTrips(events), midFrance).join("\n");
    expect(facts).toContain("Currently on trip: FRANCE (day 4 of 10");
    expect(facts).toContain("returns Wednesday June 24");
    expect(facts).toContain("Due today: Bilt payment due.");
    expect(facts).toContain("Due today: Capital One payment due.");
  });
});

describe("context assembly", () => {
  it("produces the structured format with transit tags and no past days", () => {
    const events = windowEvents(normalizeAll(MOCK_EVENTS), NOW, 14);
    const rendered = renderEvents(events, NOW);
    expect(rendered).toContain("[transit] Run to eyebrow appt");
    expect(rendered).toContain("2026-06-12 (Friday):");
    expect(rendered).not.toContain("2026-06-11");
  });
  it("assembles date line + facts + profile + calendar + message in order", () => {
    const events = windowEvents(normalizeAll(MOCK_EVENTS), NOW, 14);
    const ctx = assembleContext({
      now: NOW,
      events,
      trips: extractTrips(events),
      profile: "PROFILE — Stephie (test)",
      userMessage: "Morning briefing",
    });
    expect(ctx).toMatch(/^Current date: Friday, June 12, 2026, 9:00am/);
    expect(ctx.indexOf("COMPUTED FACTS")).toBeLessThan(ctx.indexOf("PROFILE"));
    expect(ctx.indexOf("PROFILE")).toBeLessThan(ctx.indexOf("CALENDAR"));
    expect(ctx.trim().endsWith("Morning briefing")).toBe(true);
  });
});
