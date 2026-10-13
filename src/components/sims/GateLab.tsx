"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hourly, makeDay, prettyPlate, statsAt, type Rider } from "@/sims/gate/day";
import { LabButton, useLabEnv, useOnScreen } from "./controls";

/*
  Top-down gate sim for Station Parking. The day comes from a port of the
  repo's full-day simulator; each bike crosses its gate's capture line at its
  entry or exit time, and the dashboard counts what the backend would.
*/

const INK = "#f2efe6";
const SAGE = "#a9bda4";
const BRASS = "#ddb06f";
const LINE = "rgba(242,239,230,0.16)";
const RED = "#e0775f";
const TEAL = "#7fc8c0";
const MONO = '"JetBrains Mono", ui-monospace, monospace';

const T0 = 6 * 60;
const T1 = 23.5 * 60;
const TRANSIT_S = 3.2; // real seconds a bike takes to cross the view
const LABEL_S = 2.2; // real seconds a read stays on screen
const SPEEDS = [3, 10, 30] as const;
const STAGES = ["detect", "track", "read", "vote", "merge", "event"] as const;

type Crossing = { r: Rider; t: number; dir: "IN" | "OUT"; gate: 0 | 1 };

const hhmm = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = Math.floor(m % 60);
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};
const rupees = (p: number) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;

/** One crossing's three frame reads, illustrating the vote (not real reader output). */
function frames(c: Crossing): { reads: string[]; result: string; note: string; tone: string } {
  const read = c.dir === "IN" ? c.r.entryRead : c.r.exitRead;
  const plate = c.r.plate;
  if (read === "UNREAD")
    return {
      reads: ["——", `${plate.slice(0, 2)}?${plate.slice(3, 5)}…`, "——"],
      result: "UNREAD",
      note: "no confident read → review queue",
      tone: RED,
    };
  if (read === "MISREAD") {
    const mis = (c.dir === "IN" ? c.r.entryMisread : c.r.exitMisread) ?? plate;
    return {
      reads: [mis, mis, plate],
      result: prettyPlate(mis),
      note: `matched to ${prettyPlate(plate)} (confusion-aware)`,
      tone: BRASS,
    };
  }
  const blur = plate.replace(/[0O]/, (m) => (m === "0" ? "O" : "0")).replace(/8/, "B");
  return {
    reads: [plate, blur === plate ? plate : blur, plate],
    result: prettyPlate(plate),
    note: "",
    tone: INK,
  };
}

