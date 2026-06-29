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

      <section className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Your personal calendar butler</p>
          <h1>He protects the shape of your week.</h1>
          <p className="tagline">Dry, brief, entirely on your side. You reach him by text.</p>
          <p className="lede">
            Stanley watches the week ahead and tells you when it&apos;s about to get away from
            you — a wedding crowding a workday, two big nights back to back, a recovery day you
            swore you&apos;d keep. He proposes the fix in a sentence, and never moves a thing
            without your yes.
          </p>
          <div className="cta-row">
            <Link className="btn primary" href="/demo">
              Try the live demo →
            </Link>
            {bot ? (
              <a className="btn ghost" href={`https://t.me/${bot}`}>
                Message @{bot}
              </a>
            ) : (
              <span className="sms-line">Telegram bot coming soon — the demo works now.</span>
            )}
          </div>
        </div>

        {/* Product preview — show the propose → confirm → done loop */}
        <aside className="preview" aria-label="A sample exchange with Stanley">
          <div className="preview-bar">
            <Bear size={24} className="avatar-bear" /> Stanley
          </div>
          <div className="preview-stream">
            <div className="bubble them">
              Tomorrow&apos;s tight — the 2:00 and 3:00 are back to back, and you have tennis at 7.
              Move the 3:00 to 4:00?
            </div>
            <div className="bubble you">Y</div>
            <div className="bubble them done">
              <span className="done-tick" aria-hidden="true">✓</span> Done — moved the 3:00 to 4:00.
            </div>
          </div>
        </aside>
      </section>

      <section className="steps" aria-label="How it works">
        <div className="step">
          <span className="step-n">1</span>
          <h3>Connect your calendar</h3>
          <p>One tap to link Google Calendar. Read and write, nothing else.</p>
        </div>
        <div className="step">
          <span className="step-n">2</span>
          <h3>He watches and proposes</h3>
          <p>A morning read, an evening check-in, and a nudge when the week tips.</p>
        </div>
        <div className="step">
          <span className="step-n">3</span>
          <h3>Reply Y — it&apos;s done</h3>
          <p>Nothing changes on your calendar until you say yes. Change your mind? &ldquo;Undo.&rdquo;</p>
        </div>
      </section>

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

      <footer className="site-foot">
        <span className="crest sm" aria-hidden="true">S</span>
        <span>Stanley — at your service.</span>
        <Link href="/console">Voice console →</Link>
      </footer>
    </main>
  );
}
