"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TowerDrive } from "@/three/TowerScene";
import { CoolingTowerDrawing } from "@/components/bench/CoolingTowerDrawing";
import { useEngaged } from "@/lib/engaged";
import { mulberry } from "@/sims/gate/day";
import {
  analyse,
  CT01,
  DEFAULT_TARIFF,
  sample,
  THRESHOLDS,
  type Category,
} from "@/sims/tower/model";
import { drawPlot } from "./plot";
import { Figure, LabButton, Slider, useLabEnv, useOnScreen } from "./controls";

const TowerScene = dynamic(() => import("@/three/TowerScene").then((m) => m.TowerScene), {
  ssr: false,
});

const BRASS = "#eaa682";
const TEAL = "#7fc8c0";

const STEP_MS = 400; // one simulator step per 0.4 s here (the backend samples every 15 s)
const CLEAN = 0.05; // the backend's starting drift for a fresh tower

const TONE: Record<Category, string> = {
  Clean: "border-[#7fc8c0] text-[#a6e0d8]",
  Watch: "border-brass text-brass",
  Fouled: "border-[#e09a5f] text-[#f0b98c]",
  Critical: "border-[#e0775f] text-[#f0a08c]",
};

const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

/** Cooling-tower audit lab: the backend's sensor model and analytics, run in the browser. */
export function TowerLab() {
  const { ref, seen, active } = useOnScreen<HTMLDivElement>();
  const env = useLabEnv();
  const engaged = useEngaged();
  const show3d = seen && engaged && env.gl;
  const [fouling, setFouling] = useState(0.35);
  const [tariff, setTariff] = useState(DEFAULT_TARIFF);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState<boolean | null>(null);
  const run = playing ?? false;
  const drive = useRef<TowerDrive>({ fouling: 0.35, load: 0.7, flowFrac: 1 });
  const effCanvas = useRef<HTMLCanvasElement>(null);
  const kwCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced motion is read after mount
    if (env.ready && playing === null) setPlaying(!env.reduced);
  }, [env.ready, env.reduced, playing]);

  useEffect(() => {
    if (!active || !run) return;
    const id = window.setInterval(() => setStep((s) => s + 1), STEP_MS);
    return () => window.clearInterval(id);
  }, [active, run]);

  // Live readings with the backend's sensor jitter, from a seeded source.
  const readings = useMemo(() => {
    const rnd = mulberry(step * 7919 + 13);
    return sample(fouling, step, CT01, 0, (a) => (rnd() * 2 - 1) * a);
  }, [fouling, step]);
  const a = useMemo(() => analyse(readings, tariff), [readings, tariff]);
  const clean = useMemo(() => analyse(sample(CLEAN, step), tariff), [step, tariff]);
  const now = useMemo(() => analyse(sample(fouling, step), tariff), [fouling, step, tariff]);
  const savePerDay = Math.max(0, now.rupeesPerHour - clean.rupeesPerHour) * 24;

  useEffect(() => {
    const load = 0.7 + 0.25 * Math.sin(step / 120);
    drive.current = { fouling, load, flowFrac: readings.flow / (CT01.designFlow * 0.955) };
  }, [fouling, step, readings.flow]);

  // Curves over the whole fouling range at this moment's conditions.
  const curves = useMemo(() => {
    const f = Array.from({ length: 50 }, (_, i) => (i / 49) * 0.98);
    const rows = f.map((x) => analyse(sample(x, step), tariff));
    return {
      f,
      eff: rows.map((r) => r.effectiveness * 100),
      excess: rows.map((r) => r.excessKw),
      idx: rows.map((r) => r.foulingIndex),
    };
  }, [step, tariff]);

  useEffect(() => {
    if (!seen) return;
    const draw = () => {
      const thresholdAt = (th: number) => curves.f[curves.idx.findIndex((v) => v >= th)] ?? 1;
      const vLines = [
        { x: fouling, color: BRASS },
        ...(["watch", "fouled", "critical"] as const).map((k) => ({
          x: thresholdAt(THRESHOLDS[k]),
          color: "rgba(242,239,230,0.25)",
          dash: [3, 3],
        })),
      ];
      if (effCanvas.current)
        drawPlot(effCanvas.current, {
          xRange: [0, 1],
          yRange: [30, 70],
          xLabel: "fouling drift",
          yLabel: "effectiveness (%)",
          vLines,
          series: [{ label: "effectiveness", color: TEAL, x: curves.f, y: curves.eff }],
        });
      if (kwCanvas.current)
        drawPlot(kwCanvas.current, {
          xRange: [0, 1],
          xLabel: "fouling drift",
          yLabel: "kW",
          yMinSpan: 20,
          vLines,
          series: [
            { label: "excess power vs baseline", color: BRASS, x: curves.f, y: curves.excess },
          ],
        });
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [seen, curves, fouling]);

  const tiles: [string, string, string][] = [
    ["Flow", readings.flow.toFixed(1), "m³/h"],
    ["Supply (cold)", readings.supply.toFixed(2), "°C"],
    ["Return (hot)", readings.ret.toFixed(2), "°C"],
    ["Wet bulb", readings.wetBulb.toFixed(2), "°C"],
  ];

  return (
    <div ref={ref} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-mat-shade/60 shadow-[var(--shadow-rest)]">
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${show3d ? "opacity-0" : ""}`}
          >
            <CoolingTowerDrawing className="size-full p-6" />
          </div>
          {show3d && (
            <div className="absolute inset-0" aria-hidden>
              <TowerScene
                active={active}
                reducedMotion={env.reduced}
                drive={drive}
                interactive={env.fine}
              />
            </div>
          )}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span
              className={`rounded-[3px] border bg-mat-shade/75 px-2 py-0.5 font-mono text-[0.6875rem] ${TONE[a.category]}`}
              role="status"
            >
              {a.category} · index {a.foulingIndex.toFixed(2)}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <LabButton onClick={() => setPlaying(!run)} pressed={!run}>
              {run ? "Pause" : "Play"}
            </LabButton>
          </div>
          <p className="pointer-events-none absolute bottom-2 left-3 font-mono text-[0.625rem] text-sage">
            {env.fine ? "drag to orbit · CT-01, simulated sensors" : "CT-01, simulated sensors"}
          </p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {tiles.map(([label, value, unit]) => (
              <div key={label} className="rounded-[4px] border border-line bg-surface/70 p-3">
                <p className="font-mono text-[0.625rem] text-sage uppercase">{label}</p>
                <p className="mt-1 font-mono text-lg text-ink tabular-nums">
                  {value}
                  <span className="text-xs text-sage"> {unit}</span>
                </p>
              </div>
            ))}
          </div>
          <dl className="grid grid-cols-3 gap-2 rounded-[4px] border border-line bg-surface/70 p-3 font-mono text-xs">
            <div>
              <dt className="text-sage">Heat</dt>
              <dd className="text-ink tabular-nums">{Math.round(a.tr)} TR</dd>
            </div>
            <div>
              <dt className="text-sage">Power</dt>
              <dd className="text-ink tabular-nums">{a.totalKw.toFixed(1)} kW</dd>
            </div>
            <div>
              <dt className="text-sage">kW/TR</dt>
              <dd className="text-ink tabular-nums">{a.kwPerTr.toFixed(3)}</dd>
            </div>
          </dl>
          <div className="space-y-4 rounded-md border border-line bg-surface/70 p-4">
            <Slider
              label="Fouling drift"
              value={fouling}
              min={0}
              max={0.98}
              step={0.01}
              onChange={setFouling}
              format={(v) => v.toFixed(2)}
            />
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-sage">Tariff</span>
              <span className="flex items-center gap-1 font-mono text-ink">
                ₹
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={0.5}
                  value={tariff}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v > 0) setTariff(Math.min(50, v));
                  }}
                  className="w-16 rounded-[3px] border border-line-strong bg-mat-shade px-2 py-0.5 text-right tabular-nums"
                />
                <span className="text-sage">/kWh</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_17rem]">
        <Figure
          title="Effectiveness vs fouling"
          canvasRef={effCanvas}
          label="Tower effectiveness falls as fouling rises"
          height={180}
        />
        <Figure
          title="Excess power vs fouling"
          canvasRef={kwCanvas}
          label="Power above the baseline rises with fouling"
          height={180}
        />
        <div className="space-y-2 rounded-md border border-line bg-surface/70 p-4">
          <p className="font-mono text-[0.625rem] text-sage uppercase">Power above baseline</p>
          <p className="font-mono text-2xl text-brass tabular-nums">
            {inr(a.rupeesPerHour * 24)}
            <span className="text-sm text-sage"> /day</span>
          </p>
          <p className="text-xs leading-snug text-sage">
            {a.excessKw.toFixed(1)} kW above the baseline at ₹{tariff}/kWh. Cleaning back to a fresh
            tower saves about <span className="text-ink">{inr(savePerDay)}</span> a day.
          </p>
        </div>
      </div>
    </div>
  );
}
