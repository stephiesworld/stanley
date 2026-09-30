"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import WeekGrid, { WeekLegend, type Block, type Kind } from "../week-grid";

// The Stanley Console, in the "shape of the week" look (same week grid as
// the landing, see week-grid.tsx). A fixed
// sample week (6–12 Jul 2026) rendered from a browser-owned mock calendar.
// Two scripted proposals (SVC-0121/0122) carry the choreography; everything
// typed into the murmur goes to the real Stanley brain at /api/demo, and any
// proposal he extracts comes back as a card behind the same propose→confirm→
// write gate the live bot runs. Nothing is stored.

const SIM_DATE = "2026-07-06T08:00:00-04:00";

interface GEvent {
  id?: string | null;
  summary?: string | null;
  start?: { date?: string | null; dateTime?: string | null } | null;
  end?: { date?: string | null; dateTime?: string | null } | null;
}
interface Msg {
  who: "stanley" | "you";
  text: string;
}
interface LogEntry {
  id: string;
  observed: string;
  proposed: string;
  status: "APPROVED" | "CORRECTED" | "PENDING";
}
interface ApiPending {
  action: Record<string, unknown>;
  summary: string;
  source: string;
  svcId: string;
}
type ScriptState = "pending" | "approved" | "corrected" | "hidden";

const gev = (id: string, day: string, start: string, end: string, summary: string): GEvent => ({
  id,
  summary,
  start: { dateTime: `2026-07-${day}T${start}:00-04:00` },
  end: { dateTime: `2026-07-${day}T${end}:00-04:00` },
});

const SEED_EVENTS: GEvent[] = [
  gev("ev-interview", "06", "09:00", "10:00", "Interview — the job you almost didn’t apply for"),
  gev("ev-therapy", "06", "14:00", "15:00", "Therapy — the standing one"),
  gev("ev-dinner", "07", "19:30", "21:30", "Dinner w/ R. — the good tapas place"),
  gev("ev-standup", "08", "09:00", "09:15", "Stand-up"),
  gev("ev-design", "08", "11:00", "12:00", "Design review"),
  gev("ev-sync1", "08", "13:00", "13:30", "Quick sync"),
  gev("ev-sync2", "08", "15:00", "15:30", "Quick sync, the sequel"),
  gev("ev-dentist", "08", "16:30", "17:30", "Dentist"),
  gev("ev-mum", "09", "18:00", "18:30", "Call mum — immovable"),
  gev("ev-stag", "10", "20:00", "23:30", "Dan’s stag — you are the best man, act like it"),
];

// Seed events by kind; anything Stanley adds through /api/demo is "stanley".
const KINDS: Record<string, Kind> = {
  "ev-interview": "work",
  "ev-therapy": "health",
  "ev-dinner": "people",
  "ev-standup": "work",
  "ev-design": "work",
  "ev-sync1": "work",
  "ev-sync2": "work",
  "ev-dentist": "health",
  "ev-mum": "family",
  "ev-stag": "big",
};
// How Wednesday's pile leans while it's tipping: [deg, px].
const TILTS: [number, number][] = [[-3, 0], [2.5, 3], [-1.5, 0], [3, -2], [-2.5, 4], [2, 0]];

const DAY_META = [
  { key: "2026-07-06", label: "Mon 6" },
  { key: "2026-07-07", label: "Tue 7" },
  { key: "2026-07-08", label: "Wed 8" },
  { key: "2026-07-09", label: "Thu 9", tag: "Sacred 18:00" },
  { key: "2026-07-10", label: "Fri 10" },
  { key: "2026-07-11", label: "Sat 11", tag: "Emptied", rest: "Recovery. Stanley insisted." },
  { key: "2026-07-12", label: "Sun 12", tag: "Protected", rest: "Nothing. Deliberately." },
];

const BASE_LOG: LogEntry[] = [
  { id: "SVC-0117", observed: "You cancel every Friday-morning meeting, eventually.", proposed: "Stop booking them. Fridays open at noon.", status: "APPROVED" },
  { id: "SVC-0118", observed: "Two big nights, back to back, twice a month.", proposed: "A buffer evening after each. Held, not booked.", status: "APPROVED" },
  { id: "SVC-0119", observed: "Mum’s call drifts when work runs late.", proposed: "Thursday 6pm becomes immovable.", status: "CORRECTED" },
  { id: "SVC-0120", observed: "The check-up has moved four times.", proposed: "It moves once more — to tomorrow morning.", status: "PENDING" },
];

const SEED_MSGS: Msg[] = [
  { who: "stanley", text: "Good morning. I’ve read the week. Mostly admirable. One concern." },
  { who: "stanley", text: "Wednesday is attempting to have four meetings and a dentist. This is ambitious in the way that icebergs are ambitious." },
];

