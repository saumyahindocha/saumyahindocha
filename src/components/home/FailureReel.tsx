"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useScrollProgress } from "@/lib/scroll";

type Failure = { when: string; project: string; symptom: string; fix: string };

/**
 * What broke, as a reel. On desktop the section pins and scrolling down slides the cards
 * sideways; its height is set so the slide ends as the last card arrives. On phones (and
 * with reduced motion) it is an ordinary swipeable row.
 */
export function FailureReel({ items }: { items: Failure[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const [pan, setPan] = useState(false);
  const [travel, setTravel] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    const t = track.current;
    // Travel = how far the track overhangs the screen, plus a gutter after the last card.
    const measure = () => {
      setPan(mq.matches);
      if (t) setTravel(Math.max(0, t.scrollWidth - document.documentElement.clientWidth + 48));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (t) ro.observe(t);
    mq.addEventListener("change", measure);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useScrollProgress(section, "pin");

  return (
    <section
      ref={section}
      aria-labelledby="broke-h"
      className="relative"
      style={
        {
          "--p": 0,
          "--travel": `${travel}px`,
          height: pan ? `calc(100svh + ${travel}px)` : undefined,
        } as CSSProperties
      }
    >
      <div
        className={
          pan ? "sticky top-0 flex h-svh flex-col justify-center overflow-hidden" : "py-24"
        }
      >
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <h2
            id="broke-h"
            className="max-w-[18ch] text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.03em] sm:text-5xl"
          >
            Everything here broke <span className="text-copper">at least once.</span>
          </h2>
          <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-sage">
            Every project keeps a dated log of what went wrong. Here are eight entries from them.
          </p>
        </div>
        <ol
          ref={track}
          className={`mt-10 flex gap-5 px-5 sm:px-8 ${pan ? "reel-track w-max md:pl-[max(2rem,calc((100vw-72rem)/2+2rem))]" : "snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto pb-4"}`}
        >
          {items.map((f) => (
            <li
              key={f.symptom}
              className="relative flex w-[78vw] shrink-0 snap-start flex-col rounded-[14px] border border-line bg-surface p-6 sm:w-[22rem]"
            >
              <p className="font-mono text-xs text-copper tabular-nums">{f.when}</p>
              <p className="mt-1 font-mono text-[0.6875rem] tracking-[0.12em] text-sage uppercase">
                {f.project}
              </p>
              <p className="mt-4 font-display text-xl leading-snug font-semibold text-ink">
                {f.symptom}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-sage">{f.fix}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
