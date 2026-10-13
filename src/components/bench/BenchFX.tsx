"use client";

import { useEffect, useRef } from "react";

const MAJOR = 120; // keep in sync with --major in globals.css
const LOUPE_R = { mouse: 120, touch: 64 } as const;

/**
 * The bench's light, in one place:
 * - Mouse: the desk lamp follows the pointer, a faint loupe brightens the grid
 *   under it, and tile shadows fall away from the lamp.
 * - Touch: a small circle of brighter grid lines appears under the finger and
 *   fades after it lifts.
 * The lamp and shadow movement are off with prefers-reduced-motion; the touch
 * glow stays (it is feedback, not motion) but appears and fades instantly.
 */
export function BenchFX() {
  const lampRef = useRef<HTMLDivElement>(null);
  const loupeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lamp = lampRef.current;
    const loupe = loupeRef.current;
    if (!lamp || !loupe) return;
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let frame = 0;
    let mode: "mouse" | "touch" = "mouse";
    let cx = 0; // viewport coords
    let cy = 0;
    let px = 0; // page coords
    let py = 0;
    let fadeTimer = 0;

    const paint = () => {
      frame = 0;
      const r = LOUPE_R[mode];
      const left = px - r;
      const top = py - r;
      loupe.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      // Offset the loupe's own grid so its lines land on the mat's lines.
      const ox = -(((left % MAJOR) + MAJOR) % MAJOR);
      const oy = -(((top % MAJOR) + MAJOR) % MAJOR);
      loupe.style.backgroundPosition = `0 0, ${ox}px ${oy}px, ${ox}px ${oy}px, ${ox}px ${oy}px, ${ox}px ${oy}px`;
      if (mode === "mouse") {
        lamp.style.setProperty("--lamp-x", `${cx}px`);
        lamp.style.setProperty("--lamp-y", `${cy}px`);
        const w = window.innerWidth;
        const h = window.innerHeight;
        root.style.setProperty("--shx", `${((0.5 - cx / w) * 16).toFixed(1)}px`);
        root.style.setProperty("--shy", `${((0.45 - cy / h) * 12).toFixed(1)}px`);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduced.matches) return;
      mode = "mouse";
      loupe.dataset.mode = "mouse";
      cx = e.clientX;
      cy = e.clientY;
      px = e.pageX;
      py = e.pageY;
      lamp.dataset.on = "true";
      loupe.dataset.on = "true";
      schedule();
    };
    const onPointerLeave = () => {
      lamp.dataset.on = "false";
      if (mode === "mouse") loupe.dataset.on = "false";
    };

    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      window.clearTimeout(fadeTimer);
      mode = "touch";
      loupe.dataset.mode = "touch";
      lamp.dataset.on = "false";
      px = t.pageX;
      py = t.pageY;
      loupe.dataset.on = "true";
      schedule();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length) return;
      window.clearTimeout(fadeTimer);
      fadeTimer = window.setTimeout(() => (loupe.dataset.on = "false"), 450);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(fadeTimer);
      window.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return (
    <>
      <div className="vignette" aria-hidden />
      <div ref={lampRef} className="lamp" aria-hidden data-on="false" />
      <div ref={loupeRef} className="loupe" aria-hidden data-on="false" data-mode="mouse" />
    </>
  );
}
