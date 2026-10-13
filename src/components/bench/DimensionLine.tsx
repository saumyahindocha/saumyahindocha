/**
 * A CAD-style dimension: extension ticks, a line with arrowheads and a centred label.
 * Horizontal only; rotate the wrapper for vertical use.
 */
export function DimensionLine({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-sage ${className}`} role="img" aria-label={label}>
      <span className="h-3 w-px bg-current opacity-60" />
      <span className="relative h-px flex-1 bg-current opacity-60">
        <Arrow className="absolute -top-[3.5px] left-0" />
        <Arrow className="absolute -top-[3.5px] right-0 rotate-180" />
      </span>
      <span className="font-mono text-xs whitespace-nowrap text-ink/90">{label}</span>
      <span className="relative h-px flex-1 bg-current opacity-60">
        <Arrow className="absolute -top-[3.5px] left-0" />
        <Arrow className="absolute -top-[3.5px] right-0 rotate-180" />
      </span>
      <span className="h-3 w-px bg-current opacity-60" />
    </div>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" className={className} aria-hidden>
      <path d="M0 4 L8 0.8 L8 7.2 Z" fill="currentColor" />
    </svg>
  );
}
