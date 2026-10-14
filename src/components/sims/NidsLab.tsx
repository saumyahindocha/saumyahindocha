"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NidsPose } from "@/three/NidsScene";
import { BotPoster } from "@/components/bench/BotPoster";
import { useEngaged } from "@/lib/engaged";
import {
  closedLoop,
  dcGain,
  MATLAB_GAINS,
  plantTF,
  stepResponse,
  type Gains,
} from "@/sims/nids/model";
import { DEFAULT_OPTIONS, LOG_N, NidsSim, V_MAX, type NidsOptions } from "@/sims/nids/sim";
import { roots } from "@/sims/lib/poly";
import { drawPlot } from "./plot";
import { Figure, LabButton, Slider, Toggle, useLabEnv, useOnScreen } from "./controls";

const NidsScene = dynamic(() => import("@/three/NidsScene").then((m) => m.NidsScene), {
  ssr: false,
});

const INK = "#f2efe6";
const BRASS = "#eaa682";
const SAGE = "#a9bda4";
const TEAL = "#7fc8c0";
const RED = "#e0775f";
const WINDOW_S = 8;
const DEG = 180 / Math.PI;

const OPEN_LOOP = roots(plantTF().den);

const fmtC = (re: number, im: number) =>
  `${re < 0 ? "−" : ""}${Math.abs(re).toFixed(re > -10 && re < 10 ? 2 : 1)}${im ? ` ± ${Math.abs(im).toFixed(2)}j` : ""}`;

/**
 * NIDS balance lab: the live sim drives the 3D robot, with the MATLAB gains
 * on sliders, the firmware's switches, and plots that redraw every frame.
 */
