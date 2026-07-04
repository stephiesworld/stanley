"use client";

import { useEffect, useState } from "react";
import { Bear } from "./Bear";

// The landing's centerpiece: Stanley proposes in chat while tomorrow's
// day-sheet sits beside it. On "Yes, please" the 3:00 block glides to 4:00 —
// the product demonstrating its own propose → confirm → write story.
// Honors prefers-reduced-motion (renders the resolved end-state, static).

const HOUR = 44; // px per hour on the day sheet
const DAY_START = 13; // 1 PM

const BUBBLES = [
  {
    who: "them" as const,
    text: "Tomorrow's tight — the design review runs straight into your 3:00, and there's tennis at 7. Shall I move the 3:00 to 4:00?",
  },
  { who: "you" as const, text: "Yes, please" },
  { who: "them" as const, text: "Done — the 3:00 now sits at 4:00. Air before tennis.", done: true },
];

type Phase = "idle" | "propose" | "moved";

export function HeroScene() {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((r) => timers.push(setTimeout(r, ms)));

    (async () => {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
        setShown(BUBBLES.length);
        setPhase("moved");
        return;
      }
      for (;;) {
        setShown(0);
        setTyping(false);
        setPhase("idle");
        await wait(1000);
        if (cancelled) return;

        setTyping(true); // Stanley composing the proposal
        await wait(1500);
        if (cancelled) return;
        setTyping(false);
        setShown(1);
        setPhase("propose"); // conflict lights up on the sheet
        await wait(2200);
        if (cancelled) return;

        setShown(2); // "Yes, please"
        await wait(900);
        if (cancelled) return;

        setTyping(true);
        await wait(1000);
        if (cancelled) return;
        setTyping(false);
        setShown(3);
        setPhase("moved"); // the block glides to 4:00
        await wait(5200);
        if (cancelled) return;
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  const top = (h: number) => (h - DAY_START) * HOUR;

  return (
    <section className="scene reveal-up delay-1" aria-label="Stanley proposing a change, and the calendar following">
      <div className="scene-chat">
        <div className="scene-head">
          <Bear size={34} className="scene-avatar" />
          <span className="scene-name">Stanley</span>
          <span className="scene-status">reading your week</span>
        </div>
        <div className="scene-stream">
          {BUBBLES.slice(0, shown).map((b, i) => (
            <div key={i} className={`sc-bubble ${b.who}${b.done ? " done" : ""}`}>
              {b.done && <span className="done-tick" aria-hidden="true">✓</span>}
              {b.text}
            </div>
          ))}
          {typing && (
            <div className="sc-bubble them sc-typing" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>
      </div>

      <div className="scene-sheet" aria-hidden="true">
        <div className="sheet-head">
          <span className="sheet-day">Tomorrow</span>
          <span className="sheet-date">Thursday</span>
        </div>
        <div className="sheet-grid" style={{ height: 7 * HOUR }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((h, i) => (
            <div key={h} className="sheet-hour" style={{ top: i * HOUR }}>
              <span>{h}</span>
            </div>
          ))}
          <div
            className={`evt-block${phase === "propose" ? " conflict" : ""}`}
            style={{ top: top(14), height: HOUR }}
          >
            Design review
          </div>
          <div
            className={`evt-block moving${phase === "propose" ? " conflict" : ""}${phase === "moved" ? " resolved" : ""}${phase === "idle" ? " snap" : ""}`}
            style={{ top: phase === "moved" ? top(16) : top(15), height: HOUR }}
          >
            Investor call
          </div>
          <div className="evt-block" style={{ top: top(19), height: HOUR }}>
            Tennis with Dana
          </div>
        </div>
      </div>
    </section>
  );
}
