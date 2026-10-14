"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useEngaged } from "@/lib/engaged";

const TurntableScene = dynamic(
  () => import("@/three/TurntableScene").then((m) => m.TurntableScene),
  { ssr: false },
);

export type StageItem = { slug: string; short: string; summary: string };

/**
 * The hero's turntable. Shows a still of the first build until the visitor first moves,
 * scrolls or taps (so the page paints fast), then swaps in the live scene, which steps
 * through the four builds on its own. The bar under each name shows the time left on it;
 * hovering the stage holds it. On phones the still waits for that first touch too, so
 * the headline is what paints first.
 */
export function HeroStage({ items }: { items: StageItem[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [held, setHeld] = useState(false);
  const [env, setEnv] = useState({ ready: false, gl: true, reduced: false });
  const [active, setActive] = useState(true);
  const [live, setLive] = useState(false);
  const engaged = useEngaged();

  useEffect(() => {
    // The first observer callback fires straight away, so it also reads the environment.
    const io = new IntersectionObserver(([e]) => {
      setActive(e.isIntersecting);
      setEnv((prev) => {
        if (prev.ready) return prev;
        let gl = false;
        try {
          gl = !!document.createElement("canvas").getContext("webgl2");
        } catch {}
        return {
          ready: true,
          gl,
          reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        };
      });
    });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  const show = env.ready && env.gl && engaged;

  // Fade the live scene in a beat after it mounts, once it has drawn its first frames.
  useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(() => setLive(true), 600);
    return () => window.clearTimeout(t);
  }, [show]);

  const running = live && active && !held && !env.reduced;
  const item = items[current];

  return (
    <div>
      <div
        ref={box}
        data-stage
        className="relative aspect-[1/1] w-full sm:aspect-[6/5]"
        onPointerEnter={(e) => e.pointerType === "mouse" && setHeld(true)}
        onPointerLeave={() => setHeld(false)}
      >
        <Image
          src="/media/bench-poster.webp"
          alt="The NIDS self-balancing robot standing on a round plinth with a copper rim."
          width={1200}
          height={1000}
          loading="eager"
          sizes="(min-width: 768px) 46vw, 100vw"
          className={`absolute inset-0 size-full object-contain transition-opacity duration-700 ${live ? "opacity-0" : ""} ${engaged ? "" : "max-md:hidden"}`}
        />
        {show && (
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${live ? "" : "opacity-0"}`}
            aria-hidden
          >
            <TurntableScene current={current} active={active} reducedMotion={env.reduced} />
          </div>
        )}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-2 sm:gap-3" role="group" aria-label="Builds">
        {items.map((it, i) => {
          const on = i === current;
          return (
            <button
              key={it.slug}
              type="button"
              aria-pressed={on}
              onClick={() => setCurrent(i)}
              className={`group relative pt-3 text-left transition-colors duration-200 ${on ? "text-ink" : "text-sage hover:text-ink"}`}
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-line-strong" />
              {on && (
                <span
                  aria-hidden
                  key={current}
                  className="stage-progress absolute top-0 left-0 h-px w-full origin-left bg-copper"
                  style={{ animationPlayState: running ? "running" : "paused" }}
                  onAnimationEnd={() => setCurrent((c) => (c + 1) % items.length)}
                />
              )}
              <span className="block font-mono text-[0.6875rem] text-sage-dim tabular-nums">
                0{i + 1}
              </span>
              <span className="mt-0.5 block text-[0.8125rem] leading-tight font-medium sm:text-sm">
                {it.short}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 min-h-[3lh] text-[0.9375rem] leading-relaxed text-sage sm:min-h-[2lh]">
        {item.summary}{" "}
        <Link
          href={`/projects/${item.slug}`}
          className="whitespace-nowrap text-copper underline decoration-copper/40 underline-offset-4 transition-colors duration-200 hover:decoration-copper"
        >
          Open the project
        </Link>
      </p>
    </div>
  );
}
