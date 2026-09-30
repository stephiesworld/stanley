"use client";

import { useEffect, useRef, type CSSProperties } from "react";

// The week, drawn to scale: seven day columns on an hour grid. Shared by the
// landing hero (TippingWeek) and the /demo console so both show the same
// calendar. Blocks are positioned with CSS vars (see .wk-ev in week.css);
// the tipping day gets a tint, and blocks with `tilt` lean over until an
// ancestor has .wk-calm.

export type Kind = "work" | "people" | "health" | "family" | "big" | "held" | "stanley";

export interface Block {
  key: string;
  day: number; // 0 = Mon
  start: number; // hour, decimals allowed
  len: number; // hours
  title: string;
  sub?: string;
  kind: Kind;
  tilt?: [number, number]; // [deg, px] while tipping
  moved?: boolean;
  gone?: boolean;
  lane?: number;
  lanes?: number;
}

export interface DayHead {
  label: string;
  tag?: string;
  warn?: boolean; // amber while tipping, green once .wk-calm
}

// Overlapping blocks in a day share the column side by side.
export function assignLanes(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (let d = 0; d < 7; d++) {
    const day = blocks.filter((b) => b.day === d).sort((a, b) => a.start - b.start);
    let cluster: Block[] = [];
    let clusterEnd = -1;
    const flush = () => {
      const laneEnds: number[] = [];
      const placed = cluster.map((b) => {
        let lane = laneEnds.findIndex((end) => end <= b.start);
        if (lane === -1) lane = laneEnds.length;
        laneEnds[lane] = b.start + b.len;
        return { ...b, lane };
      });
      out.push(...placed.map((b) => ({ ...b, lanes: laneEnds.length })));
      cluster = [];
    };
    for (const b of day) {
      if (cluster.length && b.start >= clusterEnd) flush();
      cluster.push(b);
      clusterEnd = Math.max(clusterEnd, b.start + b.len);
    }
    if (cluster.length) flush();
  }
  return out;
}

export default function WeekGrid({
  days,
  blocks,
  from = 7,
  to = 22,
  hour = 34,
  tipDay,
}: {
  days: DayHead[];
  blocks: Block[];
  from?: number;
  to?: number;
  hour?: number; // px per hour
  tipDay?: number;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  // On narrow screens the week scrolls sideways; start it on the tipping day
  // so the trouble (and where things move to) is in view.
  useEffect(() => {
    const el = scroller.current;
    if (el && tipDay !== undefined && el.scrollWidth > el.clientWidth)
      el.scrollLeft = ((el.scrollWidth - 44) * tipDay) / 7;
  }, [tipDay]);

  const hours: number[] = [];
  for (let h = from; h <= to; h += 3) hours.push(h);
  if (hours[hours.length - 1] !== to) hours.push(to);

  const vars = { "--wk-h": `${hour}px`, "--wk-from": from, "--wk-span": to - from } as CSSProperties;

  return (
    <div className="wk-scroll" ref={scroller}>
      <div className="wk-week" style={vars}>
        <div className="wk-heads">
          {days.map((d) => (
            <div key={d.label}>
              {d.label}
              {d.tag && <span className={`wk-tag${d.warn ? " warn" : ""}`}>{d.tag}</span>}
            </div>
          ))}
        </div>
        <div className="wk-hours" aria-hidden="true">
          {hours.map((h) => (
            <span key={h} style={{ "--s": h } as CSSProperties}>{h}:00</span>
          ))}
        </div>
        <div className="wk-grid">
          {tipDay !== undefined && <div className="wk-tint" style={{ "--d": tipDay } as CSSProperties} />}
          {assignLanes(blocks).map((b) => {
            const style = {
              "--d": b.day,
              "--s": Math.max(b.start, from),
              "--len": Math.min(b.len, to - Math.max(b.start, from)),
              "--lane": b.lane ?? 0,
              "--lanes": b.lanes ?? 1,
              ...(b.tilt ? { "--r": `${b.tilt[0]}deg`, "--x": `${b.tilt[1]}px` } : {}),
            } as CSSProperties;
            const cls = ["wk-ev", b.kind, b.len < 1 && "short", b.tilt && "tip", b.moved && "moved", b.gone && "gone"]
              .filter(Boolean)
              .join(" ");
            return (
              <div className={cls} style={style} key={b.key} title={b.title}>
                <b>{b.title}</b>
                {b.sub && <small>{b.sub}</small>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function WeekLegend() {
  return (
    <div className="wk-legend">
      <span><i className="wk-key work" />Work</span>
      <span><i className="wk-key people" />People</span>
      <span><i className="wk-key health" />Health</span>
      <span><i className="wk-key family" />Family</span>
      <span><i className="wk-key big" />Big days</span>
      <span><i className="wk-key held" />Held by Stanley</span>
    </div>
  );
}
