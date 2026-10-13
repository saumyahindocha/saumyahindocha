"use client";

import { useEffect, useRef } from "react";

/**
 * Desk-lamp light that follows the pointer across the mat.
 * Off on touch devices and when the visitor prefers reduced motion.
 */
export function LampLight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let x = 0;
    let y = 0;

    const paint = () => {
      frame = 0;
      el.style.setProperty("--lamp-x", `${x}px`);
      el.style.setProperty("--lamp-y", `${y}px`);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      el.dataset.on = "true";
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      el.dataset.on = "false";
    };

    const sync = () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      el.dataset.on = "false";
      if (fine.matches && !reduced.matches) {
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
      }
    };

    sync();
    fine.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      fine.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);

  return <div ref={ref} className="lamp" aria-hidden data-on="false" />;
}
