"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// The Stanley Console — from the "Keeper of Days" design handoff. A fixed
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

const TAGS: Record<string, string> = {
  "ev-interview": "WORK",
  "ev-therapy": "HEALTH",
  "ev-dinner": "LOVE",
  "ev-standup": "WORK",
  "ev-design": "WORK",
  "ev-sync1": "WORK",
  "ev-sync2": "WORK",
  "ev-dentist": "HEALTH",
  "ev-mum": "FAMILY",
  "ev-stag": "MATES",
};
const FLAGGED = new Set(["ev-dinner", "ev-dentist"]);

const DAY_META = [
  { key: "2026-07-06", name: "MON" },
  { key: "2026-07-07", name: "TUE" },
  { key: "2026-07-08", name: "WED" },
  { key: "2026-07-09", name: "THU", badge: "SACRED 18:00" },
  { key: "2026-07-10", name: "FRI" },
  { key: "2026-07-11", name: "SAT", badge: "EMPTIED", rest: "Recovery. Stanley insisted." },
  { key: "2026-07-12", name: "SUN", badge: "PROTECTED", rest: "Nothing. Deliberately, gloriously nothing." },
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
function timeOf(e: GEvent): string {
  return e.start?.dateTime ? e.start.dateTime.slice(11, 16) : "—";
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
    setP1("approved");
    setTimeout(() => {
      say("Also — your anniversary is in 9 days. Might I hold next Friday evening before someone else claims it?");
      setP2("pending");
    }, 900);
  };
  const correctP1 = () => {
    say("not quite", "you");
    say("Understood — I’ve left Wednesday untouched and made a note: you like your chaos artisanal. My proposals will adjust.");
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

  const byDay = new Map<string, GEvent[]>();
  for (const e of events) {
    const d = dayOf(e);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(e);
  }
  for (const list of byDay.values())
    list.sort((a, b) => (a.start?.dateTime ?? a.start?.date ?? "").localeCompare(b.start?.dateTime ?? b.start?.date ?? ""));

  return (
    <div className="kd kdc">
      {/* top bar */}
      <div className="kdc-top">
        <Link href="/" className="kdc-top-brand">
          <div className="kdc-top-sq" />
          <span style={{ fontWeight: 700 }}>STANLEY</span>
          <span style={{ color: "var(--kd-dim)" }}>/ THE CONSOLE</span>
        </Link>
        <div className="kdc-top-right">
          <span>WEEK OF 6 JUL 2026</span>
          <span className="kdc-status">
            <span className="kdc-dot" />
            <span className={p1Done ? "breathing" : "tipping"}>
              {p1Done ? "THE WEEK IS BREATHING" : "THE WEEK IS TIPPING"}
            </span>
          </span>
        </div>
      </div>

      <div className="kdc-main">
        {/* left rail */}
        <div className="kdc-rail">
          <button className={`kdc-nav-item ${view === "week" ? "active" : ""}`} onClick={() => setView("week")}>
            THE WEEK
          </button>
          <button className={`kdc-nav-item ${view === "log" ? "active" : ""}`} onClick={() => setView("log")}>
            SERVICE LOG
          </button>
          <div className="kdc-rail-space" />
          <div className="kdc-stats">
            <span>
              LEANINGS LEARNED
              <br />
              <span className="kdc-stat-n">{12 + approvals}</span>
            </span>
            <br />
            <span>
              CORRECTIONS TAKEN
              <br />
              <span className="kdc-stat-n accent">{corrections}</span>
            </span>
          </div>
        </div>

        {/* center */}
        <div className="kdc-center">
          {view === "week" ? (
            <>
              <div className="kdc-center-head">
                <h1>The week</h1>
                <span className="sub">HE READS. HE PROPOSES. YOU DECIDE.</span>
              </div>
              <div className="kdc-week">
                {DAY_META.map((day) => {
                  const isWed = day.name === "WED";
                  const badge = isWed ? (p1Done ? "BREATHING" : "TIPPING") : (day.badge ?? "");
                  const badgeCls = isWed ? (p1Done ? "calm" : "accent") : "";
                  const evs = byDay.get(day.key) ?? [];
                  return (
                    <div key={day.name} className={`kdc-day ${isWed && !p1Done ? "tipping" : ""}`}>
                      <div className="kdc-day-head">
                        <span className="kdc-day-name">{day.name}</span>
                        <span className={`kdc-day-badge ${badgeCls}`}>{badge}</span>
                      </div>
                      {evs.map((e) => (
                        <div
                          key={`${e.id}:${sig(e)}`}
                          className={`kdc-ev ${e.id && FLAGGED.has(e.id) ? "flagged" : ""} ${e.id && struck.has(e.id) ? "struck" : ""}`}
                        >
                          <span className="t">{timeOf(e)}</span>
                          <span className="name">{e.summary}</span>
                          <span className="tag">{TAGS[e.id ?? ""] ?? "HELD"}</span>
                        </div>
                      ))}
                      {evs.length === 0 && day.rest && (
                        <div className="kdc-ev rest">
                          <span className="t">—</span>
                          <span className="name">{day.rest}</span>
                          <span className="tag">REST</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="kdc-center-head">
                <h1>Service log</h1>
                <span className="sub">THE CURRICULUM</span>
              </div>
              <div className="kdc-log">
                {serviceLog.map((log) => (
                  <div className="kdc-log-row" key={log.id}>
                    <span className="kdc-log-id">{log.id}</span>
                    <span className="kdc-log-body">
                      <span className="k">OBSERVED&nbsp;&nbsp;</span>
                      {log.observed}
                      <br />
                      <span className="k">PROPOSED&nbsp;&nbsp;</span>
                      <span className="prop">{log.proposed}</span>
                    </span>
                    <span className={`kdc-log-status ${log.status.toLowerCase()}`}>{log.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* the murmur */}
        <div className="kdc-murmur">
          <div className="kdc-murmur-head">
            <span>THE MURMUR</span>
            <span className="live">STANLEY IS READING</span>
          </div>
          <div className="kdc-thread" ref={threadRef}>
            {messages.map((m, i) => (
              <div key={i} className={`kdc-msg ${m.who}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="kdc-msg stanley">…</div>}
            {p1 === "pending" && (
              <div className="kdc-proposal">
                <span className="label">PROPOSAL · SVC-0121</span>
                <span className="text">Dentist → Friday 9am. The 1pm sync becomes an email. Nothing moves without your word.</span>
                <div className="btns">
                  <button className="kdc-approve" onClick={approveP1}>SAY THE WORD</button>
                  <button className="kdc-correct" onClick={correctP1}>NOT QUITE</button>
                </div>
              </div>
            )}
            {p2 === "pending" && (
              <div className="kdc-proposal">
                <span className="label">PROPOSAL · SVC-0122</span>
                <span className="text">Hold next Friday 7pm onward — “anniversary, do not book, do not ask.” I have restaurant thoughts, when you’re ready.</span>
                <div className="btns">
                  <button className="kdc-approve" onClick={approveP2}>SAY THE WORD</button>
                  <button className="kdc-correct" onClick={correctP2}>NOT QUITE</button>
                </div>
              </div>
            )}
            {apiPending && !loading && (
              <div className="kdc-proposal">
                <span className="label">PROPOSAL · {apiPending.svcId}</span>
                <span className="text">{apiPending.summary} Nothing moves without your word.</span>
                <div className="btns">
                  <button className="kdc-approve" onClick={() => send("yes please")}>SAY THE WORD</button>
                  <button className="kdc-correct" onClick={() => send("not quite")}>NOT QUITE</button>
                </div>
              </div>
            )}
          </div>
          {error && <div className="kdc-error">{error} — do try again.</div>}
          <div className="kdc-composer">
            <input
              className="kdc-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(draft);
              }}
              placeholder="a word in his ear…"
              disabled={loading}
            />
            <button className="kdc-send" onClick={() => send(draft)} disabled={loading || !draft.trim()}>
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
