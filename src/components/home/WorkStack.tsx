"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import type { ProjectTileData } from "@/lib/types";
import { ModelWindow } from "@/components/bench/ModelWindow";
import { Cover } from "@/components/bench/Cover";
import { StatusChip } from "@/components/bench/StatusChip";

/**
 * The projects as a stack of cards. On desktop each card sticks near the top and the next
 * one slides over it, while the card underneath settles back and dims (`--k`, 0 to 1).
 * On phones, and with reduced motion, they are a plain list.
 */
export function WorkStack({
  projects,
  hooks,
}: {
  projects: ProjectTileData[];
  hooks: Record<string, { hook: string }>;
}) {
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const root = list.current;
    if (!root) return;
    const mq = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-card]"));
    let queued = false;
    const measure = () => {
      queued = false;
      const vh = window.innerHeight;
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        let k = 0;
        if (next && mq.matches) {
          const top = next.getBoundingClientRect().top;
          const rest = parseFloat(getComputedStyle(next).top) || 0;
          k = Math.min(1, Math.max(0, (vh - top) / Math.max(1, vh - rest)));
        }
        card.style.setProperty("--k", k.toFixed(3));
      });
    };
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    mq.addEventListener("change", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mq.removeEventListener("change", schedule);
    };
  }, []);

  return (
    <ol ref={list} className="space-y-6 md:space-y-[18vh]">
      {projects.map((p, i) => (
        <li
          key={p.slug}
          data-card
          className="work-card md:sticky"
          style={{ "--k": 0, top: `calc(5.5rem + ${i} * 1.25rem)` } as CSSProperties}
        >
          <article
            aria-labelledby={`${p.slug}-h`}
            className="work-card-inner relative grid overflow-hidden rounded-[20px] border border-line bg-surface md:min-h-[500px] md:grid-cols-12"
          >
            <div className="relative p-6 sm:p-8 md:col-span-5 md:flex md:flex-col md:p-10">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-sage tabular-nums">{p.code}</span>
                <StatusChip status={p.status} />
              </div>
              <h3
                id={`${p.slug}-h`}
                className="mt-6 text-[1.75rem] leading-[1.08] font-semibold tracking-[-0.03em] text-ink sm:text-[2.25rem]"
              >
                {hooks[p.slug]?.hook ?? p.title}
              </h3>
              <p className="mt-4 font-mono text-[0.8125rem] text-brass">
                {p.title} <span className="text-sage-dim">/</span> {p.context}
              </p>
              <p className="mt-3 max-w-[44ch] text-[0.9375rem] leading-relaxed text-sage">
                {p.summary}
              </p>
              <dl className="mt-8 grid grid-cols-3 gap-4 md:mt-auto md:pt-8">
                {p.headlines.map((h) => (
                  <div key={h.label} className="flex min-w-0 flex-col-reverse justify-end">
                    <dt className="mt-1 text-xs leading-snug text-sage">{h.label}</dt>
                    <dd className="font-mono text-base tracking-tight whitespace-nowrap text-copper tabular-nums sm:text-xl">
                      {h.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <Link
                href={`/projects/${p.slug}`}
                className="group mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink"
              >
                <span className="underline decoration-copper/50 underline-offset-[6px] transition-colors duration-200 group-hover:decoration-copper">
                  Read the full build
                </span>
                <span
                  aria-hidden
                  className="text-copper transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </div>
            <div className="relative order-first m-2 aspect-[4/3] overflow-hidden rounded-[14px] bg-[radial-gradient(120%_90%_at_50%_30%,#1f3a2f_0%,#0b1511_75%)] md:order-none md:col-span-7 md:m-3 md:self-center">
              <div className="absolute inset-0">
                {p.model ? (
                  <ModelWindow
                    model={p.model}
                    media={p.media}
                    sizes="(min-width: 768px) 640px, 92vw"
                  />
                ) : (
                  <Cover media={p.media} sizes="(min-width: 768px) 640px, 92vw" />
                )}
              </div>
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-mat-shade"
              style={{ opacity: "calc(var(--k) * 0.55)" }}
            />
          </article>
        </li>
      ))}
    </ol>
  );
}
