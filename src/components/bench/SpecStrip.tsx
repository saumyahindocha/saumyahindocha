import type { CSSProperties } from "react";
import type { Headline } from "@/lib/types";

/** Headline numbers in a row. Numbers are always mono. */
export function SpecStrip({ items, className = "" }: { items: Headline[]; className?: string }) {
  return (
    <dl
      className={`grid gap-x-4 gap-y-4 ${items.length > 3 ? "grid-cols-2 sm:grid-cols-[repeat(var(--n),minmax(0,1fr))]" : "grid-cols-3"} ${className}`}
      style={{ "--n": items.length } as CSSProperties}
    >
      {items.map((h) => (
        <div key={h.label} className="flex min-w-0 flex-col-reverse">
          <dt className="mt-0.5 text-xs leading-snug text-sage">{h.label}</dt>
          <dd className="font-mono text-[0.9375rem] tracking-tight text-ink tabular-nums sm:text-lg">
            {h.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
