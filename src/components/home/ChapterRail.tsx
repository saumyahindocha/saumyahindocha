"use client";

import { useEffect, useState } from "react";

/**
 * A ruler down the left edge while the project chapters are on screen: one tick per
 * project, the current one in copper. Desktop only; each tick links to its chapter.
 */
export function ChapterRail({ items }: { items: { slug: string; silk: string }[] }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const seen = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        let best: string | null = null;
        let max = 0;
        for (const [id, r] of seen) if (r > max) [best, max] = [id, r];
        setCurrent(best);
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );
    for (const it of items) {
      const el = document.getElementById(it.slug);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Projects on this page"
      className={`fixed top-1/2 left-5 z-30 hidden -translate-y-1/2 transition-opacity duration-500 lg:block ${current ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <ol className="space-y-4 border-l border-line-strong">
        {items.map((it) => {
          const on = it.slug === current;
          return (
            <li key={it.slug}>
              <a
                href={`#${it.slug}`}
                aria-current={on ? "true" : undefined}
                className={`flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.12em] uppercase transition-colors duration-300 ${on ? "text-copper" : "text-sage-dim hover:text-ink"}`}
              >
                <span
                  aria-hidden
                  className={`h-px transition-[width] duration-300 ${on ? "w-5 bg-copper" : "w-2.5 bg-line-strong"}`}
                />
                {it.silk}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
