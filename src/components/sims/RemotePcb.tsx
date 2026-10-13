"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEngaged } from "@/lib/engaged";
import { useLabEnv, useOnScreen } from "./controls";

const PcbScene = dynamic(() => import("@/three/PcbScene").then((m) => m.PcbScene), {
  ssr: false,
});

/** The remote's PCB in 3D, rendered from its Gerbers; the flat render is the poster. */
export function RemotePcb() {
  const { ref, seen, active } = useOnScreen<HTMLDivElement>();
  const env = useLabEnv();
  const engaged = useEngaged();
  const show3d = seen && engaged && env.gl;
  return (
    <div className="grid gap-5 rounded-md border border-line bg-surface/70 p-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-center">
      <div
        ref={ref}
        className="relative aspect-[4/3] overflow-hidden rounded-[4px] border border-line bg-mat-shade/60"
      >
        <Image
          src="/media/nids-self-balancing-robot/remote-pcb-top.png"
          alt="Top side of the remote PCB, rendered from its Gerbers"
          width={1024}
          height={683}
          className={`absolute inset-0 size-full object-contain p-6 transition-opacity duration-500 ${show3d ? "opacity-0" : ""}`}
        />
        {show3d && (
          <div className="absolute inset-0" aria-hidden>
            <PcbScene active={active} reducedMotion={env.reduced} />
          </div>
        )}
        <p className="pointer-events-none absolute bottom-2 left-3 font-mono text-[0.625rem] text-sage">
          {env.fine ? "drag to turn it over" : "rendered from the Gerbers"}
        </p>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-sage">
        <h3 className="font-mono text-silk text-sage uppercase">Remote PCB · 76.2 × 50.8 mm</h3>
        <p className="text-ink">
          The handheld remote&apos;s board, drawn from its own Gerber files: an Arduino Nano (U1)
          reads a joystick on H1 and sends it over an NRF24L01 radio (U2).
        </p>
        <p>
          Designed in EasyEDA in May 2026 and checked by our mentor, but never sent for fabrication.
          The remote was built on perfboard with the same circuit, then shelved with the radio link
          on 18 Aug 2026.
        </p>
      </div>
    </div>
  );
}
