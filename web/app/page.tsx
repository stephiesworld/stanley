import Link from "next/link";

// "Keeper of Days" landing — recreated from the July 2026 design handoff.
// Static page, all motion is CSS. Copy is design-final: do not paraphrase.
// The "Employ Stanley" buttons go to /demo (the console); nav anchors scroll.

const QUIPS = [
  "“Might I suggest not booking leg day the morning after the wedding, sir.”",
  "“Your mother’s birthday is Thursday. I’ve drafted three excuses and one gift idea.”",
  "“Two ‘quick syncs’ rarely are, madam.”",
  "“I’ve protected your Sunday. It fought back. I won.”",
  "“Dinner with Alex AND drinks with Sam? Bold. Reckless, even.”",
  "“The dentist at 9, the investor at 10. I’d swap them. Numb is no way to pitch.”",
];
const QUIP_LINE = QUIPS.join("   ✦   ") + "   ✦   ";

// Lit cells: index → pulse duration in seconds. Desktop grid 53×7, mobile 28×6.
const LIT_DESKTOP: Record<number, number> = {
  23: 4.2, 37: 3.1, 58: 5.0, 84: 2.6, 96: 3.8, 121: 4.6, 133: 2.9, 150: 3.4,
  168: 5.2, 187: 2.7, 203: 4.0, 219: 3.6, 240: 2.8, 258: 4.4, 271: 3.2,
  289: 5.4, 301: 2.5, 320: 3.9, 341: 4.8, 358: 3.0, 12: 3.5, 66: 4.1,
  110: 2.4, 226: 5.1, 310: 3.7, 365: 4.3,
};
const LIT_MOBILE: Record<number, number> = {
  8: 3.5, 23: 4.2, 37: 3.1, 58: 5.0, 71: 2.6, 96: 3.8, 109: 4.6, 121: 2.9,
  133: 3.4, 150: 5.2, 161: 2.7,
};

const LEGEND_DESKTOP = [
  { cell: "037", label: "the first date — he booked nothing after 10pm since" },
  { cell: "121", label: "the marathon — taper week was his idea" },
  { cell: "203", label: "dad’s all-clear — the week Stanley emptied, once asked" },
  { cell: "289", label: "the job offer — he cleared the runway" },
  { cell: "358", label: "everyone home for christmas — protected since october" },
];
const LEGEND_MOBILE = [
  { cell: "037", label: "the first date — he booked nothing after 10pm since" },
  { cell: "109", label: "dad’s all-clear — the week Stanley emptied, once asked" },
  { cell: "150", label: "the job offer — he cleared the runway" },
];

const LEDGER = [
  { time: "MON 09:00", text: "Interview — the job you almost didn’t apply for", tag: "WORK", note: "stanley: I pressed. Gently. You’re welcome." },
  { time: "TUE 19:30", text: "Dinner w/ R. — third date, the good tapas place", tag: "LOVE", note: "stanley: I moved your 6pm. With your blessing, obviously." },
  { time: "WED 07:15", text: "Bloodwork, fasting", tag: "HEALTH", note: "stanley: fourth booking. This one stands, sir." },
  { time: "THU 18:00", text: "Call mum", tag: "FAMILY", note: "stanley: immovable. As agreed. As it should be." },
  { time: "FRI 20:00", text: "Dan’s stag — you are the best man, act like it", tag: "MATES", note: "stanley: Saturday has been emptied. Preemptively." },
  { time: "SAT 10:00", text: "Flat viewings ×3 — the one with the light", tag: "BIG", note: "stanley: I mapped the route. The good one is second." },
  { time: "SUN —", text: "Nothing. Deliberately, gloriously nothing.", tag: "REST", note: "stanley: it fought back. I won." },
  { time: "MON 14:00", text: "Therapy — the standing one", tag: "HEALTH", note: "stanley: never touched. Never will be." },
  { time: "WED 12:30", text: "Lunch w/ former boss", tag: "WORK", note: "stanley: bridges want warming, sir." },
  { time: "FRI 09:00", text: "Sign the lease — the one with the light", tag: "BIG", note: "stanley: I took the liberty of feeling pleased." },
];

