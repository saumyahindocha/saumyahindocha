/** Faint 30°, 45° and 60° guides radiating from a corner, as printed on a cutting mat. */
export function AngleGuides({ className = "" }: { className?: string }) {
  const r = 520;
  const rays = [30, 45, 60].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return { deg, x: r * Math.cos(a), y: r * Math.sin(a) };
  });
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${r} ${r}`}
      className={`pointer-events-none ${className}`}
      fill="none"
      stroke="#f2efe6"
    >
      {rays.map((p) => (
        <line
          key={p.deg}
          x1="0"
          y1="0"
          x2={p.x}
          y2={p.y}
          strokeOpacity="0.09"
          strokeDasharray="6 6"
        />
      ))}
      <path
        d={`M ${r * 0.62} 0 A ${r * 0.62} ${r * 0.62} 0 0 1 0 ${r * 0.62}`}
        strokeOpacity="0.07"
      />
      {rays.map((p) => (
        <text
          key={`t${p.deg}`}
          x={p.x * 0.66 + 6}
          y={p.y * 0.66 - 4}
          fill="#f2efe6"
          fillOpacity="0.16"
          stroke="none"
          className="font-mono text-[11px]"
        >
          {p.deg}°
        </text>
      ))}
    </svg>
  );
}
