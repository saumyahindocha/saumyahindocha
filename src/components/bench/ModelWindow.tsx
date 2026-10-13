"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ModelKey, TileMedia } from "@/lib/types";
import type { NidsHandle } from "@/three/NidsScene";
import { CoolingTowerDrawing } from "./CoolingTowerDrawing";

// Each scene is its own chunk, fetched only when its tile nears the viewport.
const NidsScene = dynamic(() => import("@/three/NidsScene").then((m) => m.NidsScene), {
  ssr: false,
});
const PodScene = dynamic(() => import("@/three/PodScene").then((m) => m.PodScene), { ssr: false });
const GateScene = dynamic(() => import("@/three/GateScene").then((m) => m.GateScene), {
  ssr: false,
});
const TowerScene = dynamic(() => import("@/three/TowerScene").then((m) => m.TowerScene), {
  ssr: false,
});

// Touch users can't orbit (dragging scrolls the page), so their hint only names the tap.
const HINT: Record<ModelKey, string> = {
  nids: "drag to orbit · click to push",
  pod: "tap the screen to use it · click the case to explode",
  gate: "live gate, synthetic plates",
  tower: "hot water in, cold water out",
};
const HINT_TOUCH: Record<ModelKey, string> = {
  ...HINT,
  nids: "tap the bot to push it",
  pod: "tap the case to explode",
};
const HINT_POD_FOCUS = "Pod's own screen code";

/**
 * A tile's picture window: a 3D model by default, with a switch to the real build photo.
 * Shows the photo (or drawing) until the model loads, and pauses the model off-screen.
 */
export function ModelWindow({ model, media }: { model: ModelKey; media: TileMedia }) {
  const ref = useRef<HTMLDivElement>(null);
  const nids = useRef<NidsHandle>(null);
  const [seen, setSeen] = useState(false);
  const [active, setActive] = useState(false);
  const [env, setEnv] = useState({ reduced: false, fine: true, gl: true });
  const [view, setView] = useState<"3d" | "photo">("3d");
  const [podFocus, setPodFocus] = useState(false);
  const pushed = useRef(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        setActive(e.isIntersecting);
        if (e.isIntersecting) {
          let gl = false;
          try {
            gl = !!document.createElement("canvas").getContext("webgl2");
          } catch {}
          setEnv({
            reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            fine: window.matchMedia("(hover: hover) and (pointer: fine)").matches,
            gl,
          });
          setSeen(true);
        }
      },
      { rootMargin: "240px 0px" },
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  // Give NIDS one push the first time it is on screen, so the balancing shows unprompted.
  useEffect(() => {
    if (model !== "nids" || !active || env.reduced || pushed.current) return;
    const t = window.setTimeout(() => {
      nids.current?.push(1);
      pushed.current = true;
    }, 1600);
    return () => window.clearTimeout(t);
  }, [model, active, env.reduced]);

  const show3d = seen && env.gl && view === "3d";
  const hasPhoto = media.kind === "photo";

  return (
    <div ref={ref} className="relative size-full">
      {/* Poster: the real photo, or the line drawing */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${show3d ? "opacity-0" : ""}`}
      >
        {media.kind === "photo" ? (
          <Image
            src={media.src}
            alt={media.alt}
            width={media.width}
            height={media.height}
            sizes="(min-width: 768px) 560px, 92vw"
            className="size-full object-cover"
          />
        ) : (
          <CoolingTowerDrawing className="size-full p-3" />
        )}
      </div>

      {show3d && (
        <div
          className={`absolute inset-0 ${model === "pod" && podFocus ? "[&_canvas]:!touch-none" : ""}`}
          aria-hidden
        >
          {model === "nids" && (
            <NidsScene
              ref={nids}
              compact
              active={active}
              interactive={env.fine}
              reducedMotion={env.reduced}
            />
          )}
          {model === "pod" && (
            <PodScene active={active} reducedMotion={env.reduced} focus={podFocus} />
          )}
          {model === "gate" && <GateScene active={active} reducedMotion={env.reduced} />}
          {model === "tower" && <TowerScene active={active} reducedMotion={env.reduced} />}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-end justify-between gap-2">
        <span className="min-w-0 font-mono text-[0.625rem] leading-tight text-sage">
          {view === "3d" && env.gl
            ? model === "pod" && podFocus
              ? HINT_POD_FOCUS
              : (env.fine ? HINT : HINT_TOUCH)[model]
            : ""}
        </span>
        <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
          {model === "nids" && view === "3d" && (
            <button
              type="button"
              onClick={() => nids.current?.push(1)}
              className="rounded-[3px] border border-line-strong bg-mat-shade/75 px-2 py-0.5 font-mono text-[0.625rem] text-ink backdrop-blur-sm hover:border-brass"
            >
              Push
            </button>
          )}
          {model === "pod" && view === "3d" && env.gl && (
            <button
              type="button"
              aria-pressed={podFocus}
              onClick={() => setPodFocus((f) => !f)}
              className={`rounded-[3px] border px-2 py-0.5 font-mono text-[0.625rem] backdrop-blur-sm transition-colors ${podFocus ? "border-brass bg-brass text-mat-shade" : "border-line-strong bg-mat-shade/75 text-ink hover:border-brass"}`}
            >
              {podFocus ? "Done" : "Use screen"}
            </button>
          )}
          {hasPhoto && env.gl && (
            <div
              role="group"
              aria-label="View"
              className="flex overflow-hidden rounded-[3px] border border-line-strong bg-mat-shade/75 backdrop-blur-sm"
            >
              {(["3d", "photo"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`px-2 py-0.5 font-mono text-[0.625rem] transition-colors ${view === v ? "bg-brass text-mat-shade" : "text-ink hover:text-brass"}`}
                >
                  {v === "3d" ? "3D" : "Photo"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
