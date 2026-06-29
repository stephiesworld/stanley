import Link from "next/link";
import { Bear } from "./Bear";
import { ThemeToggle } from "./ThemeToggle";

// Landing — the public face. Server component so it can read the configured
// Telegram bot handle for the "message Stanley" line (falls back gracefully
// before the bot is live, pointing everyone to the no-setup demo).
export default function Landing() {
  const bot = process.env.TELEGRAM_BOT_USERNAME ?? "";

  return (
    <main className="landing">
      <div className="topbar">
        <div className="brand">
          <span className="crest" aria-hidden="true">S</span>
          <span className="brandname">Stanley</span>
        </div>
        <ThemeToggle />
      </div>
      <div className="hero">
        <Bear size={108} className="hero-bear" />
        <div>
          <h1>He protects the shape of your week.</h1>
          <p className="tagline">A calendar butler you reach by text. Dry, brief, entirely on your side.</p>
        </div>
      </div>

      <p className="lede">
        Stanley watches the week ahead and tells you when it&apos;s about to get away from you —
        a wedding crowding a workday, two big nights back to back, a recovery day you swore
        you&apos;d keep. He proposes the fix in a sentence. He never moves a thing without your yes.
      </p>

      <div className="cta-row">
        <Link className="btn primary" href="/demo">
          Try the live demo →
        </Link>
        {bot ? (
          <span className="sms-line">
            or message Stanley on Telegram:{" "}
            <a href={`https://t.me/${bot}`}>
              <b>@{bot}</b>
            </a>
          </span>
        ) : (
          <span className="sms-line">Telegram bot coming soon — the demo works now.</span>
        )}
      </div>

      <div className="cards">
        <div className="card">
          <h3>Propose, never act</h3>
          <p>
            Every change is a suggestion that needs your yes. The write to your calendar happens
            only after you reply — enforced in code, not left to the model.
          </p>
        </div>
        <div className="card">
          <h3>Reads the whole shape</h3>
          <p>
            Not just open slots. Travel days, recovery time, one-big-thing-a-day — the rhythms
            you actually live by, protected.
          </p>
        </div>
        <div className="card">
          <h3>Remembers you</h3>
          <p>
            He learns your preferences as probabilities, not rules, and they shift by season —
            wedding crunch, between jobs, a trip abroad.
          </p>
        </div>
      </div>

      <p className="foot">
        A working prototype. The demo runs the real Stanley against a sample week —
        propose, confirm, watch the calendar change. <Link href="/console">Voice console →</Link>
      </p>
    </main>
  );
}
