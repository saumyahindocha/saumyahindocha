import type { Headline } from "@/content/placeholder";

/** Headline numbers in a row. Numbers are always mono. */
export function SpecStrip({ items, className = "" }: { items: Headline[]; className?: string }) {
  return (
    <dl className={`grid grid-cols-3 gap-x-4 ${className}`}>
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
