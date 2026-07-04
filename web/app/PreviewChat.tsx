"use client";

import { useEffect, useState } from "react";
import { Bear } from "./Bear";

// The hero's living proof: Stanley's propose → "Yes" → "Done ✓" exchange that
// types itself out, framed as a real product. Honors prefers-reduced-motion
// (shows it all at once). Loops gently so the page always feels alive.
const SCRIPT = [
  {
    who: "them" as const,
    text: "Tomorrow's tight — the 2:00 and 3:00 run back to back, and you have tennis at 7. Move the 3:00 to 4:00?",
    typeMs: 1300,
  },
  { who: "you" as const, text: "Yes, please", typeMs: 700 },
  { who: "them" as const, text: "Done — the 3:00 now sits at 4:00.", typeMs: 1100, done: true },
];

export function PreviewChat() {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((r) => timers.push(setTimeout(r, ms)));

    (async () => {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
        setShown(SCRIPT.length);
        return;
      }
      // loop forever with a calm pause between runs
      for (;;) {
        setShown(0);
        setTyping(false);
        await wait(700);
        for (let i = 0; i < SCRIPT.length; i++) {
          if (cancelled) return;
          const cur = SCRIPT[i];
          if (cur.who === "them") {
            setTyping(true);
            await wait(cur.typeMs);
            if (cancelled) return;
            setTyping(false);
          }
          setShown(i + 1);
          await wait(cur.who === "them" ? 600 : cur.typeMs);
        }
        await wait(4200); // hold the finished exchange, then replay
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <aside className="device" aria-label="A sample exchange with Stanley">
      <div className="device-head">
        <Bear size={38} className="device-avatar" />
        <span className="device-name">Stanley</span>
        <span className="device-status">reading your week</span>
      </div>
      <div className="preview-stream">
        {SCRIPT.slice(0, shown).map((b, i) => (
          <div key={i} className={`bubble ${b.who} reveal${b.done ? " done" : ""}`}>
            {b.done && <span className="done-tick" aria-hidden="true">✓</span>}
            {b.text}
          </div>
        ))}
        {typing && (
          <div className="bubble them typing-dots" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
    </aside>
  );
}
