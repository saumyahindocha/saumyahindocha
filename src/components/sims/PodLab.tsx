"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { PodPoster } from "@/components/bench/PodPoster";
import { useEngaged } from "@/lib/engaged";
import { LabButton, Slider, useLabEnv, useOnScreen } from "./controls";
import { SignalChain } from "./SignalChain";

const PodScene = dynamic(() => import("@/three/PodScene").then((m) => m.PodScene), { ssr: false });

/** Pod lab: the 3D Pod with an exploded-view slider and its live screen, the signal chain and the PCB plan. */
export function PodLab() {
  const { ref, seen, active } = useOnScreen<HTMLDivElement>();
  const env = useLabEnv();
  const [explode, setExplode] = useState(0);
  const [focus, setFocus] = useState(false);
  const engaged = useEngaged();
  const show3d = seen && engaged && env.gl;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div
          ref={ref}
          className="relative aspect-[4/5] overflow-hidden rounded-md border border-line bg-mat-shade/60 shadow-[var(--shadow-rest)] sm:aspect-[16/11]"
        >
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${show3d ? "opacity-0" : ""}`}
          >
            <PodPoster className="size-full p-6" />
          </div>
          {show3d && (
            <div
              className={`absolute inset-0 ${focus ? "[&_canvas]:!touch-none" : ""}`}
              aria-hidden
            >
              <PodScene
                side
                active={active}
                reducedMotion={env.reduced}
                focus={focus}
                explode={explode}
                onCaseClick={() => setExplode((e) => (e > 0.5 ? 0 : 1))}
              />
            </div>
          )}
          <p className="pointer-events-none absolute bottom-2 left-3 font-mono text-[0.625rem] text-sage">
            {focus
              ? "Pod's own screen code: tap, drag, scroll"
              : env.fine
                ? "drag to orbit · click the case to explode"
                : "tap the case to explode"}
          </p>
        </div>

        <div className="space-y-4 self-start rounded-md border border-line bg-surface/70 p-4">
          <Slider
            label="Exploded view"
            value={explode}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => {
              setFocus(false);
              setExplode(v);
            }}
            format={(v) => `${Math.round(v * 100)} %`}
          />
          <div>
            <LabButton
              onClick={() => {
                setExplode(0);
                setFocus((f) => !f);
              }}
              pressed={focus}
            >
              {focus ? "Done" : "Use the screen"}
            </LabButton>
            <p className="mt-2 text-xs leading-snug text-sage">
              The screen runs the Pod&apos;s own display code, compiled for the browser: Home, the
              SD library and the Poster Now Playing screen with volume and seek. The album art is
              placeholder art.
            </p>
          </div>
          <ul className="space-y-1.5 border-t border-line pt-3 font-mono text-xs text-sage">
            <li>Pico 2 W · PCM5102 DAC</li>
            <li>2.8&quot; 240×320 SPI touch screen + microSD</li>
            <li>1000 mAh LiPo (ordered, not fitted)</li>
            <li>Model: ≈ 57 × 115 × 24 mm PCB plan</li>
            <li>Case Rev B: 57.2 × 125.0 × 21.8 mm</li>
          </ul>
        </div>
      </div>

      <SignalChain />

      <figure className="grid gap-4 rounded-md border border-line bg-surface/70 p-4 md:grid-cols-[minmax(0,22rem)_1fr] md:items-center">
        <Image
          src="/media/pod/pcb_layout_pico.webp"
          alt="To-scale top view of the 52 by 109 mm PCB with the Pico 2 W at the top, antenna cut-out, screen sockets, SD keep-out, USB-C and headphone jack"
          width={1100}
          height={1142}
          sizes="(min-width: 768px) 352px, 92vw"
          className="w-full rounded-[4px]"
        />
        <figcaption className="space-y-2 text-sm leading-relaxed text-sage">
          <span className="block font-mono text-silk text-sage uppercase">
            PCB Rev A · 52 × 109 mm · 2 layers
          </span>
          <span className="block text-ink">
            The board plan, to scale: the Pico 2 W at the top over a 9 × 14 mm antenna cut-out, the
            screen on sockets, USB-C and the headphone jack.
          </span>
          <span className="block">
            Drawn in EasyEDA Pro and DRC clean. The assembled quote from JLCPCB came to about $90
            for one prototype, so the same layout was built on perfboard instead.
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
