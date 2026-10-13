/**
 * Line drawing of a mechanical-draft cooling tower for the SS Filters tile.
 * Labels only, no dimensions: the repo gives no tower geometry.
 */
export function CoolingTowerDrawing({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      className={className}
      role="img"
      aria-label="Line drawing of a cooling tower: fan on top, hot water sprayed in, air drawn up through the fill, cold water collected in the basin."
      fill="none"
      stroke="#a9bda4"
      strokeWidth="1"
    >
      <defs>
        <marker
          id="ct-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0 0.8 L8 4 L0 7.2 Z" fill="#ddb06f" stroke="none" />
        </marker>
      </defs>
      {/* casing */}
      <path d="M110 46 L210 46 L222 160 L98 160 Z" stroke="#f2efe6" strokeOpacity="0.7" />
      {/* fan stack and blades */}
      <path d="M134 46 L134 30 L186 30 L186 46" stroke="#f2efe6" strokeOpacity="0.7" />
      <path d="M140 38 L180 38" />
      <circle cx="160" cy="38" r="2" fill="#ddb06f" stroke="none" />
      {/* fill pack */}
      <g strokeOpacity="0.45">
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${112 + i * 12} 92 l6 30 l6 -30`} />
        ))}
      </g>
      <rect x="106" y="90" width="108" height="34" strokeOpacity="0.5" strokeDasharray="4 3" />
      {/* spray header */}
      <path d="M104 78 L216 78" stroke="#f2efe6" strokeOpacity="0.55" />
      <g strokeOpacity="0.5">
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M${118 + i * 14} 78 l-4 7 M${118 + i * 14} 78 l4 7`} />
        ))}
      </g>
      {/* basin */}
      <path d="M92 160 L92 172 L228 172 L228 160" stroke="#f2efe6" strokeOpacity="0.7" />
      <path d="M96 166 q8 -3 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" strokeOpacity="0.5" />
      {/* flows */}
      <path d="M40 78 L100 78" stroke="#ddb06f" markerEnd="url(#ct-arrow)" />
      <path d="M230 168 L286 168" stroke="#ddb06f" markerEnd="url(#ct-arrow)" />
      <path d="M160 26 L160 6" stroke="#ddb06f" markerEnd="url(#ct-arrow)" strokeDasharray="3 3" />
      <path
        d="M70 140 L104 140"
        stroke="#ddb06f"
        markerEnd="url(#ct-arrow)"
        strokeDasharray="3 3"
      />
      <path
        d="M250 140 L216 140"
        stroke="#ddb06f"
        markerEnd="url(#ct-arrow)"
        strokeDasharray="3 3"
      />
      <g fill="#a9bda4" stroke="none" fontFamily="var(--font-jetbrains), monospace" fontSize="9">
        <text x="40" y="72">
          hot water in
        </text>
        <text x="236" y="186">
          cold water out
        </text>
        <text x="168" y="14">
          air out
        </text>
        <text x="30" y="134">
          air in
        </text>
        <text x="232" y="134">
          air in
        </text>
        <text x="226" y="110">
          fill
        </text>
      </g>
    </svg>
  );
}