function dayOf(e: GEvent): string {
  return e.start?.date ?? e.start?.dateTime?.slice(0, 10) ?? "";
}
function hourOf(t?: { dateTime?: string | null } | null): number | null {
  const hm = t?.dateTime?.slice(11, 16);
  return hm ? Number(hm.slice(0, 2)) + Number(hm.slice(3)) / 60 : null;
}
function sig(e: GEvent): string {
  return `${e.start?.dateTime ?? e.start?.date}|${e.summary}`;
}
const DECLINE = /^(no|nope|nah|not quite|leave it|don'?t)\b/i;

export default function Console() {
  const [view, setView] = useState<"week" | "log">("week");
  const [p1, setP1] = useState<ScriptState>("pending");
  const [p2, setP2] = useState<ScriptState>("hidden");
  const [events, setEvents] = useState<GEvent[]>(SEED_EVENTS);
  const [struck, setStruck] = useState<Set<string>>(new Set());
  const [moved, setMoved] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Msg[]>(SEED_MSGS);
  const [extraLog, setExtraLog] = useState<LogEntry[]>([]);
  const [apiPending, setApiPending] = useState<ApiPending | null>(null);
  const [lastChange, setLastChange] = useState<unknown>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [svcN, setSvcN] = useState(123);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, apiPending, p1, p2, loading]);

  const say = (text: string, who: Msg["who"] = "stanley") =>
    setMessages((m) => [...m, { who, text }]);

  // ── scripted choreography (SVC-0121 / SVC-0122) ─────────────────────────
  const approveP1 = () => {
    say("yes please", "you");
    say("Done. Dentist to Friday 9am. The 1pm sync agreed to become an email, as most syncs should. Wednesday breathes again.");
    setEvents((evs) =>
      evs.map((e) => {
        if (e.id === "ev-dentist")
          return {
            ...e,
            summary: "Dentist (moved by Stanley, with permission)",
            start: { dateTime: "2026-07-10T09:00:00-04:00" },
            end: { dateTime: "2026-07-10T10:00:00-04:00" },
          };
        if (e.id === "ev-sync1") return { ...e, summary: "Quick sync → became an email" };
        return e;
      }),
    );
    setStruck((s) => new Set(s).add("ev-sync1"));
    setMoved((s) => new Set(s).add("ev-dentist"));
    setP1("approved");
    setTimeout(() => {
      say("Also — your anniversary is in 9 days. Might I hold next Friday evening before someone else claims it?");
      setP2("pending");
    }, 900);
  };
  const correctP1 = () => {
    say("not quite", "you");
    say("Understood. I’ve left Wednesday untouched and made a note: you like your chaos artisanal. My proposals will adjust.");
    setP1("corrected");
    setP2("pending");
  };
  const approveP2 = () => {
    say("yes please", "you");
    setP2("approved");
    setTimeout(() => say("Held. It will appear in the ledger as “the good kind of immovable.”"), 700);
  };
  const correctP2 = () => {
    say("not quite", "you");
    setP2("corrected");
    setTimeout(() => say("Of course. I’ll merely hover meaningfully near the date."), 700);
  };

  // ── the real brain: /api/demo ────────────────────────────────────────────
  async function send(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;
    setLoading(true);
    setError("");
    setDraft("");
    const history = messages.map((m) => ({ role: m.who === "you" ? "user" : "assistant", content: m.text }));
    say(msg, "you");
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          date: SIM_DATE,
          events,
          history,
          pending: apiPending?.action ?? null,
          lastChange,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      if (data.events) setEvents(data.events);
      if ("lastChange" in data) setLastChange(data.lastChange);

      // resolve an armed proposal → service-log entry
      if (apiPending && data.wrote) {
        setExtraLog((l) => [{ id: apiPending.svcId, observed: apiPending.source, proposed: apiPending.summary, status: "APPROVED" }, ...l]);
      } else if (apiPending && !data.pending && DECLINE.test(msg)) {
        setExtraLog((l) => [{ id: apiPending.svcId, observed: apiPending.source, proposed: apiPending.summary, status: "CORRECTED" }, ...l]);
      }

      if (data.pending && data.pendingSummary) {
        const svcId = `SVC-0${svcN}`;
        setSvcN((n) => n + 1);
        setApiPending({ action: data.pending, summary: data.pendingSummary, source: msg, svcId });
      } else {
        setApiPending(null);
      }
      say(data.reply);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // ── derived state ─────────────────────────────────────────────────────────
  const p1Done = p1 === "approved";

  const serviceLog: LogEntry[] = [...extraLog];
  if (p2 === "approved" || p2 === "corrected")
    serviceLog.push({ id: "SVC-0122", observed: "Anniversary in 9 days. Friday evening exposed.", proposed: "Hold it. The good kind of immovable.", status: p2.toUpperCase() as LogEntry["status"] });
  if (p1 !== "pending")
    serviceLog.push({ id: "SVC-0121", observed: "Wednesday: four meetings and a dentist.", proposed: "Dentist → Friday. One sync → email.", status: p1.toUpperCase() as LogEntry["status"] });
  serviceLog.push(...BASE_LOG);

  const approvals = serviceLog.filter((l) => l.status === "APPROVED").length;
  const corrections = serviceLog.filter((l) => l.status === "CORRECTED").length;

  const blocks: Block[] = [];
  DAY_META.forEach((day, d) => {
    const evs = events
      .filter((e) => dayOf(e) === day.key)
      .sort((a, b) => (a.start?.dateTime ?? "").localeCompare(b.start?.dateTime ?? ""));
    evs.forEach((e, i) => {
      const start = hourOf(e.start) ?? 8; // all-day events sit at the top
      const end = hourOf(e.end);
      const kind = KINDS[e.id ?? ""] ?? "stanley";
      blocks.push({
        key: `${e.id}:${sig(e)}`,
        day: d,
        start,
        // floor at 45 min so a 15-minute stand-up is still legible
        len: end !== null && end > start ? Math.max(end - start, 0.75) : 1,
        title: e.summary ?? "",
        sub: end !== null && end - start < 1 ? undefined : e.start?.dateTime ? e.start.dateTime.slice(11, 16) : "all day",
        kind,
        tilt: d === 2 && !p1Done ? TILTS[i % TILTS.length] : undefined,
        moved: !!e.id && moved.has(e.id),
        gone: !!e.id && struck.has(e.id),
      });
    });
    if (evs.length === 0 && day.rest)
      blocks.push({ key: `rest-${d}`, day: d, start: 8, len: 16, title: day.rest, kind: "held" });
  });
  const days = DAY_META.map((day, d) =>
    d === 2 ? { label: day.label, tag: p1Done ? "Breathing" : "Tipping", warn: true } : day,
  );

  const proposal = (id: string, text: string, yes: () => void, no: () => void) => (
    <div className="wkc-proposal">
      <span className="label">Proposal · {id}</span>
      <span className="text">{text}</span>
      <div className="wk-btns">
        <button className="yes" onClick={yes}>Say the word</button>
        <button onClick={no}>Not quite</button>
      </div>
    </div>
  );

  return (
    <div className={`wk wkc ${p1Done ? "wk-calm" : "wk-tipping"}`}>
      <header className="wkc-top">
        <Link href="/" className="wk-logo">
          <i aria-hidden="true">
            <b /><b /><b /><b /><b /><b /><b />
          </i>
          Stanley
        </Link>
        <div className="wkc-tabs" role="tablist">
          <button role="tab" aria-selected={view === "week"} onClick={() => setView("week")}>The week</button>
          <button role="tab" aria-selected={view === "log"} onClick={() => setView("log")}>Service log</button>
        </div>
        <div className="wk-status">
          <i />
          <span>Week of 6 July · {p1Done ? "The week is breathing" : "Wednesday is tipping"}</span>
        </div>
      </header>

      <div className="wkc-main">
        <main className="wkc-center">
          <div className="wkc-head">
            <h1>{view === "week" ? "The week" : "Service log"}</h1>
            <p>
              {12 + approvals} preferences learned · {corrections} {corrections === 1 ? "correction" : "corrections"} taken
            </p>
          </div>
          {view === "week" ? (
            <>
              <WeekGrid days={days} blocks={blocks} from={8} to={24} hour={34} tipDay={2} />
              <WeekLegend />
            </>
          ) : (
            <div className="wkc-log">
              {serviceLog.map((log) => (
                <div className="wkc-log-row" key={log.id}>
                  <span className="wkc-log-id">{log.id}</span>
                  <div className="wkc-log-body">
                    <p><span className="k">Noticed</span>{log.observed}</p>
                    <p><span className="k">Proposed</span>{log.proposed}</p>
                  </div>
                  <span className={`wkc-pill ${log.status.toLowerCase()}`}>
                    {log.status.charAt(0) + log.status.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>

        <aside className="wkc-chat">
          <div className="wkc-chat-head">
            <span className="wk-who">Stanley</span>
            <span>reading your week</span>
          </div>
          <div className="wkc-thread" ref={threadRef} aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`wkc-msg ${m.who}${m.who === "stanley" ? " wk-voice" : ""}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="wkc-msg stanley wkc-typing">…</div>}
            {p1 === "pending" &&
              proposal("SVC-0121", "Dentist to Friday 9am. The 1pm sync becomes an email. Nothing moves without your word.", approveP1, correctP1)}
            {p2 === "pending" &&
              proposal("SVC-0122", "Hold next Friday from 7pm: anniversary, do not book, do not ask. I have restaurant thoughts, when you’re ready.", approveP2, correctP2)}
            {apiPending && !loading &&
              proposal(apiPending.svcId, `${apiPending.summary} Nothing moves without your word.`, () => send("yes please"), () => send("not quite"))}
          </div>
          {error && <div className="wkc-error">{error}. Do try again.</div>}
          <form
            className="wkc-composer"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <input
              className="wkc-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="A word in his ear…"
              aria-label="Message Stanley"
              disabled={loading}
            />
            <button className="wkc-send" type="submit" disabled={loading || !draft.trim()} aria-label="Send">
              →
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
