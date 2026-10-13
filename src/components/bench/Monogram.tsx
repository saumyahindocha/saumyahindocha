/** SH monogram: letters set in mono inside a brass-outlined pad, like a solder pad. */
export function Monogram({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className={className}
      role="img"
      aria-label="SH"
    >
      <rect
        x="1"
        y="1"
        width="34"
        height="34"
        rx="5"
        fill="none"
        stroke="#ddb06f"
        strokeWidth="1.5"
      />
      <circle cx="6" cy="6" r="1.4" fill="#ddb06f" />
      <text
        x="18"
        y="23.5"
        textAnchor="middle"
        fontFamily="var(--font-jetbrains), monospace"
        fontSize="14"
        fontWeight="600"
        fill="#f2efe6"
        letterSpacing="0.5"
      >
        SH
      </text>
    </svg>
  );
}
