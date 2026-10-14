"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Eased wheel scrolling on desktop: the page glides to where the wheel sends
 * it instead of jumping in steps. Touch keeps the phone's own native scroll,
 * and nothing changes with prefers-reduced-motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return;

    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, anchors: true });
    (window as { __lenis?: Lenis }).__lenis = lenis;
    let frame = requestAnimationFrame(function raf(t) {
      lenis.raf(t);
      frame = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      delete (window as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return null;
}

/** Scroll to an element by id, through Lenis when it is running so the two don't fight. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = (window as { __lenis?: Lenis }).__lenis;
  if (lenis) lenis.scrollTo(el, { duration: 1.4 });
  else
    el.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
}