export function GateLab() {
  const { ref, seen, active } = useOnScreen<HTMLDivElement>();
  const env = useLabEnv();
  const canvas = useRef<HTMLCanvasElement>(null);
  const day = useMemo(() => makeDay(), []);
  const hours = useMemo(() => hourly(day), [day]);
  const crossings = useMemo(() => {
    const out: Crossing[] = [];
    for (const r of day) {
      out.push({ r, t: r.entry, dir: "IN", gate: r.entryGate });
      out.push({ r, t: r.exit, dir: "OUT", gate: r.exitGate });
    }
    return out.sort((a, b) => a.t - b.t);
  }, [day]);

  const [clock, setClock] = useState(8 * 60 + 15); // start in the morning peak
  const [playing, setPlaying] = useState<boolean | null>(null);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(3);
  const [pipeline, setPipeline] = useState(false);
  const tRef = useRef(clock);
  const run = playing ?? false;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced motion is read after mount
    if (env.ready && playing === null) setPlaying(!env.reduced);
  }, [env.ready, env.reduced, playing]);

  const stats = useMemo(() => statsAt(day, clock), [day, clock]);
  const log = useMemo(() => {
    const i = crossings.findIndex((c) => c.t > clock);
    const end = i < 0 ? crossings.length : i;
    return crossings.slice(Math.max(0, end - 6), end).reverse();
  }, [crossings, clock]);

  const draw = useCallback(() => {
    const cv = canvas.current;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.clientWidth;
    const Hh = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(Hh * dpr);
    }
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hh);
    const t = tRef.current;
    const simPerReal = speed / 60; // sim minutes per real second
    const lineY = Hh * 0.56;
    const roadW = Math.min(150, W * 0.3);
    const gx = [W * 0.28, W * 0.72];
    const small = W < 520;

    // Lot boundary and labels
    ctx.font = `10px ${MONO}`;
    ctx.fillStyle = SAGE;
    ctx.textAlign = "left";
    ctx.fillText("LOT", 12, 18);
    ctx.fillText("STATION ROAD", 12, Hh - 10);
    ctx.strokeStyle = "rgba(242,239,230,0.3)";
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, Hh * 0.2);
    for (const x of gx) {
      ctx.lineTo(x - roadW / 2 - 8, Hh * 0.2);
      ctx.moveTo(x + roadW / 2 + 8, Hh * 0.2);
    }
    ctx.lineTo(W, Hh * 0.2);
    ctx.stroke();

    gx.forEach((x, g) => {
      // Road and lane divider
      ctx.fillStyle = "rgba(10,28,20,0.55)";
      ctx.fillRect(x - roadW / 2, 0, roadW, Hh);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, Hh);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = SAGE;
      ctx.textAlign = "center";
      ctx.fillText(`GATE ${g + 1}`, x, Hh * 0.2 - 8);
      ctx.fillText("↑ in", x - roadW / 4, Hh - 10);
      ctx.fillText("out ↓", x + roadW / 4, Hh - 10);
      // Camera on its pole
      ctx.fillStyle = INK;
      ctx.fillRect(x + roadW / 2 + 4, lineY - 6, 10, 12);
      ctx.fillStyle = BRASS;
      ctx.fillRect(x + roadW / 2 + 2, lineY - 2, 3, 4);
    });

    // Bikes near their crossing time
    const windowMin = TRANSIT_S * simPerReal * 0.6;
    const labelMin = LABEL_S * simPerReal;
    let lo = 0;
    let hi = crossings.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (crossings[mid].t < t - Math.max(windowMin, labelMin)) lo = mid + 1;
      else hi = mid;
    }
    const flashes = [0, 0];
    const labels: { c: Crossing; x: number; y: number; age: number }[] = [];
    for (let i = lo; i < crossings.length && crossings[i].t <= t + windowMin; i++) {
      const c = crossings[i];
      const frac = (t - c.t) / (TRANSIT_S * simPerReal); // 0 at the capture line
      const lane = c.dir === "IN" ? -1 : 1;
      const x = gx[c.gate] + lane * roadW * 0.25 + ((c.r.id % 3) - 1) * roadW * 0.07;
      const y = lineY + (c.dir === "IN" ? -1 : 1) * frac * Hh * 0.9;
      const age = (t - c.t) / simPerReal; // real seconds since crossing
      if (age >= 0 && age < 0.35) flashes[c.gate] = Math.max(flashes[c.gate], 1 - age / 0.35);
      if (Math.abs(frac) < 0.6) drawBike(ctx, x, y, c.dir === "IN" ? -1 : 1, c.r.kind === "PASS");
      if (age >= 0 && age < LABEL_S) labels.push({ c, x, y, age });
    }
    // Capture lines, flashing on each crossing
    gx.forEach((x, g) => {
      ctx.strokeStyle = flashes[g]
        ? `rgba(221,176,111,${0.5 + flashes[g] * 0.5})`
        : "rgba(221,176,111,0.45)";
      ctx.lineWidth = flashes[g] ? 2 + flashes[g] * 2 : 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x - roadW / 2, lineY);
      ctx.lineTo(x + roadW / 2, lineY);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Boxes on every bike just read; the text card only for the latest read per lane.
    const latest = new Map<string, (typeof labels)[number]>();
    for (const l of labels) {
      const k = `${l.c.gate}${l.c.dir}`;
      const prev = latest.get(k);
      if (!prev || l.age < prev.age) latest.set(k, l);
    }
    for (const { c, x, y, age } of labels) {
      const f = frames(c);
      ctx.globalAlpha = Math.max(0, Math.min(1, (LABEL_S - age) / 0.5));
      if (Math.abs(y - lineY) < Hh * 0.45) {
        ctx.strokeStyle = SAGE;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 12, y - 22, 24, 44);
        const py = c.dir === "IN" ? y + 14 : y - 20;
        ctx.strokeStyle = f.tone;
        ctx.strokeRect(x - 7, py, 14, 6);
      }
      ctx.globalAlpha = 1;
    }
    const cards = [...latest.values()];
    if (small) {
      // Phones: one caption for the newest read, along the bottom.
      const l = cards.sort((a, b) => a.age - b.age)[0];
      if (l) cards.splice(0, cards.length, l);
    }
    for (const { c, age } of cards) {
      const f = frames(c);
      ctx.globalAlpha = Math.max(0, Math.min(1, (LABEL_S - age) / 0.5));
      const left = c.gate === 0;
      const bx = small ? 12 : left ? gx[0] - roadW / 2 - 14 : gx[1] + roadW / 2 + 24;
      const by = small ? Hh * 0.2 + 40 : c.dir === "IN" ? lineY - 92 : lineY + 22;
      ctx.textAlign = small || !left ? "left" : "right";
      ctx.font = `600 12px ${MONO}`;
      ctx.fillStyle = f.tone;
      ctx.fillText(f.result, bx, by);
      ctx.font = `10px ${MONO}`;
      ctx.fillStyle = SAGE;
      const kind = c.r.kind === "PASS" ? "pass" : c.r.kind === "ONETIME" ? "one-time" : "walk-in";
      ctx.fillText(`${c.dir} · gate ${c.gate + 1} · ${kind}`, bx, by + 14);
      let yy = by + 28;
      if (f.note) {
        ctx.fillText(f.note, bx, yy);
        yy += 14;
      }
      if (pipeline) {
        const stage = Math.min(STAGES.length - 1, Math.floor(age / 0.3));
        ctx.fillStyle = INK;
        ctx.fillText(
          `track #${c.r.id} · frames ${f.reads.map((r) => r.slice(-4)).join(" ")}`,
          bx,
          yy,
        );
        ctx.fillStyle = BRASS;
        ctx.fillText(`→ ${STAGES[stage]}`, bx, yy + 14);
      }
      ctx.globalAlpha = 1;
    }

    // Pipeline strip
    if (pipeline) {
      const recent = labels.length ? Math.min(...labels.map((l) => l.age)) : 99;
      const stage = recent < 99 ? Math.min(STAGES.length - 1, Math.floor(recent / 0.3)) : -1;
      ctx.font = `10px ${MONO}`;
      ctx.textAlign = "left";
      let x = small ? 50 : W * 0.5 - 170;
      const y = Hh * 0.2 + 22;
      STAGES.forEach((s, i) => {
        ctx.fillStyle = i === stage ? BRASS : "rgba(169,189,164,0.75)";
        ctx.fillText(s, x, y);
        x += ctx.measureText(s).width + 6;
        if (i < STAGES.length - 1) {
          ctx.fillStyle = "rgba(169,189,164,0.5)";
          ctx.fillText("→", x, y);
          x += 14;
        }
      });
    }
  }, [crossings, pipeline, speed]);

  // Clock loop; React state updates ~8×/s for the dashboard, the canvas every frame.
  useEffect(() => {
    if (!active || !run) {
      draw();
      return;
    }
    let frame = 0;
    let last = performance.now();
    let sinceUi = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      let t = tRef.current + (dt * speed) / 60;
      if (t > T1) t = T0;
      tRef.current = t;
      draw();
      sinceUi += dt;
      if (sinceUi > 0.12) {
        sinceUi = 0;
        setClock(t);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, run, speed, draw]);

  useEffect(() => {
    if (!seen) return;
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [seen, draw]);

  const scrub = (m: number) => {
    tRef.current = m;
    setClock(m);
    draw();
  };
  const maxH = Math.max(...hours.map((h) => Math.max(h.in, h.out)));

  return (
    <div ref={ref} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="relative self-start overflow-hidden rounded-md border border-line bg-mat-shade/60 shadow-[var(--shadow-rest)]">
          <canvas
            ref={canvas}
            role="img"
            aria-label="Top-down view of two gates: bikes cross the camera line and their plate reads appear"
            className="block h-[25rem] w-full sm:h-[28rem]"
          />
          <p className="border-t border-line px-3 py-2 font-mono text-[0.625rem] text-sage">
            Synthetic plates. Teal bikes hold monthly passes.
          </p>
          <div className="absolute top-3 right-3 flex gap-1.5">
            <LabButton onClick={() => setPipeline((p) => !p)} pressed={pipeline}>
              Show pipeline
            </LabButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 self-start lg:grid-cols-1" aria-live="off">
          <Stat
            label="Inside now"
            value={stats.inside.toLocaleString("en-IN")}
            sub={`${stats.passInside} on passes`}
          />
          <Stat
            label="Sessions"
            value={`${stats.entered.toLocaleString("en-IN")} in`}
            sub={`${stats.exited.toLocaleString("en-IN")} closed`}
          />
          <Stat
            label="UPI today"
            value={rupees(stats.upiPaise)}
            sub="settled at exit"
            tone={TEAL}
          />
          <Stat
            label="Cash today"
            value={rupees(stats.cashPaise)}
            sub="counted per worker"
            tone={BRASS}
          />
          <div className="col-span-2 rounded-[4px] border border-line bg-surface/70 p-3 lg:col-span-1">
            <p className="font-mono text-[0.625rem] text-sage uppercase">Last events</p>
            <ul className="mt-2 space-y-1 font-mono text-[0.6875rem]">
              {log.map((c) => {
                const read = c.dir === "IN" ? c.r.entryRead : c.r.exitRead;
                return (
                  <li key={`${c.r.id}${c.dir}`} className="flex justify-between gap-2">
                    <span className="text-sage">{hhmm(c.t)}</span>
                    <span className={read === "UNREAD" ? "text-[#f0a08c]" : "text-ink"}>
                      {read === "UNREAD" ? "review" : prettyPlate(c.r.plate)}
                    </span>
                    <span className="text-sage">{c.dir}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 font-mono text-[0.625rem] text-sage">
              {stats.review} reads in the review queue
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-line bg-surface/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-sm text-ink tabular-nums">
            {hhmm(clock)} <span className="text-sage">· time of day</span>
          </p>
          <div className="flex items-center gap-1.5">
            {SPEEDS.map((s) => (
              <LabButton key={s} onClick={() => setSpeed(s)} pressed={speed === s}>
                {s}×
              </LabButton>
            ))}
            <LabButton onClick={() => setPlaying(!run)} pressed={!run}>
              {run ? "Pause" : "Play"}
            </LabButton>
          </div>
        </div>
        <div className="relative mt-3">
          <div className="flex h-16 items-end gap-px" aria-hidden>
            {hours.map((h) => (
              <div key={h.hour} className="flex h-full flex-1 items-end gap-px">
                <div
                  className="flex-1 rounded-t-[1px] bg-[#7fc8c0]/55"
                  style={{ height: `${(h.in / maxH) * 100}%` }}
                />
                <div
                  className="flex-1 rounded-t-[1px] bg-[#ddb06f]/55"
                  style={{ height: `${(h.out / maxH) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <input
            type="range"
            min={5 * 60}
            max={24 * 60}
            step={1}
            value={clock}
            onChange={(e) => scrub(Math.min(T1, Math.max(T0, Number(e.target.value))))}
            aria-label="Time of day"
            aria-valuetext={hhmm(clock)}
            className="bench-range mt-1 w-full"
          />
          <div className="mt-1 flex justify-between font-mono text-[0.625rem] text-sage">
            <span>05:00</span>
            <span>
              <span className="text-[#7fc8c0]">■</span> entries/h{" "}
              <span className="ml-2 text-brass">■</span> exits/h
            </span>
            <span>24:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = INK,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: string;
}) {
  return (
    <div className="rounded-[4px] border border-line bg-surface/70 p-3">
      <p className="font-mono text-[0.625rem] text-sage uppercase">{label}</p>
      <p className="mt-1 font-mono text-lg tabular-nums" style={{ color: tone }}>
        {value}
      </p>
      <p className="text-[0.6875rem] text-sage">{sub}</p>
    </div>
  );
}

function drawBike(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, pass: boolean) {
  ctx.save();
  ctx.translate(x, y);
  if (dir > 0) ctx.rotate(Math.PI);
  // Wheels
  ctx.fillStyle = "#111";
  ctx.fillRect(-2.5, -19, 5, 9);
  ctx.fillRect(-2.5, 10, 5, 9);
  // Body
  ctx.fillStyle = pass ? "#7fc8c0" : "#cfd6c8";
  ctx.beginPath();
  ctx.roundRect(-5, -12, 10, 24, 4);
  ctx.fill();
  // Handlebar and rider
  ctx.fillStyle = "#e9e5d8";
  ctx.fillRect(-9, -11, 18, 2.5);
  ctx.fillStyle = "#2c3a33";
  ctx.beginPath();
  ctx.arc(0, -1, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
