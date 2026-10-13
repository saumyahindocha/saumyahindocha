/*
  A small canvas plotter styled like a cleaned-up MATLAB figure: boxed axes,
  a light grid on nice tick values, axis labels with units and a legend,
  drawn in the bench palette.
*/

export type Series = {
  label: string;
  color: string;
  /** Points as parallel arrays; x need not be evenly spaced. */
  x: ArrayLike<number>;
  y: ArrayLike<number>;
  width?: number;
  dash?: number[];
  /** "line" (default) or "pole"/"zero" markers for a pole-zero map. */
  kind?: "line" | "pole" | "zero";
};

export type PlotSpec = {
  series: Series[];
  xLabel: string;
  yLabel: string;
  xRange: [number, number];
  yRange?: [number, number];
  /** Pad the auto y-range so the trace doesn't touch the frame. */
  yMinSpan?: number;
  hLines?: { y: number; color: string; dash?: number[] }[];
  vLines?: { x: number; color: string; dash?: number[] }[];
  notes?: { x: number; y: number; text: string; align?: CanvasTextAlign; color?: string }[];
};

const INK = "#f2efe6";
const SAGE = "#a9bda4";
const GRID = "rgba(242,239,230,0.09)";
const FRAME = "rgba(242,239,230,0.38)";
const MONO = '10px "JetBrains Mono", ui-monospace, monospace';

export function niceTicks(lo: number, hi: number, target = 5): number[] {
  const span = hi - lo || 1;
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= target + 0.5) ?? mag * 10;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) {
    out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  }
  return out;
}

/** Formats a tick with just enough decimals for its step, with a true minus sign. */
function tickLabel(v: number, ticks: number[]): string {
  const step = ticks.length > 1 ? Math.abs(ticks[1] - ticks[0]) : 1;
  let d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  if (Math.abs(step * 10 ** d - Math.round(step * 10 ** d)) > 1e-6) d += 1; // 0.25, 2.5
  return v.toFixed(d).replace("-", "−");
}

/** Draws the plot to fill the canvas's CSS size (HiDPI aware). */
export function drawPlot(canvas: HTMLCanvasElement, spec: PlotSpec) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const m = { l: 46, r: 12, t: 22, b: 34 };
  const pw = w - m.l - m.r;
  const ph = h - m.t - m.b;
  const [x0, x1] = spec.xRange;

  let [y0, y1] = spec.yRange ?? [Infinity, -Infinity];
  if (!spec.yRange) {
    for (const s of spec.series) {
      for (let i = 0; i < s.y.length; i++) {
        const xv = s.x[i];
        if (xv < x0 || xv > x1) continue;
        const v = s.y[i];
        if (Number.isFinite(v)) {
          y0 = Math.min(y0, v);
          y1 = Math.max(y1, v);
        }
      }
    }
    if (!Number.isFinite(y0)) [y0, y1] = [-1, 1];
    const min = spec.yMinSpan ?? 1e-6;
    if (y1 - y0 < min) {
      const c = (y0 + y1) / 2;
      [y0, y1] = [c - min / 2, c + min / 2];
    }
    const pad = (y1 - y0) * 0.12;
    [y0, y1] = [y0 - pad, y1 + pad];
  }
  const X = (v: number) => m.l + ((v - x0) / (x1 - x0)) * pw;
  const Y = (v: number) => m.t + (1 - (v - y0) / (y1 - y0)) * ph;

  // Grid and ticks
  ctx.font = MONO;
  ctx.lineWidth = 1;
  ctx.fillStyle = SAGE;
  ctx.strokeStyle = GRID;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const xt = niceTicks(x0, x1, Math.max(3, Math.floor(pw / 70)));
  for (const v of xt) {
    const x = Math.round(X(v)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, m.t);
    ctx.lineTo(x, m.t + ph);
    ctx.stroke();
    ctx.fillText(tickLabel(v, xt), x, m.t + ph + 6);
  }
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const yt = niceTicks(y0, y1, Math.max(3, Math.floor(ph / 34)));
  for (const v of yt) {
    const y = Math.round(Y(v)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(m.l, y);
    ctx.lineTo(m.l + pw, y);
    ctx.stroke();
    ctx.fillText(tickLabel(v, yt), m.l - 6, y);
  }

  // Axis labels
  ctx.fillStyle = SAGE;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(spec.xLabel, m.l + pw, h - 3);
  ctx.textAlign = "left";
  ctx.fillText(spec.yLabel, 4, 12);

  ctx.save();
  ctx.beginPath();
  ctx.rect(m.l, m.t, pw, ph);
  ctx.clip();

  for (const l of spec.hLines ?? []) {
    ctx.strokeStyle = l.color;
    ctx.setLineDash(l.dash ?? []);
    ctx.beginPath();
    ctx.moveTo(m.l, Y(l.y));
    ctx.lineTo(m.l + pw, Y(l.y));
    ctx.stroke();
  }
  for (const l of spec.vLines ?? []) {
    ctx.strokeStyle = l.color;
    ctx.setLineDash(l.dash ?? []);
    ctx.beginPath();
    ctx.moveTo(X(l.x), m.t);
    ctx.lineTo(X(l.x), m.t + ph);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  for (const s of spec.series) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width ?? 1.6;
    ctx.setLineDash(s.dash ?? []);
    if ((s.kind ?? "line") === "line") {
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < s.x.length; i++) {
        const v = s.y[i];
        if (!Number.isFinite(v)) {
          started = false;
          continue;
        }
        const px = X(s.x[i]);
        const py = Y(v);
        if (started) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
        started = true;
      }
      ctx.stroke();
    } else {
      ctx.lineWidth = 1.8;
      for (let i = 0; i < s.x.length; i++) {
        const px = X(s.x[i]);
        const py = Y(s.y[i]);
        ctx.beginPath();
        if (s.kind === "pole") {
          ctx.moveTo(px - 4.5, py - 4.5);
          ctx.lineTo(px + 4.5, py + 4.5);
          ctx.moveTo(px + 4.5, py - 4.5);
          ctx.lineTo(px - 4.5, py + 4.5);
        } else ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  ctx.setLineDash([]);
  ctx.restore();

  for (const n of spec.notes ?? []) {
    ctx.fillStyle = n.color ?? INK;
    ctx.textAlign = n.align ?? "left";
    ctx.textBaseline = "middle";
    ctx.fillText(n.text, Math.max(m.l + 2, Math.min(m.l + pw - 2, X(n.x))), Y(n.y));
  }

  // Frame
  ctx.strokeStyle = FRAME;
  ctx.lineWidth = 1;
  ctx.strokeRect(m.l + 0.5, m.t + 0.5, pw, ph);

  // Legend, top right inside the frame header
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let lx = m.l + pw;
  const items = spec.series.filter((s) => s.label);
  for (let i = items.length - 1; i >= 0; i--) {
    const s = items[i];
    const tw = ctx.measureText(s.label).width;
    lx -= tw + 26;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.setLineDash(s.dash ?? []);
    ctx.beginPath();
    if ((s.kind ?? "line") === "line") {
      ctx.moveTo(lx, 10);
      ctx.lineTo(lx + 16, 10);
    } else if (s.kind === "pole") {
      ctx.moveTo(lx + 4, 6);
      ctx.lineTo(lx + 12, 14);
      ctx.moveTo(lx + 12, 6);
      ctx.lineTo(lx + 4, 14);
    } else ctx.arc(lx + 8, 10, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = INK;
    ctx.fillText(s.label, lx + 20, 10);
  }
}