const CHATS: { text: string; who: "stanley" | "you"; delay: string }[] = [
  { text: "Good morning. Wednesday is attempting to have four meetings and a dentist. Shall I intervene?", who: "stanley", delay: "0.1s" },
  { text: "yes please", who: "you", delay: "0.35s" },
  { text: "Dentist moved to Friday 9am. The 3pm sync agreed to become an email, as most syncs should. Wednesday breathes again.", who: "stanley", delay: "0.6s" },
  { text: "Also — your anniversary is in 9 days. I have thoughts. Only when you’re ready.", who: "stanley", delay: "0.85s" },
];

const SERVICE_LOG = [
  { id: "SVC-0117", observed: "You cancel every Friday-morning meeting, eventually.", proposed: "Stop booking them. Fridays open at noon.", status: "APPROVED" },
  { id: "SVC-0118", observed: "Two big nights, back to back, twice a month.", proposed: "A buffer evening after each. Held, not booked.", status: "APPROVED" },
  { id: "SVC-0119", observed: "Mum’s call drifts when work runs late.", proposed: "Thursday 6pm becomes immovable.", status: "CORRECTED" },
  { id: "SVC-0120", observed: "The check-up has moved four times.", proposed: "It moves once more — to tomorrow morning.", status: "PENDING" },
];

