"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { NidsHandle } from "@/three/NidsScene";
import { BotPoster } from "./BotPoster";

// The 3D chunk loads after the page has painted, so it never delays first paint.
const NidsScene = dynamic(() => import("@/three/NidsScene").then((m) => m.NidsScene), {
  ssr: false,
});

/**
 * Hero centrepiece: the dimensioned drawing shows first (and stays for no-WebGL and
 * reduced-data cases); the 3D NIDS fades in over it once loaded.
 */
export function HeroModel() {
  const wrap = useRef<HTMLDivElement>(null);
  const scene = useRef<NidsHandle>(null);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const [env, setEnv] = useState({ interactive: true, reducedMotion: false });

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const interactive = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData;
    const gl = (() => {
      try {
        return !!document.createElement("canvas").getContext("webgl2");
      } catch {
        return false;
      }
    })();
    if (!gl || saveData) return;

    const start = () => {
      setEnv({ interactive, reducedMotion });
      setLoad(true);
    };
    const ric = (
      window as Window & { requestIdleCallback?: (cb: () => void, o?: object) => number }
    ).requestIdleCallback;
    const id = ric ? ric(start, { timeout: 1500 }) : window.setTimeout(start, 600);

    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), {
      rootMargin: "100px",
    });
    if (wrap.current) io.observe(wrap.current);
    return () => {
      io.disconnect();
      if (!ric) window.clearTimeout(id as number);
    };
  }, []);

  // One push shortly after it appears, so the balancing is visible without a click.
  useEffect(() => {
    if (!ready || env.reducedMotion) return;
    const t = window.setTimeout(() => scene.current?.push(1), 900);
    return () => window.clearTimeout(t);
  }, [ready, env.reducedMotion]);

  return (
    <div ref={wrap} className="relative">
      <div
        className={`transition-opacity duration-500 ${ready ? "pointer-events-none opacity-0" : "opacity-100"}`}
        aria-hidden={ready}
      >
        <BotPoster className="h-auto w-full" />
      </div>
      {load && (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        >
          <NidsScene
            ref={scene}
            active={active}
            interactive={env.interactive}
            reducedMotion={env.reducedMotion}
            onReady={() => window.setTimeout(() => setReady(true), 150)}
          />
          <div className="absolute bottom-2 left-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => scene.current?.push(1)}
              className="rounded-[4px] border border-line-strong bg-mat-shade/70 px-3 py-1.5 font-mono text-xs text-ink backdrop-blur-sm transition-colors duration-200 hover:border-brass"
            >
              Push it
            </button>
            <span className="font-mono text-[0.6875rem] text-sage">
              {env.interactive ? "drag to orbit" : "tap the robot"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
