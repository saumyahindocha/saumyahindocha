/**
 * Static poster for the hero centrepiece: the Pod drawn as a dimensioned top view.
 * Shown until the 3D model loads (stage 3). Device size from the brief: 57 × 115 mm.
 * Parts behind the screen are drawn as hidden (dashed) lines.
 */
const S = 2.6; // px per mm
const W = 57 * S;
const H = 115 * S;
const OX = 118; // drawing origin
const OY = 56;

export function PodPoster({ className = "" }: { className?: string }) {
  // Layout from iPOD docs/pcb-plan.md: Pico in the top 23 mm strip, screen module below,
  // DAC near the jack at the bottom right, 503450 LiPo on the underside.
  const scr = { x: 6.9 * S, y: 32 * S, w: 43.2 * S, h: 57.6 * S };
  return (
    <svg
      viewBox={`0 0 ${W + OX + 226} ${H + OY + 64}`}
      className={className}
      role="img"
      aria-label="Top view drawing of the Pod: 57 by 115 millimetres, with a 2.8 inch 240 by 320 touch screen. The Pico 2 W sits in a strip above the screen, the PCM5102 DAC near the bottom, and the 1000 mAh battery on the back."
    >
      <defs>
        <marker
          id="pp-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0.8 L8 4 L0 7.2 Z" fill="#a9bda4" />
        </marker>
        <linearGradient id="pp-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a4434" />
          <stop offset="1" stopColor="#123327" />
        </linearGradient>
        <linearGradient id="pp-screen" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#24382f" />
          <stop offset="1" stopColor="#0f1d17" />
        </linearGradient>
        <filter id="pp-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#05120c" floodOpacity="0.6" />
        </filter>
      </defs>

      <g transform={`translate(${OX} ${OY})`}>
        {/* Body */}
        <rect
          width={W}
          height={H}
          rx={7 * S}
          fill="url(#pp-body)"
          filter="url(#pp-shadow)"
          className="plot-fade"
          style={{ animationDelay: "700ms" }}
        />
        <rect
          width={W}
          height={H}
          rx={7 * S}
          fill="none"
          stroke="#f2efe6"
          strokeOpacity="0.75"
          strokeWidth="1.25"
          pathLength={1}
          className="plot"
        />
        {/* Screen */}
        <rect
          x={scr.x}
          y={scr.y}
          width={scr.w}
          height={scr.h}
          rx={2}
          fill="url(#pp-screen)"
          stroke="#f2efe6"
          strokeOpacity="0.5"
          className="plot-fade"
          style={{ animationDelay: "500ms" }}
        />
        <path
          d={`M${scr.x + 10} ${scr.y + 10} L${scr.x + scr.w * 0.55} ${scr.y + 10}`}
          stroke="#f2efe6"
          strokeOpacity="0.08"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Hidden parts behind the screen */}
        <g
          fill="none"
          stroke="#a9bda4"
          strokeOpacity="0.55"
          strokeDasharray="4 3"
          className="plot-fade"
          style={{ animationDelay: "1000ms" }}
        >
          <rect x={3 * S} y={4 * S} width={51 * S} height={21 * S} rx={2} />
          <rect x={35 * S} y={96 * S} width={16 * S} height={11 * S} rx={1.5} />
          <rect x={11.5 * S} y={52 * S} width={34 * S} height={50 * S} rx={3} strokeOpacity="0.3" />
        </g>

        {/* Centre lines */}
        <g
          stroke="#a9bda4"
          strokeOpacity="0.35"
          strokeDasharray="10 3 2 3"
          className="plot-fade"
          style={{ animationDelay: "300ms" }}
        >
          <line x1={W / 2} y1={-14} x2={W / 2} y2={H + 14} />
          <line x1={-14} y1={H / 2} x2={W + 14} y2={H / 2} />
        </g>

        {/* Width dimension */}
        <g className="plot-fade" style={{ animationDelay: "1100ms" }}>
          <g stroke="#a9bda4" strokeWidth="1">
            <line x1={0} y1={-6} x2={0} y2={-30} strokeOpacity="0.6" />
            <line x1={W} y1={-6} x2={W} y2={-30} strokeOpacity="0.6" />
            <line
              x1={2}
              y1={-24}
              x2={W - 2}
              y2={-24}
              markerStart="url(#pp-arrow)"
              markerEnd="url(#pp-arrow)"
            />
          </g>
          <rect x={W / 2 - 16} y={-31} width={32} height={14} fill="#1d4b39" />
          <text x={W / 2} y={-20.5} textAnchor="middle" className="fill-ink font-mono text-[11px]">
            57
          </text>

          {/* Height dimension */}
          <g stroke="#a9bda4" strokeWidth="1">
            <line x1={W + 6} y1={0} x2={W + 34} y2={0} strokeOpacity="0.6" />
            <line x1={W + 6} y1={H} x2={W + 34} y2={H} strokeOpacity="0.6" />
            <line
              x1={W + 28}
              y1={2}
              x2={W + 28}
              y2={H - 2}
              markerStart="url(#pp-arrow)"
              markerEnd="url(#pp-arrow)"
            />
          </g>
          <rect x={W + 20} y={H / 2 - 14} width={16} height={28} fill="#1d4b39" />
          <text
            transform={`translate(${W + 32} ${H / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-ink font-mono text-[11px]"
          >
            115
          </text>
        </g>

        {/* Leaders */}
        <g
          className="plot-fade font-mono text-[9.5px]"
          fill="#a9bda4"
          style={{ animationDelay: "1300ms" }}
        >
          <Leader
            x1={scr.x + 10}
            y1={scr.y + 30}
            x2={-110}
            y2={scr.y - 6}
            label="2.8 in, 240×320"
            anchor="start"
          />
          <Leader x1={6 * S} y1={14 * S} x2={-110} y2={8 * S} label="Pico 2 W" anchor="start" />
          <Leader
            x1={14 * S}
            y1={98 * S}
            x2={-110}
            y2={82 * S}
            label="1000 mAh, planned"
            anchor="start"
          />
          <Leader
            x1={38 * S}
            y1={104 * S}
            x2={-110}
            y2={110 * S}
            label="PCM5102 DAC"
            anchor="start"
          />
        </g>

        {/* Title block */}
        <g
          transform={`translate(${W - 92} ${H + 22})`}
          className="plot-fade font-mono"
          fill="#a9bda4"
          style={{ animationDelay: "1500ms" }}
        >
          <text x="0" y="0" className="text-[9px] tracking-[0.12em]">
            SH-02 · POD · TOP · mm
          </text>
        </g>
      </g>
    </svg>
  );
}

function Leader({
  x1,
  y1,
  x2,
  y2,
  label,
  anchor,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  anchor: "start" | "end";
}) {
  const elbow = x2 + 84;
  return (
    <g>
      <circle cx={x1} cy={y1} r="1.8" fill="#eaa682" />
      <polyline
        points={`${x1},${y1} ${elbow},${y2} ${x2},${y2}`}
        fill="none"
        stroke="#a9bda4"
        strokeOpacity="0.7"
        strokeWidth="0.8"
      />
      <text x={x2} y={y2 - 4} textAnchor={anchor}>
        {label}
      </text>
    </g>
  );
}
