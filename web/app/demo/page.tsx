"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bear } from "../Bear";
import { ThemeToggle } from "../ThemeToggle";

// The live demo. Left: a text thread with Stanley. Right: the sample calendar,
// which actually changes when you approve a proposal — the same propose→confirm→
// write gate the SMS product runs, against an in-memory mock so anyone can try
// it with zero setup. State lives in the browser; nothing is stored.

const SIM_DATE = "2026-06-12T08:00:00-04:00";
const TZ = "America/New_York";

interface GEvent {
  id?: string | null;
  summary?: string | null;
  location?: string | null;
  start?: { date?: string | null; dateTime?: string | null } | null;
  end?: { date?: string | null; dateTime?: string | null } | null;
}
interface Bubble {
  who: "them" | "you";
  text: string;
}
type Action = Record<string, unknown> | null;

const SUGGESTIONS = [
  "Morning briefing",
  "What are you guarding this week?",
  "Move my eyebrow appt to 4pm Friday",
  "I'm exhausted, clear something Saturday",
];

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const labelFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

function startDay(e: GEvent): string {
  if (e.start?.date) return e.start.date;
  if (e.start?.dateTime) return dayFmt.format(new Date(e.start.dateTime));
  return "9999";
}
function isAllDay(e: GEvent): boolean {
  return Boolean(e.start?.date);
}
function isTransit(e: GEvent): boolean {
  return /^(travel|transit|head to|run to|walk to|drive to)/i.test((e.summary ?? "").trim());
}
function timeLabel(e: GEvent): string {
  if (isAllDay(e)) return "all-day";
  return e.start?.dateTime ? timeFmt.format(new Date(e.start.dateTime)).toLowerCase().replace(" ", "") : "";
}
function sig(e: GEvent): string {
  return `${e.id}|${e.start?.dateTime ?? e.start?.date}|${e.summary}`;
}

export default function Demo() {
  const [events, setEvents] = useState<GEvent[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([
    { who: "them", text: "Stanley here. Ask me about your week — or tell me to move something." },
  ]);
  const [pending, setPending] = useState<Action>(null);
  const [lastChange, setLastChange] = useState<unknown>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/demo")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setError("Couldn't load the sample calendar."));
  }, []);

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    setInput("");
    const history = bubbles.map((b) => ({ role: b.who === "you" ? "user" : "assistant", content: b.text }));
    setBubbles((b) => [...b, { who: "you", text }]);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, date: SIM_DATE, events, history, pending, lastChange }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      // detect calendar changes for the flash animation
      if (data.events) {
        const before = new Map(events.map((e) => [e.id, sig(e)]));
        const nowChanged = new Set<string>();
        for (const e of data.events as GEvent[]) {
          if (e.id && before.get(e.id) !== sig(e)) nowChanged.add(e.id);
        }
        setEvents(data.events);
        if (nowChanged.size) {
          setChanged(nowChanged);
          setTimeout(() => setChanged(new Set()), 1800);
        }
      }
      setPending(data.pending ?? null);
      if ("lastChange" in data) setLastChange(data.lastChange);
      setBubbles((b) => [...b, { who: "them", text: data.reply }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // group windowed (today-forward) events by day, like the engine Stanley sees
  const visible = events.filter((e) => startDay(e) >= "2026-06-12");
  const byDay = new Map<string, GEvent[]>();
  for (const e of visible) {
    const d = startDay(e);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(e);
  }
  const days = [...byDay.keys()].sort().slice(0, 12);

  return (
    <main className="demo">
      <div className="demo-head">
        <div className="brand">
          <span className="crest sm" aria-hidden="true">S</span>
          <span className="brandname">Stanley</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <ThemeToggle />
          <Link href="/" className="sms-line">← back</Link>
        </div>
      </div>
      <p className="demo-sub">
        A sample week (Friday, June 12, 2026). Real Stanley, real propose→confirm→write gate —
        approve a change and watch the calendar move. Nothing here is saved.
      </p>

      <div className="demo-grid">
        {/* chat */}
        <section className="phone">
          <div className="phone-bar">
            <Bear size={22} className="avatar-bear" /> Stanley
          </div>
          <div className="stream" ref={streamRef}>
            {bubbles.map((b, i) => (
              <div key={i} className={`bubble ${b.who}`}>{b.text}</div>
            ))}
            {pending && !loading && (
              <div className="gate">⏳ awaiting your reply — “Y” to confirm, “no” to leave it</div>
            )}
            {loading && <div className="bubble them typing">…</div>}
          </div>

          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={pending ? "Reply Y to confirm…" : "Text Stanley…"}
              disabled={loading}
            />
            <button className="send" type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
          <div className="chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" disabled={loading} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* live calendar */}
        <section className="cal">
          <h2>Calendar</h2>
          <p className="when">primary · America/New_York</p>
          {error && <p className="error">{error}</p>}
          {days.map((d) => (
            <div className="day" key={d}>
              <div className="day-label">{labelFmt.format(new Date(d + "T12:00:00Z"))}</div>
              {byDay
                .get(d)!
                .sort((a, b) =>
                  isAllDay(a) === isAllDay(b)
                    ? (a.start?.dateTime ?? a.start?.date ?? "").localeCompare(b.start?.dateTime ?? b.start?.date ?? "")
                    : isAllDay(a)
                      ? -1
                      : 1,
                )
                .map((e, i) => (
                  <div
                    key={i}
                    className={`evt ${isTransit(e) ? "transit" : ""} ${isAllDay(e) ? "allday" : ""} ${
                      e.id && changed.has(e.id) ? "changed" : ""
                    }`}
                  >
                    <span className="t">{timeLabel(e)}</span>
                    <span className="name">
                      {e.summary}
                      {e.location ? ` · ${e.location}` : ""}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