export function NidsLab() {
  const { ref, seen, active } = useOnScreen<HTMLDivElement>();
  const env = useLabEnv();
  const engaged = useEngaged();
  const show3d = seen && engaged && env.gl;
  const simRef = useRef<NidsSim | null>(null);
  const pose = useRef<NidsPose>({ theta: 0, p: 0 });
  const thetaCanvas = useRef<HTMLCanvasElement>(null);
  const pCanvas = useRef<HTMLCanvasElement>(null);
  const uCanvas = useRef<HTMLCanvasElement>(null);
  const pzCanvas = useRef<HTMLCanvasElement>(null);
  const stepCanvas = useRef<HTMLCanvasElement>(null);

  const [opts, setOpts] = useState<NidsOptions>(DEFAULT_OPTIONS);
  const [running, setRunning] = useState<boolean | null>(null); // null until we know about reduced motion
  const [fallen, setFallen] = useState(false);
  const playing = running ?? false;

  const sim = useCallback(() => (simRef.current ??= new NidsSim(DEFAULT_OPTIONS, 2026)), []);

  // Reduced motion: start paused, as the brief asks.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- depends on a browser setting read after mount
    if (env.ready && running === null) setRunning(!env.reduced);
  }, [env.ready, env.reduced, running]);

  // Push option changes into the sim.
  useEffect(() => {
    sim().opts = { ...opts, gains: { ...opts.gains } };
  }, [opts, sim]);

  const drawLive = useCallback(() => {
    const s = sim();
    const L = s.log;
    const n = L.count;
    const t = new Float64Array(n);
    const th = new Float64Array(n);
    const est = new Float64Array(n);
    const p = new Float64Array(n);
    const u = new Float64Array(n);
    const start = (L.head - n + LOG_N) % LOG_N;
    for (let i = 0; i < n; i++) {
      const k = (start + i) % LOG_N;
      t[i] = L.t[k];
      th[i] = L.theta[k] * DEG;
      est[i] = L.est[k] * DEG;
      p[i] = L.p[k];
      u[i] = L.u[k];
    }
    const x1 = Math.max(WINDOW_S, s.t);
    const xRange: [number, number] = [x1 - WINDOW_S, x1];
    if (thetaCanvas.current)
      drawPlot(thetaCanvas.current, {
        xRange,
        xLabel: "t (s)",
        yLabel: "θ (°)",
        yMinSpan: 2,
        hLines: [{ y: 0, color: "rgba(242,239,230,0.3)" }],
        series: [
          { label: "controller's θ", color: BRASS, x: t, y: est, width: 1, dash: [3, 2] },
          { label: "true θ", color: INK, x: t, y: th },
        ],
      });
    if (pCanvas.current)
      drawPlot(pCanvas.current, {
        xRange,
        xLabel: "t (s)",
        yLabel: "p (m)",
        yMinSpan: 0.1,
        hLines: [{ y: 0, color: "rgba(242,239,230,0.3)" }],
        series: [{ label: "wheel position", color: TEAL, x: t, y: p }],
      });
    if (uCanvas.current)
      drawPlot(uCanvas.current, {
        xRange,
        xLabel: "t (s)",
        yLabel: "V",
        yRange: [-V_MAX * 1.15, V_MAX * 1.15],
        hLines: [
          { y: V_MAX, color: "rgba(224,119,95,0.55)", dash: [4, 3] },
          { y: -V_MAX, color: "rgba(224,119,95,0.55)", dash: [4, 3] },
        ],
        series: [{ label: "motor voltage", color: SAGE, x: t, y: u, width: 1.2 }],
      });
  }, [sim]);

  // The fixed-timestep loop: runs only while on screen and playing.
  useEffect(() => {
    if (!active || !playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const s = sim();
      s.advance((now - last) / 1000);
      last = now;
      pose.current = { theta: s.x[2], p: s.x[0] };
      setFallen(s.fallen);
      drawLive();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, playing, sim, drawLive]);

  // Closed-loop analysis for the current gains.
  const analysis = useMemo(() => {
    const cl = closedLoop(opts.gains);
    const stable = cl.poles.every((p) => p.re < 0);
    return {
      cl,
      stable,
      fv: stable ? dcGain(cl) : NaN,
      step: stable ? stepResponse(cl, 1.5) : null,
    };
  }, [opts.gains]);

  useEffect(() => {
    if (!seen) return;
    const { cl, step, stable, fv } = analysis;
    const draw = () => {
      if (pzCanvas.current) {
        const all = [...cl.poles, ...cl.zeros, ...OPEN_LOOP];
        const near = all.filter((c) => c.re > -14);
        const far = cl.poles.filter((c) => c.re <= -14);
        const ymax = Math.max(3, ...near.map((c) => Math.abs(c.im) * 1.3));
        drawPlot(pzCanvas.current, {
          xRange: [-14, 10],
          yRange: [-ymax, ymax],
          xLabel: "Re (1/s)",
          yLabel: "Im",
          vLines: [{ x: 0, color: "rgba(242,239,230,0.35)" }],
          hLines: [{ y: 0, color: "rgba(242,239,230,0.2)" }],
          series: [
            {
              label: "open loop",
              color: "rgba(169,189,164,0.6)",
              kind: "pole",
              x: OPEN_LOOP.map((c) => c.re),
              y: OPEN_LOOP.map((c) => c.im),
            },
            {
              label: "closed loop",
              color: stable ? BRASS : RED,
              kind: "pole",
              x: cl.poles.map((c) => c.re),
              y: cl.poles.map((c) => c.im),
            },
            {
              label: "zeros",
              color: TEAL,
              kind: "zero",
              x: cl.zeros.map((c) => c.re),
              y: cl.zeros.map((c) => c.im),
            },
          ],
          notes: far.map((c, i) => ({
            x: -14,
            y: ymax * (0.55 - i * 0.25),
            text: `← pole at ${fmtC(c.re, c.im)}`,
            color: BRASS,
          })),
        });
      }
      if (stepCanvas.current) {
        drawPlot(stepCanvas.current, {
          xRange: [0, 1.5],
          yRange: step ? undefined : [0, 1.5],
          yMinSpan: 1.2,
          xLabel: "t (s)",
          yLabel: "θ / θref",
          hLines: [
            { y: 1, color: "rgba(242,239,230,0.35)", dash: [4, 3] },
            ...(stable ? [{ y: fv, color: "rgba(221,176,111,0.5)", dash: [2, 3] }] : []),
          ],
          series: step ? [{ label: "step response", color: BRASS, x: step.t, y: step.y }] : [],
          notes: step
            ? []
            : [
                {
                  x: 0.75,
                  y: 0.75,
                  text: "unstable: no step response",
                  align: "center",
                  color: RED,
                },
              ],
        });
      }
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [analysis, seen]);

  // Redraw the live plots on resize while paused.
  useEffect(() => {
    if (!seen) return;
    drawLive();
    window.addEventListener("resize", drawLive);
    return () => window.removeEventListener("resize", drawLive);
  }, [seen, drawLive]);

  const setGain = (k: keyof Gains, v: number) =>
    setOpts((o) => ({ ...o, gains: { ...o.gains, [k]: v } }));
  const setFlag = (k: "controller" | "kalman" | "deadZone" | "outer", v: boolean) =>
    setOpts((o) => ({ ...o, [k]: v }));
  const push = (dir: number) => {
    sim().push(dir);
    if (!playing) setRunning(true);
  };
  const resetRobot = () => {
    sim().reset();
    pose.current = { theta: 0, p: 0 };
    setFallen(false);
    drawLive();
  };

  const { cl, stable, fv } = analysis;

  return (
    <div ref={ref} className="space-y-4">
      <div className="relative">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-mat-shade/60 shadow-[var(--shadow-rest)] sm:aspect-[16/9]">
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${show3d ? "opacity-0" : ""}`}
          >
            <BotPoster className="size-full p-6" />
          </div>
          {show3d && (
            <div className="absolute inset-0" aria-hidden>
              <NidsScene
                compact
                active={active}
                interactive={env.fine}
                reducedMotion={env.reduced}
                drive={pose}
                onPush={push}
              />
            </div>
          )}
          <p className="pointer-events-none absolute bottom-2 left-3 font-mono text-[0.625rem] text-sage">
            {env.fine ? "drag to orbit · click the robot to push it" : "tap the robot to push it"}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 sm:absolute sm:inset-x-3 sm:top-3 sm:mt-0">
          <span
            className={`rounded-[3px] border px-2 py-0.5 font-mono text-[0.6875rem] backdrop-blur-sm ${fallen ? "border-[#e0775f] text-[#f0a08c]" : "border-line-strong text-sage"} bg-mat-shade/75`}
            role="status"
          >
            {fallen ? "Fallen past 35°, motors cut" : playing ? "Balancing · live sim" : "Paused"}
          </span>
          <div className="flex gap-1.5">
            <LabButton onClick={() => push(-1)}>← Push</LabButton>
            <LabButton onClick={() => push(1)}>Push →</LabButton>
            <LabButton onClick={resetRobot}>Reset</LabButton>
            <LabButton onClick={() => setRunning(!playing)} pressed={!playing}>
              {playing ? "Pause" : "Play"}
            </LabButton>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="space-y-5 rounded-md border border-line bg-surface/70 p-4">
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-mono text-silk text-sage uppercase">PID on pitch</h3>
              <button
                type="button"
                onClick={() => setOpts((o) => ({ ...o, gains: { ...MATLAB_GAINS } }))}
                className="font-mono text-xs text-brass hover:text-ink"
              >
                Reset to MATLAB gains
              </button>
            </div>
            <Slider
              label="Kp"
              unit="V/rad"
              value={opts.gains.kp}
              min={0}
              max={1000}
              step={0.5}
              mark={MATLAB_GAINS.kp}
              onChange={(v) => setGain("kp", v)}
              format={(v) => v.toFixed(1)}
            />
            <Slider
              label="Ki"
              unit="V/(rad·s)"
              value={opts.gains.ki}
              min={0}
              max={2000}
              step={1}
              mark={MATLAB_GAINS.ki}
              onChange={(v) => setGain("ki", v)}
              format={(v) => v.toFixed(0)}
            />
            <Slider
              label="Kd"
              unit="V·s/rad"
              value={opts.gains.kd}
              min={0}
              max={200}
              step={0.5}
              mark={MATLAB_GAINS.kd}
              onChange={(v) => setGain("kd", v)}
              format={(v) => v.toFixed(1)}
            />
            <p className="text-xs leading-snug text-sage">
              Brass ticks mark the gains from the 25 Jun MATLAB run: Kp 450.47, Ki 800.91, Kd 100.
            </p>
          </div>
          <div className="divide-y divide-line border-t border-line">
            <Toggle
              label="Controller on"
              hint="Off, nothing catches the +8.5 /s fall."
              checked={opts.controller}
              onChange={(v) => setFlag("controller", v)}
            />
            <Toggle
              label="Kalman filter"
              hint="Off, the PID reads the raw, noisy accelerometer angle."
              checked={opts.kalman}
              onChange={(v) => setFlag("kalman", v)}
            />
            <Toggle
              label="Motor dead zone"
              hint="Motors ignore anything under 65/255 PWM, the firmware's placeholder value."
              checked={opts.deadZone}
              onChange={(v) => setFlag("deadZone", v)}
            />
            <Toggle
              label="Outer wheel-speed loop"
              hint="Needs encoders, planned. Stops the drift that pitch-only PID can't."
              checked={opts.outer}
              onChange={(v) => setFlag("outer", v)}
            />
          </div>
        </div>

        <div className="grid min-w-0 gap-3">
          <Figure
            title="Pitch"
            canvasRef={thetaCanvas}
            label="Pitch angle over the last 8 seconds"
            height={150}
          />
          <Figure
            title="Wheel position"
            canvasRef={pCanvas}
            label="Wheel position over the last 8 seconds"
            height={130}
          />
          <Figure
            title="Motor voltage"
            canvasRef={uCanvas}
            label="Motor voltage over the last 8 seconds, limited to 9.1 volts"
            height={110}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Figure
            title="Closed-loop poles and zeros"
            canvasRef={pzCanvas}
            label="Pole-zero map of the closed loop"
            height={200}
          />
          <p className="font-mono text-xs leading-relaxed text-sage">
            Poles{" "}
            {cl.poles
              .map((c) => fmtC(c.re, c.im))
              .filter((s, i, a) => a.indexOf(s) === i)
              .join(", ")}
            {stable ? "" : " · unstable"}
          </p>
        </div>
        <div className="space-y-2">
          <Figure
            title="Step response, linear model"
            canvasRef={stepCanvas}
            label="Closed-loop step response over 1.5 seconds"
            height={200}
          />
          <p className="font-mono text-xs leading-relaxed text-sage">
            {stable
              ? `Final value ${fv.toFixed(3)} · the ${((fv - 1) * 100).toFixed(0)} % offset is the zero at s = 0 cancelling the integrator`
              : "No steady state: a pole is in the right half-plane"}
          </p>
        </div>
      </div>
    </div>
  );
}
