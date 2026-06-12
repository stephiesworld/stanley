"use client";

import { useState } from "react";

interface Turn {
  role: "user" | "assistant";
  content: string; // what the API was sent (turn one = full context)
  display: string; // what Stephie typed / Stanley said
}

const QUICK_PROBES = [
  { label: "Morning briefing", message: "Morning briefing" },
  { label: "Evening check-in", message: "evening check-in" },
  { label: "What are you guarding?", message: "What are you guarding for me this week?" },
];

export default function Home() {
  const [thread, setThread] = useState<Turn[]>([]);
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(""); // optional simulated date
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const history = thread.map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          ...(date && history.length === 0 ? { date } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      if (history.length === 0) setSource(data.source);
      setThread([
        ...thread,
        // turn one carries the assembled context so follow-ups stay grounded
        { role: "user", content: data.context ?? text, display: text },
        { role: "assistant", content: data.briefing, display: data.briefing },
      ]);
      setMessage("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setThread([]);
    setSource("");
    setError("");
  }

  const started = thread.length > 0;

  return (
    <main className="stanley">
      <h1>Stanley</h1>
      <p className="tagline">He protects the shape of your week.</p>

      {!started && (
        <div className="setup">
          <label>
            Simulate a date <span className="hint">(optional — like the harness --date flag)</span>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <a className="connect" href="/api/auth/google">
            Connect Google Calendar
          </a>
        </div>
      )}

      <div className="quick">
        {QUICK_PROBES.map((p) => (
          <button
            key={p.label}
            className="ghost"
            disabled={loading}
            onClick={() => send(p.message)}
          >
            {p.label}
          </button>
        ))}
        {started && (
          <button className="ghost reset" onClick={reset} disabled={loading}>
            New session
          </button>
        )}
      </div>

      {source && <p className="source">calendar source: {source}{date ? ` · simulated: ${date.replace("T", " ")}` : ""}</p>}
      {error && <p className="error">{error}</p>}

      <section className="thread">
        {thread.map((t, i) => (
          <div key={i} className={`turn ${t.role}`}>
            <span className="who">{t.role === "user" ? "You" : "Stanley"}</span>
            {t.display.split("\n\n").map((para, j) => (
              <p key={j}>{para}</p>
            ))}
          </div>
        ))}
        {loading && (
          <div className="turn assistant">
            <span className="who">Stanley</span>
            <p className="thinking">…</p>
          </div>
        )}
      </section>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(message);
        }}
      >
        <input
          type="text"
          placeholder={started ? "Reply to Stanley…" : "Ask Stanley anything…"}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !message.trim()}>
          Send
        </button>
      </form>
    </main>
  );
}
