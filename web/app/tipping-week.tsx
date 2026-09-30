"use client";

import { useState } from "react";
import WeekGrid, { WeekLegend, type Block, type Kind } from "./week-grid";

// The landing hero: a sample week (6–12 Jul 2026, same week as /demo) where
// Wednesday is tipping. One scripted proposal — the same one the console
// opens with — moves the dentist to Friday 9am and turns the 1pm sync into
// an email. Purely client-side; nothing here touches the real brain.

type Ev = {
  id?: string;
  day: number; // 0 = Mon
  start: number; // hour, 24h, decimals allowed
  len: number; // hours
  title: string;
  sub: string;
  kind: Kind;
  tilt?: [number, number]; // [deg, px] while Wednesday is tipping
};

const EVENTS: Ev[] = [
  { day: 0, start: 9, len: 1, title: "Team planning", sub: "9:00", kind: "work" },
  { day: 0, start: 12.5, len: 1, title: "Lunch w/ Priya", sub: "12:30", kind: "people" },
  { day: 0, start: 18.5, len: 1.5, title: "Tennis", sub: "18:30", kind: "health" },
  { day: 1, start: 7, len: 2.5, title: "Slow morning", sub: "held", kind: "held" },
  { day: 1, start: 10, len: 1.5, title: "Design review", sub: "10:00", kind: "work" },
  { day: 1, start: 19.5, len: 2, title: "Dinner w/ R.", sub: "19:30", kind: "people" },
  { day: 2, start: 9, len: 1, title: "Board prep", sub: "9:00", kind: "work", tilt: [-3, 0] },
  { day: 2, start: 10, len: 1, title: "1:1 Sam", sub: "10:00", kind: "work", tilt: [2.5, 3] },
  { day: 2, start: 11, len: 1, title: "Hiring panel", sub: "11:00", kind: "work", tilt: [-1.5, 0] },
  { id: "sync", day: 2, start: 13, len: 0.75, title: "Quick sync", sub: "", kind: "work", tilt: [3, -2] },
  { id: "dentist", day: 2, start: 14, len: 1, title: "Dentist", sub: "14:00", kind: "health", tilt: [-2.5, 4] },
  { day: 2, start: 15, len: 1, title: "Vendor call", sub: "15:00", kind: "work", tilt: [2, 0] },
  { day: 3, start: 10, len: 2, title: "Deep work", sub: "10:00", kind: "work" },
  { day: 3, start: 18, len: 0.75, title: "Call mum", sub: "18:00", kind: "family" },
  { day: 4, start: 12, len: 1, title: "Lunch", sub: "12:00", kind: "people" },
  { day: 4, start: 20, len: 2, title: "Dan’s stag", sub: "20:00", kind: "big" },
  { day: 5, start: 7, len: 3.5, title: "Emptied", sub: "after the stag", kind: "held" },
  { day: 5, start: 11, len: 2, title: "Flat viewings ×3", sub: "11:00", kind: "big" },
  { day: 6, start: 7, len: 15, title: "Nothing", sub: "deliberately", kind: "held" },
];

const DAYS = [
  { label: "Mon 6" }, { label: "Tue 7" }, { label: "Wed 8" },
  { label: "Thu 9", tag: "Sacred 18:00" }, { label: "Fri 10" }, { label: "Sat 11" },
  { label: "Sun 12", tag: "Protected" },
];

const LINES = {
  ask: "Wednesday is attempting five meetings and a dentist. I’d move the dentist to Friday at 9 and turn the 1pm sync into an email. Shall I?",
  yes: "Done. Wednesday breathes again. Your anniversary is in 9 days, by the way. I have thoughts, when you’re ready.",
  no: "Understood. Wednesday stays as it is. I’ve made a note that you like your chaos artisanal.",
};

type State = "pending" | "approved" | "corrected";

export default function TippingWeek() {
  const [state, setState] = useState<State>("pending");
  const calm = state === "approved";
  const days = DAYS.map((d, i) =>
    i === 2 ? { ...d, tag: calm ? "Breathing" : "Tipping", warn: true } : d,
  );
  const blocks: Block[] = EVENTS.map((ev, i) => {
    const moved = calm && ev.id === "dentist";
    const gone = calm && ev.id === "sync";
    return {
      key: ev.id ?? String(i),
      day: moved ? 4 : ev.day,
      start: moved ? 9 : ev.start,
      len: ev.len,
      title: gone ? "Quick sync → an email" : ev.title,
      sub: moved ? "9:00 · moved, with permission" : ev.sub,
      kind: ev.kind,
      tilt: ev.tilt,
      moved,
      gone,
    };
  });

  return (
    <div className={calm ? "wk-calm" : "wk-tipping"}>
      <section className="wk-hero">
        <div className="wk-status">
          <i />
          <span>Week of 6 July · {calm ? "The week is breathing" : "Wednesday is tipping"}</span>
        </div>
        <h1>Stanley protects the shape of your week</h1>
        <p>
          He reads your calendar, spots the day that’s about to go wrong, and proposes a fix.
          Nothing moves until you say yes.
        </p>
      </section>

      <div className="wk-board">
        <WeekGrid days={days} blocks={blocks} tipDay={2} />

        <div className="wk-note" aria-live="polite">
          <div className="wk-who">
            Stanley <span>7:30 · Telegram</span>
          </div>
          <div className="wk-say wk-voice">{LINES[state === "pending" ? "ask" : state === "approved" ? "yes" : "no"]}</div>
          {state === "pending" ? (
            <div className="wk-btns">
              <button className="yes" onClick={() => setState("approved")}>Say the word</button>
              <button onClick={() => setState("corrected")}>Not quite</button>
            </div>
          ) : (
            <button className="wk-again" onClick={() => setState("pending")}>Tip it over again</button>
          )}
        </div>

        <WeekLegend />
      </div>
    </div>
  );
}
