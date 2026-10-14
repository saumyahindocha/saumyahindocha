"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/*
  Scroll progress without re-renders. One passive scroll listener schedules one
  rAF; each registered element that is near the viewport gets its progress
  written to the CSS variable --p (0 to 1) and to a ref that 3D scenes read in
  their frame loop. Nothing here touches React state.

  "pin": progress through a tall section whose inner part is sticky
         (0 when its top is `lead` viewports below the top of the viewport, 1 when its
         bottom reaches the bottom of the viewport).
  "view": progress of an element crossing the viewport
         (0 when its top enters at the bottom, 1 when its bottom leaves at the top).
  "exit": how far an element at the top of the page has scrolled away
         (0 at rest, 1 once its bottom reaches the top of the viewport).
*/

type Mode = "pin" | "view" | "exit";

type Entry = {
  el: HTMLElement;
  mode: Mode;
  out: { current: number };
  near: boolean;
  lead: number;
  onChange?: (p: number) => void;
};

const entries = new Set<Entry>();
let queued = false;
let listening = false;
let io: IntersectionObserver | null = null;

function measure() {
  queued = false;
  const vh = window.innerHeight;
  for (const e of entries) {
    if (!e.near) continue;
    const r = e.el.getBoundingClientRect();
    const raw =
      e.mode === "pin"
        ? (e.lead * vh - r.top) / Math.max(1, r.height - vh + e.lead * vh)
        : e.mode === "exit"
          ? -r.top / Math.max(1, r.height)
          : (vh - r.top) / (vh + r.height);
    const p = Math.min(1, Math.max(0, raw));
    if (Math.abs(p - e.out.current) < 0.0005) continue;
    e.out.current = p;
    e.el.style.setProperty("--p", p.toFixed(4));
    e.onChange?.(p);
  }
}

function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(measure);
}

function start() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  io = new IntersectionObserver(
    (records) => {
      for (const rec of records) {
        for (const e of entries) if (e.el === rec.target) e.near = rec.isIntersecting;
      }
      schedule();
    },
    { rootMargin: "50% 0px" },
  );
  for (const e of entries) io.observe(e.el);
}

/**
 * Track an element's scroll progress. Returns a ref holding the latest value (0 to 1).
 * With reduced motion it stays put: 1 (final state) for "pin" and "view", 0 (at rest) for "exit".
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  mode: Mode = "pin",
  onChange?: (p: number) => void,
  lead = 0,
): RefObject<number> {
  // -1 so the first measurement always reports, even at 0.
  const out = useRef(-1);
  const cb = useRef(onChange);
  useLayoutEffect(() => {
    cb.current = onChange;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const still = mode === "exit" ? 0 : 1;
      out.current = still;
      el.style.setProperty("--p", String(still));
      cb.current?.(still);
      return;
    }
    const entry: Entry = {
      el,
      mode,
      out,
      near: true,
      lead,
      onChange: (p) => cb.current?.(p),
    };
    entries.add(entry);
    start();
    io?.observe(el);
    schedule();
    return () => {
      entries.delete(entry);
      io?.unobserve(el);
    };
  }, [ref, mode, lead]);

  return out;
}
