import Link from "next/link";
import { ButlerBear } from "./ButlerBear";
import { PreviewChat } from "./PreviewChat";
import { ThemeToggle } from "./ThemeToggle";

// Landing — an editorial spread, not a centered SaaS template. Masthead,
// asymmetric hero, a pull-quote in Stanley's voice, big serif numerals.
export default function Landing() {
  const bot = process.env.TELEGRAM_BOT_USERNAME ?? "";

  return (
    <main className="landing editorial">
      <header className="masthead">
        <div className="brand">
          <span className="crest" aria-hidden="true">S</span>
          <span className="brandname">Stanley</span>
        </div>
        <span className="masthead-tag">A personal calendar butler · est. 2026</span>
        <ThemeToggle />
      </header>
      <div className="rule-brass" />

      <section className="ed-hero">
        <div className="ed-hero-copy reveal-up">
          <p className="ed-eyebrow">№ 01 — The premise</p>
          <h1>
            He protects the <em>shape</em> of your week.
          </h1>
          <p className="lede">
            <span className="dropcap">S</span>tanley watches the week ahead and tells you when
            it&apos;s about to get away from you — a wedding crowding a workday, two big nights
            back to back, a recovery day you swore you&apos;d keep. He proposes the fix in a
            sentence, and never moves a thing without your yes.
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

        <div className="hero-visual ed-hero-visual reveal-up delay-1">
          <ButlerBear size={184} className="hero-butler" />
          <PreviewChat />
        </div>
      </section>

      <section className="pullquote reveal-up" aria-label="In Stanley's words">
        <p>
          Saturday&apos;s empty, three days from the wedding. I intend to keep it that way —
          unless you object.
        </p>
        <span className="attr">Stanley, on guarding your week</span>
      </section>

      <section className="ed-steps" aria-label="How it works">
        <p className="ed-eyebrow">№ 02 — How it works</p>
        <div className="ed-steps-grid">
          <div className="ed-step">
            <span className="numeral">01</span>
            <h3>Connect your calendar</h3>
            <p>One tap to link Google Calendar. Read and write, nothing else.</p>
          </div>
          <div className="ed-step">
            <span className="numeral">02</span>
            <h3>He watches and proposes</h3>
            <p>A morning read, an evening check-in, and a nudge when the week tips.</p>
          </div>
          <div className="ed-step">
            <span className="numeral">03</span>
            <h3>Reply Y — it&apos;s done</h3>
            <p>Nothing moves until you say yes. Changed your mind? Just say &ldquo;undo.&rdquo;</p>
          </div>
        </div>
      </section>

      <section className="ed-features" aria-label="The manner">
        <p className="ed-eyebrow">№ 03 — The manner</p>
        <div className="ed-features-grid">
          <div className="ed-feature">
            <h3>Propose, never act</h3>
            <p>
              Every change needs your yes. The write to your calendar happens only after you
              reply — enforced in code, not left to the model.
            </p>
          </div>
          <div className="ed-feature">
            <h3>Reads the whole shape</h3>
            <p>
              Not just open slots. Travel days, recovery time, one-big-thing-a-day — the rhythms
              you actually live by, protected.
            </p>
          </div>
          <div className="ed-feature">
            <h3>Remembers you</h3>
            <p>
              He learns your preferences as probabilities, not rules, and they shift by season —
              wedding crunch, between jobs, a trip abroad.
            </p>
          </div>
        </div>
      </section>

      <footer className="colophon">
        <span className="crest sm" aria-hidden="true">S</span>
        <span className="colophon-name">Stanley — at your service.</span>
        <span className="colophon-meta">No. 1 · 2026</span>
        <Link href="/console">Voice console →</Link>
      </footer>
    </main>
  );
}
