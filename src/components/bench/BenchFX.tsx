"use client";

import { useEffect, useRef } from "react";

const MAJOR = 120; // keep in sync with --major in globals.css
const LOUPE_R = { mouse: 76, touch: 64 } as const;
const FOLLOW_MS = 55; // how long the mouse glow takes to catch up (time constant)

/**
 * The bench's light, in one place:
 * - Mouse: a small circle of brighter grid lines glides after the cursor, the
 *   desk lamp follows it, and tile shadows fall away from the lamp.
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
    let cx = 0; // pointer, viewport coords
    let cy = 0;
    let lx = 0; // where the glow is drawn, eased toward the pointer
    let ly = 0;
    let last = 0;
    let fresh = true; // first sighting: jump straight to the pointer
    let fadeTimer = 0;
    let tile: HTMLElement | null = null;

    const resetTile = () => {
      if (!tile) return;
      tile.style.removeProperty("--rx");
      tile.style.removeProperty("--ry");
      tile = null;
    };
    // Tilt the hovered tile toward the pointer (max ~4°) and move its glare.
    const tiltTile = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest<HTMLElement>(".tile");
      if (t !== tile) resetTile();
      if (!t) return;
      tile = t;
      const r = t.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      t.style.setProperty("--rx", `${((0.5 - ny) * 5).toFixed(2)}deg`);
      t.style.setProperty("--ry", `${((nx - 0.5) * 6).toFixed(2)}deg`);
      t.style.setProperty("--gx", `${(nx * 100).toFixed(1)}%`);
      t.style.setProperty("--gy", `${(ny * 100).toFixed(1)}%`);
    };

    const paint = (now: number) => {
      frame = 0;
      if (mode === "mouse" && !fresh) {
        const k = 1 - Math.exp(-Math.min(now - last, 64) / FOLLOW_MS);
        lx += (cx - lx) * k;
        ly += (cy - ly) * k;
      } else {
        lx = cx;
        ly = cy;
        fresh = false;
      }
      last = now;
      const r = LOUPE_R[mode];
      const left = lx - r;
      const top = ly - r;
      loupe.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      // Offset the loupe's own grid so its lines land on the mat's lines.
      const pl = left + window.scrollX;
      const pt = top + window.scrollY;
      const ox = -(((pl % MAJOR) + MAJOR) % MAJOR);
      const oy = -(((pt % MAJOR) + MAJOR) % MAJOR);
      loupe.style.backgroundPosition = `0 0, ${ox}px ${oy}px, ${ox}px ${oy}px, ${ox}px ${oy}px, ${ox}px ${oy}px`;
      if (mode === "mouse") {
        lamp.style.setProperty("--lamp-x", `${lx}px`);
        lamp.style.setProperty("--lamp-y", `${ly}px`);
        const w = window.innerWidth;
        const h = window.innerHeight;
        root.style.setProperty("--shx", `${((0.5 - lx / w) * 16).toFixed(1)}px`);
        root.style.setProperty("--shy", `${((0.45 - ly / h) * 12).toFixed(1)}px`);
        // Keep gliding until the glow has caught up with the cursor.
        if (Math.abs(cx - lx) + Math.abs(cy - ly) > 0.3) schedule();
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduced.matches) return;
      mode = "mouse";
      loupe.dataset.mode = "mouse";
      if (loupe.dataset.on !== "true") fresh = true;
      cx = e.clientX;
      cy = e.clientY;
      lamp.dataset.on = "true";
      loupe.dataset.on = "true";
      tiltTile(e);
      schedule();
    };
    const onPointerLeave = () => {
      resetTile();
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
      cx = t.clientX;
      cy = t.clientY;
      loupe.dataset.on = "true";
      schedule();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length) return;
      window.clearTimeout(fadeTimer);
      fadeTimer = window.setTimeout(() => (loupe.dataset.on = "false"), 450);
    };

    // The glow sits in the viewport, so scrolling only re-aligns its grid.
    const onScroll = () => {
      if (loupe.dataset.on === "true") schedule();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    root.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(fadeTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
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
