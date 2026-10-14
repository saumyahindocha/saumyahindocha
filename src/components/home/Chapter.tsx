"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { ProjectTileData } from "@/lib/types";
import { useScrollProgress } from "@/lib/scroll";
import { ModelWindow } from "@/components/bench/ModelWindow";
import { Cover } from "@/components/bench/Cover";
import { Silk } from "@/components/bench/Silk";
import { StatusChip } from "@/components/bench/StatusChip";

type Copy = {
  hook: string;
  wordmark: string;
  tryIt: string;
  broke: { when: string; symptom: string; fix: string };
};

// Scroll progress at which each text step appears: on desktop through the pinned section,
// on phones as the chapter crosses the screen.
const STEPS_PIN = [0.03, 0.06, 0.1, 0.16, 0.23, 0.29];
const STEPS_VIEW = [0.05, 0.09, 0.13, 0.17, 0.21, 0.25];

/**
 * One project as a scroll chapter. On desktop the section is tall and its content sticks:
 * scrolling reveals the hook, the story, the numbers and what broke, while the model turns
 * and (NIDS) gets pushed or (Pod) comes apart. On phones it is a normal section that reveals
 * as it scrolls in. With reduced motion everything shows at once.
 */
export function Chapter({
  project,
  copy,
  index,
}: {
  project: ProjectTileData;
  copy: Copy;
  index: number;
}) {
  const section = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<"pin" | "view">("pin");
  const [pushes, setPushes] = useState(0);
  const explode = useRef(0);
  const step = useRef(-1);
  const half = useRef(false);
  const flip = index % 2 === 1;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const set = () => setMode(mq.matches ? "pin" : "view");
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useScrollProgress(
    section,
    mode,
    (p) => {
      const el = section.current;
      if (!el) return;
      const steps = mode === "pin" ? STEPS_PIN : STEPS_VIEW;
      const n = steps.filter((t) => p >= t).length;
      if (n !== step.current) {
        const grew = n > step.current;
        step.current = n;
        el.querySelectorAll<HTMLElement>("[data-step]").forEach((s) => {
          const on = Number(s.dataset.step) < n;
          if (on && s.dataset.on !== "true" && grew) {
            s.querySelectorAll<HTMLElement>("[data-decode]").forEach(decode);
          }
          s.dataset.on = String(on);
        });
      }
      // Pod comes apart through the middle of its chapter and goes back together.
      const k = Math.min(1, Math.max(0, (p - 0.12) / 0.7));
      explode.current = Math.sin(Math.PI * k) ** 1.5;
      // NIDS gets pushed each time the chapter crosses its middle.
      const past = p > (mode === "pin" ? 0.3 : 0.32);
      if (past !== half.current) {
        half.current = past;
        if (p > 0 && p < 1) setPushes((c) => c + 1);
      }
    },
    mode === "pin" ? 0.55 : 0,
  );

  return (
    <section
      ref={section}
      id={project.slug}
      aria-labelledby={`${project.slug}-h`}
      className="chapter relative md:h-[260vh]"
      style={{ "--p": 0 } as CSSProperties}
    >
      <div className="relative mx-auto max-w-6xl overflow-x-clip px-5 py-16 sm:px-8 md:sticky md:top-0 md:flex md:h-svh md:items-center md:py-0">
        {/* Outline wordmark that drifts behind the model as the chapter scrolls. */}
        <span
          aria-hidden
          data-flip={flip}
          className="chapter-mark pointer-events-none absolute top-0 font-display text-[30vw] leading-none font-bold tracking-[-0.05em] whitespace-nowrap select-none md:top-[3%] md:text-[21vw]"
          style={{ [flip ? "right" : "left"]: "-4vw" } as CSSProperties}
        >
          {copy.wordmark}
        </span>

        <div className="relative grid w-full items-center gap-10 md:grid-cols-12 md:gap-12">
          <div
            className={`chapter-model relative md:col-span-7 ${flip ? "md:order-2" : ""}`}
            data-flip={flip}
          >
            <div className="tile relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-mat-shade/50">
              <span
                aria-hidden
                className="absolute top-2.5 left-2.5 z-10 size-1.5 rounded-full border border-brass/50"
              />
              <span
                aria-hidden
                className="absolute right-2.5 bottom-2.5 z-10 size-1.5 rounded-full border border-brass/50"
              />
              {project.model ? (
                <ModelWindow
                  model={project.model}
                  media={project.media}
                  explodeRef={project.model === "pod" ? explode : undefined}
                  pushSignal={project.model === "nids" ? pushes : 0}
                  sizes="(min-width: 768px) 640px, 92vw"
                />
              ) : (
                <Cover media={project.media} sizes="(min-width: 768px) 640px, 92vw" />
              )}
            </div>
          </div>

          <div className={`relative md:col-span-5 ${flip ? "md:order-1" : ""}`}>
            <div data-step="0" className="chapter-step flex items-center gap-3">
              <Silk>
                {project.code} <span className="text-sage-dim">/</span> {project.silk}
              </Silk>
              <StatusChip status={project.status} />
            </div>
            <h2
              id={`${project.slug}-h`}
              data-step="1"
              className="chapter-step mt-5 text-[2rem] leading-[1.08] font-semibold tracking-[-0.03em] text-ink sm:text-[2.6rem] lg:text-[2.9rem]"
            >
              {copy.hook}
            </h2>
            <div data-step="2" className="chapter-step mt-5">
              <p className="font-mono text-sm text-brass">
                {project.title} <span className="text-sage-dim">/</span> {project.context}
              </p>
              <p className="mt-2 max-w-[46ch] text-[0.9375rem] leading-relaxed text-sage">
                {project.summary}
              </p>
            </div>
            <dl
              data-step="3"
              className="chapter-step mt-7 grid grid-cols-3 gap-4 border-t border-line pt-5"
            >
              {project.headlines.map((h) => (
                <div key={h.label} className="flex min-w-0 flex-col-reverse">
                  <dt className="mt-1 text-xs leading-snug text-sage">{h.label}</dt>
                  <dd
                    data-decode
                    className="font-mono text-base tracking-tight text-copper tabular-nums sm:text-xl"
                  >
                    {h.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div data-step="4" className="chapter-step mt-7 border-l-2 border-copper/60 pl-4">
              <p className="font-mono text-xs text-sage">
                What broke <span className="text-sage-dim">/</span>{" "}
                <span className="text-copper">{copy.broke.when}</span>
              </p>
              <p className="mt-1.5 text-[0.9375rem] leading-snug font-semibold text-ink">
                {copy.broke.symptom}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-sage">{copy.broke.fix}</p>
            </div>
            <div
              data-step="5"
              className="chapter-step mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
            >
              <Link
                href={`/projects/${project.slug}`}
                className="group inline-flex items-center gap-2 rounded-[4px] border border-copper/50 px-4 py-2.5 text-sm font-semibold text-copper transition-colors duration-200 hover:border-copper hover:bg-copper hover:text-mat-shade"
              >
                Read the build log
                <span
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
              <span className="text-sm text-sage">{copy.tryIt}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const DIGITS = "0123456789";

/** Numbers settle into place left to right, like a readout locking on. */
function decode(el: HTMLElement) {
  const final = el.dataset.final ?? el.textContent ?? "";
  el.dataset.final = final;
  const start = performance.now();
  const dur = 700;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / dur);
    let out = "";
    for (let i = 0; i < final.length; i++) {
      const c = final[i];
      out += /\d/.test(c) && i / final.length >= t ? DIGITS[Math.floor(Math.random() * 10)] : c;
    }
    el.textContent = out;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = final;
  };
  requestAnimationFrame(tick);
}
