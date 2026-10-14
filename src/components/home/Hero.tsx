"use client";

import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { HeroBench } from "./HeroBench";

export function Hero() {
  const section = useRef<HTMLElement>(null);
  return (
    <section
      ref={section}
      className="relative overflow-x-clip"
      style={{ "--p": 0 } as CSSProperties}
    >
      <div className="relative mx-auto grid max-w-6xl items-center gap-4 px-5 pt-8 sm:px-8 md:min-h-[calc(100svh-4rem)] md:grid-cols-12 md:gap-6 md:pt-0">
        <div className="hero-copy relative z-10 md:col-span-5">
          <p className="font-mono text-sm text-brass">
            Saumya Hindocha <span className="text-sage-dim">/</span> Mechanical engineering, IIT
            Bombay
          </p>
          <h1 className="mt-5 text-[3rem] leading-[0.98] font-semibold tracking-[-0.035em] text-ink sm:text-[4.25rem] lg:text-[4.75rem]">
            Machines that work.{" "}
            <span className="relative inline-block text-copper">
              Eventually.
              <svg
                aria-hidden
                viewBox="0 0 300 18"
                preserveAspectRatio="none"
                className="hero-stroke absolute -bottom-2 left-0 h-3 w-full overflow-visible"
              >
                <path
                  d="M3 12 C 60 4, 120 15, 180 8 S 270 6, 297 10"
                  pathLength={1}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-7 max-w-[40ch] text-lg leading-relaxed text-sage">
            I’m a second-year mechanical engineering student who builds things with motors, sensors
            and a lot of jumper wire. Four builds so far. Every one of them broke before it worked,
            and I wrote down how.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#nids-self-balancing-robot"
              className="rounded-[4px] bg-brass px-4 py-2.5 text-sm font-semibold text-mat-shade shadow-[0_6px_16px_-6px_rgb(5_18_12/0.7)] transition-[transform,background-color] duration-200 hover:bg-[#e6bf86] active:translate-y-px"
            >
              See the builds
            </a>
            <Link
              href="/resume"
              className="rounded-[4px] border border-line-strong px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-200 hover:border-ink/60 active:translate-y-px"
            >
              Resume
            </Link>
          </div>
        </div>
        <div className="relative h-[58svh] max-h-[560px] md:col-span-7 md:-mr-[6vw] md:h-[min(68svh,640px)] md:max-h-none">
          <HeroBench section={section} />
        </div>
      </div>
    </section>
  );
}
