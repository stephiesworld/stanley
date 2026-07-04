import Link from "next/link";
import { HeroScene } from "./HeroScene";
import { ThemeToggle } from "./ThemeToggle";

// Landing — built around one idea: the product demonstrating itself.
// Monumental type up top, then the scene (chat + day-sheet, synchronized),
// then two quiet rows of prose. Nothing decorative that isn't the product.
export default function Landing() {
  const bot = (process.env.TELEGRAM_BOT_USERNAME ?? "").replace(/[<>]/g, "");

  return (
    <main className="landing">
      <header className="masthead">
        <div className="brand">
          <span className="crest" aria-hidden="true">S</span>
          <span className="brandname">Stanley</span>
        </div>
        <span className="masthead-tag">Personal calendar butler</span>
        <ThemeToggle />
      </header>
      <div className="hairline" />

      <section className="hero">
        <h1 className="display reveal-up">
          He protects the <em>shape</em> of your&nbsp;week.
        </h1>
        <div className="hero-row reveal-up">
          <p className="lede">
            Stanley reads the week ahead and tells you when it&apos;s about to get
            away from you — a wedding crowding a workday, two big nights back to
            back, the recovery day you meant to keep. He proposes the fix in a
            sentence, and never moves a thing without your word.
          </p>
          <div className="hero-cta">
            <Link className="btn primary" href="/demo">
              Try the demo
            </Link>
            {bot ? (
              <a className="btn ghost" href={`https://t.me/${bot}`}>
                Message @{bot}
              </a>
            ) : null}
            <p className="trust">Read-only until you agree · Google Calendar · Telegram</p>
          </div>
        </div>

        <HeroScene />
      </section>

      <section className="section" aria-label="How it works">
        <p className="eyebrow">How it works</p>
        <div className="grid-3">
          <div className="col">
            <span className="idx">01</span>
            <h3>Connect your calendar</h3>
            <p>One tap links Google Calendar. Nothing else, and nothing shared.</p>
          </div>
          <div className="col">
            <span className="idx">02</span>
            <h3>He watches, and proposes</h3>
            <p>A morning read, an evening check-in, a quiet word when the week tips.</p>
          </div>
          <div className="col">
            <span className="idx">03</span>
            <h3>You say the word</h3>
            <p>Nothing moves until you agree. Changed your mind? Simply say &ldquo;undo.&rdquo;</p>
          </div>
        </div>
      </section>

      <section className="section" aria-label="The manner">
        <p className="eyebrow">The manner</p>
        <div className="grid-3">
          <div className="col">
            <h3>Propose, never act</h3>
            <p>
              Every change waits for your yes. The write happens only after you
              reply — enforced in code, not left to a model.
            </p>
          </div>
          <div className="col">
            <h3>Reads the whole shape</h3>
            <p>
              Not just open slots. Travel days, recovery time, one big thing a day —
              the rhythms you actually live by.
            </p>
          </div>
          <div className="col">
            <h3>Remembers you</h3>
            <p>
              He learns your habits as leanings, not rules — and they shift by
              season: a wedding week, between jobs, a trip abroad.
            </p>
          </div>
        </div>
      </section>

      <footer className="colophon">
        <span className="crest sm" aria-hidden="true">S</span>
        <span className="colophon-name">Stanley — at your service.</span>
        <Link href="/console">Voice console</Link>
      </footer>
    </main>
  );
}
