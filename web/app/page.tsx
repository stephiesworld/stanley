"use client";

import { useState } from "react";

export default function Home() {
  const [briefing, setBriefing] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function fetchBriefing() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Morning briefing" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setBriefing(data.briefing);
      setSource(data.source);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="stanley">
      <h1>Stanley</h1>
      <p className="tagline">He protects the shape of your week.</p>

      <div className="actions">
        <button onClick={fetchBriefing} disabled={loading}>
          {loading ? "One moment…" : "Morning briefing"}
        </button>
        <a className="connect" href="/api/auth/google">
          Connect Google Calendar
        </a>
      </div>

      {error && <p className="error">{error}</p>}

      {briefing && (
        <section className="briefing">
          <p className="source">calendar source: {source}</p>
          {briefing.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </section>
      )}
    </main>
  );
}