function YearGrid({ count, lit, className }: { count: number; lit: Record<number, number>; className: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) =>
        lit[i] ? (
          <div key={i} className="kd-cell lit" style={{ ["--dur" as string]: `${lit[i]}s` }} />
        ) : (
          <div key={i} className="kd-cell" />
        ),
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="kd kd-page">
      <div className="kd-frame">
        {/* nav */}
        <nav className="kd-nav">
          <div className="kd-nav-brand">
            <div className="kd-nav-sq" />
            <span className="kd-nav-name">STANLEY</span>
            <span className="kd-nav-sub">/ KEEPER OF DAYS</span>
          </div>
          <div className="kd-nav-links">
            <a className="anchor" href="#ledger">THE LEDGER</a>
            <a className="anchor" href="#manner">THE MANNER</a>
            <a className="anchor" href="#service">THE SERVICE</a>
            <a className="kd-accent-link" href="#cta">EMPLOY HIM →</a>
          </div>
        </nav>

        {/* hero */}
        <header className="kd-hero">
          <div className="kd-eyebrow">A BUTLER, TECHNICALLY. A BIOGRAPHER, REALLY.</div>
          <h1 className="kd-h1">
            A calendar is the only honest <em>autobiography.</em>
          </h1>
          <div className="kd-hero-row">
            <p className="kd-hero-copy">
              Every dentist, every date, every deadline, every goodbye — a life, in rows. Stanley reads
              yours very carefully, learns the person it describes, and then, politely, keeps the week
              from getting the better of you.
            </p>
            <div className="kd-hero-cta">
              <Link href="/demo" className="kd-btn">Employ Stanley</Link>
              <span className="kd-microcopy">
                he reads before he touches. he asks before he moves. always.
                <span className="kd-cursor" />
              </span>
            </div>
          </div>
        </header>

        {/* quip ticker */}
        <div className="kd-ticker">
          <div className="kd-ticker-inner">
            <span>{QUIP_LINE}</span>
            <span aria-hidden="true">{QUIP_LINE}</span>
          </div>
        </div>

        {/* year grid */}
        <section className="kd-yearwrap">
          <div className="kd-yearpanel">
            <div className="kd-yearhead">
              <span>
                YOUR YEAR, AS STANLEY SEES IT<span className="cells"> · 371 CELLS</span>
              </span>
              <span className="lit">■ = A THING YOU’D RATHER NOT FORGET</span>
            </div>
            <YearGrid count={371} lit={LIT_DESKTOP} className="kd-yeargrid" />
            <YearGrid count={168} lit={LIT_MOBILE} className="kd-yeargrid-m" />
            <div className="kd-legend">
              {LEGEND_DESKTOP.map((leg) => (
                <span key={leg.cell}>
                  <span className="lit">■ {leg.cell}</span> — {leg.label}
                </span>
              ))}
            </div>
            <div className="kd-legend kd-legend-m">
              {LEGEND_MOBILE.map((leg) => (
                <span key={leg.cell}>
                  <span className="lit">■ {leg.cell}</span> — {leg.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* the ledger */}
        <section id="ledger" className="kd-ledger">
          <div className="kd-ledger-copy">
            <div className="kd-section-label">02 — THE LEDGER</div>
            <h2 className="kd-h2">One repository holds everything.</h2>
            <p className="kd-body">
              Work next to love next to bloodwork next to the stag do. No other system holds a whole
              person. Stanley starts here — not with your inbox, with your <span className="ital">days</span>.
              He reads them the way a good butler reads a household: quietly, completely, and with
              opinions he keeps to himself until asked.
            </p>
          </div>
          <div className="kd-ledger-scroller" aria-hidden="true">
            <div className="kd-ledger-list">
              {[...LEDGER, ...LEDGER].map((row, i) => (
                <div className="kd-ledger-row" key={i}>
                  <span className="t">{row.time}</span>
                  <span>
                    {row.text}
                    <span className="note">{row.note}</span>
                  </span>
                  <span className="tag">{row.tag}</span>
                </div>
              ))}
            </div>
            <div className="kd-ledger-fade-top" />
            <div className="kd-ledger-fade-bot" />
          </div>
        </section>
        {/* mobile ledger: static stack */}
        <div className="kd-ledger-stack">
          {LEDGER.slice(0, 5).map((row, i) => (
            <div className="kd-ledger-card" key={i}>
              <div className="toprow">
                <span className="t">{row.time}</span>
                <span className="tag">{row.tag}</span>
              </div>
              <span className="txt">{row.text}</span>
              <span className="note">{row.note}</span>
            </div>
          ))}
        </div>

        {/* the manner */}
        <section id="manner" className="kd-manner">
          <div className="kd-manner-copy">
            <div className="kd-section-label">03 — THE MANNER</div>
            <h2 className="kd-h2">
              He never nags. He <em>murmurs.</em>
            </h2>
            <p className="kd-body">
              One quiet message when the week starts tipping. Never a dashboard. Never a notification
              storm. Just a butler, clearing his throat.
            </p>
          </div>
          <div className="kd-chats">
            {CHATS.map((msg, i) => (
              <div className={`kd-chat ${msg.who}`} style={{ animationDelay: msg.delay }} key={i}>
                {msg.text}
              </div>
            ))}
          </div>
        </section>

        {/* the service */}
        <section id="service" className="kd-service">
          <div className="kd-section-label">04 — THE SERVICE</div>
          <h2 className="kd-h2">He learns you by serving you.</h2>
          <p className="kd-body">
            Not by profiling. By proposing — and being told yes, no, or “close, but Thursdays are
            sacred.” Every correction makes him a better butler. The service log is the curriculum.
          </p>
          <div className="kd-svc-table">
            {SERVICE_LOG.map((log) => (
              <div className="kd-svc-row" key={log.id}>
                <span className="kd-svc-id">{log.id}</span>
                <span className="kd-svc-obs">
                  <span className="kd-svc-k">OBSERVED&nbsp;&nbsp;</span>
                  {log.observed}
                </span>
                <span className="kd-svc-prop">
                  <span className="kd-svc-k">PROPOSED&nbsp;&nbsp;</span>
                  {log.proposed}
                </span>
                <span className="kd-svc-status">{log.status}</span>
              </div>
            ))}
          </div>
        </section>

        {/* interlude */}
        <section className="kd-interlude">
          <div className="kd-dial" aria-hidden="true" />
          <div className="kd-interlude-inner">
            <div className="kd-ask">ASK YOURSELF</div>
            <div className="kd-interlude-q">
              What do you put in a calendar? <span className="shout">The things you’d rather not forget.</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="kd-cta">
          <h2>
            Give Stanley the week.
            <br />
            He’ll give most of it <em>back.</em>
          </h2>
          <Link href="/demo" className="kd-btn">Employ Stanley →</Link>
          <div className="kd-cta-foot">HE PROPOSES. YOU DECIDE. THE LEDGER REMEMBERS. THE TEA IS HIS OWN.</div>
        </section>
      </div>
    </div>
  );
}
