"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { scrollToId } from "@/components/bench/SmoothScroll";
import { useEngaged } from "@/lib/engaged";
import { useScrollProgress } from "@/lib/scroll";

const BenchScene = dynamic(() => import("@/three/BenchScene").then((m) => m.BenchScene), {
  ssr: false,
});

/**
 * The hero's 3D bench. Shows a still render of the same scene until the visitor first
 * moves, scrolls or taps (so the page paints fast), then swaps in the live scene.
 * On phones the still waits for that first touch too: the bench sits at the bottom of the
 * first screen there, and keeping it out of the first paint lets the headline load first.
 * `section` is the hero: as it scrolls away, the camera rises to look straight down.
 */
export function HeroBench({ section }: { section: React.RefObject<HTMLElement | null> }) {
  const box = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(section, "exit");
  const [env, setEnv] = useState({ ready: false, gl: true, reduced: false, fine: true });
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
          fine: window.matchMedia("(hover: hover) and (pointer: fine)").matches,
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

  return (
    <div ref={box} className="relative size-full">
      <Image
        src="/media/bench-poster.webp"
        alt="The four builds laid out on a green cutting mat: the NIDS robot, the Pod music player, a cooling tower and a parking gate camera."
        width={1600}
        height={1100}
        loading="eager"
        sizes="(min-width: 768px) 60vw, 100vw"
        className={`absolute inset-0 size-full object-contain transition-opacity duration-700 ${live ? "opacity-0" : ""} ${engaged ? "" : "max-md:hidden"}`}
      />
      {show && (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${live ? "" : "opacity-0"}`}
          aria-hidden
        >
          <BenchScene
            active={active}
            reducedMotion={env.reduced}
            progress={progress}
            onPick={scrollToId}
          />
        </div>
      )}
      <p
        data-hint
        className={`pointer-events-none absolute right-2 bottom-2 font-mono text-[0.6875rem] text-sage ${engaged ? "" : "max-md:hidden"}`}
      >
        {env.fine ? "Hover a build to lift it. Click to jump to it." : "Tap a build to jump to it."}
      </p>
    </div>
  );
}
