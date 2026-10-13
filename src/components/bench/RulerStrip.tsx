/**
 * Section divider: a strip of measuring tape with millimetre ticks and centimetre numbers.
 * Purely decorative.
 */
export function RulerStrip({ start = 0, className = "" }: { start?: number; className?: string }) {
  const numbers = Array.from({ length: 40 }, (_, i) => start + i);
  return (
    <div
      aria-hidden
      className={`relative h-9 overflow-hidden border-y border-line bg-mat-deep/60 ${className}`}
    >
      <div
        className="absolute inset-x-0 top-0 h-full"
        style={{
          backgroundImage: [
            "linear-gradient(to right, rgb(242 239 230 / 0.5) 1px, transparent 1px)",
            "linear-gradient(to right, rgb(242 239 230 / 0.35) 1px, transparent 1px)",
            "linear-gradient(to right, rgb(242 239 230 / 0.2) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "60px 14px, 30px 9px, 6px 5px",
          backgroundRepeat: "repeat-x",
        }}
      />
      <div className="absolute bottom-1 left-0 flex font-mono text-[0.625rem] text-sage-dim">
        {numbers.map((n) => (
          <span key={n} className="w-[60px] shrink-0 pl-[3px]">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
