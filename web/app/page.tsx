import Link from "next/link";
import TippingWeek from "./tipping-week";

// "The shape of the week" landing (September 2026). The hero is the product:
// a sample week with Wednesday tipping, fixed by one proposal (TippingWeek).
// Stanley's own words are always set in the serif italic (.wk-voice).
// Every CTA goes to /demo, the console, which runs the real brain.

const BELIEFS = [
  { name: "Slow mornings", detail: "Nothing before 9:30 unless it’s a flight", pct: 92, meta: "92% · confirmed 6×" },
  { name: "Tennis twice a week", detail: "Never on consecutive days", pct: 81, meta: "81% · confirmed 4×" },
  { name: "Thursday 18:00 is Mum", detail: "Immovable, as agreed", pct: 100, meta: "100% · you said so" },
  { name: "A buffer after big nights", detail: "Held, not booked", pct: 68, meta: "68% · confirmed 2×" },
  { name: "No meetings on Friday mornings", detail: "You’ve booked three since June", pct: 34, meta: "34% · fading", fading: true },
];

export default function Landing() {
  return (
    <div className="wk">
      <div className="wk-wrap">
        <nav className="wk-nav">
          <div className="wk-logo">
            <i aria-hidden="true">
              <b /><b /><b /><b /><b /><b /><b />
            </i>
            Stanley
          </div>
          <div className="wk-nav-r">
            <a href="#learned">What he learns</a>
            <a href="#start">Pricing</a>
            <Link href="/demo" className="wk-btn">Try the demo</Link>
          </div>
        </nav>

        <TippingWeek />

        <section className="wk-learned" id="learned">
          <div>
            <h2 className="wk-h2">He learns you from what you say yes to.</h2>
            <p>
              Stanley doesn’t enforce rules. He holds beliefs about how you like to live, each with a
              confidence that rises when you agree and fades when you don’t. Correct him once and he
              remembers.
            </p>
            <p className="wk-voice">
              “Understood. Wednesday stays as it is. I’ve noted that you like your chaos artisanal.”
            </p>
          </div>
          <div className="wk-beliefs">
            {BELIEFS.map((b) => (
              <div className={`wk-belief${b.fading ? " fading" : ""}`} key={b.name}>
                <div className="n">
                  {b.name}
                  <small>{b.detail}</small>
                </div>
                <div className="wk-bar"><i style={{ width: `${b.pct}%` }} /></div>
                <div className="m">{b.meta}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="wk-end" id="start">
          <div>
            <h2>$20 a month. Your week, in better shape.</h2>
            <p>Reads your Google Calendar. Texts you on Telegram. Never changes anything without a yes.</p>
          </div>
          <Link href="/demo" className="wk-btn">Try the demo</Link>
        </section>
      </div>
    </div>
  );
}
