"use client";

import { useState } from "react";

/*
  The Pod's Bluetooth audio path, with the wiring from iPOD sdk/common/pod_pins.h
  and the build notes in PROGRESS.md. Hover, focus or tap a hop to see its pins.
*/

type Hop = { id: string; name: string; kind: "device" | "link"; title: string; lines: string[] };

const HOPS: Hop[] = [
  {
    id: "phone",
    name: "iPhone",
    kind: "device",
    title: "The source",
    lines: ["Pairs with a device named “Pod”.", "Album art comes over AVRCP Cover Art."],
  },
  {
    id: "bt",
    name: "Bluetooth A2DP",
    kind: "link",
    title: "Bluetooth Classic, A2DP sink",
    lines: [
      "The Pico 2 W's CYW43439 radio, driven by BTstack.",
      "GPIO 23, 24, 25 and 29 belong to the radio; the firmware never uses them.",
    ],
  },
  {
    id: "pico",
    name: "Pico 2 W",
    kind: "device",
    title: "RP2350 + CYW43439",
    lines: [
      "Receives the stream and plays it out over I2S from PIO0.",
      "Also drives the screen, touch and SD card on SPI0.",
    ],
  },
  {
    id: "i2s",
    name: "I2S",
    kind: "link",
    title: "Three wires, PIO0",
    lines: [
      "DIN  GP13 · Pico pin 17",
      "BCK  GP14 · Pico pin 19",
      "LRCK GP15 · Pico pin 20 (WSEL)",
      "BCK must sit one GPIO below LRCK: PIO side-set pins are consecutive.",
    ],
  },
  {
    id: "dac",
    name: "PCM5102",
    kind: "device",
    title: "Adafruit PCM5102 I2S DAC",
    lines: [
      "Powered from Pico pin 36 (3V3) and pin 18 (GND).",
      "Mounted under the screen, jack at the board edge.",
    ],
  },
  {
    id: "out",
    name: "line out",
    kind: "link",
    title: "Analogue audio",
    lines: ["From the DAC's jack."],
  },
  {
    id: "hp",
    name: "Headphones",
    kind: "device",
    title: "The listener",
    lines: ["First test: Spotify from an iPhone, through the DAC, to headphones."],
  },
];

export function SignalChain() {
  const [sel, setSel] = useState("i2s");
  const hop = HOPS.find((h) => h.id === sel) ?? HOPS[0];
  return (
    <div className="rounded-md border border-line bg-surface/70 p-4">
      <h3 className="font-mono text-silk text-sage uppercase">Signal chain</h3>
      <ol className="mt-4 flex flex-col items-stretch gap-0 sm:flex-row sm:items-center">
        {HOPS.map((h) =>
          h.kind === "device" ? (
            <li key={h.id} className="shrink-0">
              <button
                type="button"
                aria-pressed={sel === h.id}
                onClick={() => setSel(h.id)}
                onMouseEnter={() => setSel(h.id)}
                onFocus={() => setSel(h.id)}
                className={`w-full rounded-[4px] border px-3 py-2 font-mono text-xs transition-colors sm:w-auto ${sel === h.id ? "border-brass bg-brass text-mat-shade" : "border-line-strong bg-mat-shade/70 text-ink hover:border-brass"}`}
              >
                {h.name}
              </button>
            </li>
          ) : (
            <li key={h.id} className="flex min-w-0 flex-1 justify-center sm:block">
              <button
                type="button"
                aria-pressed={sel === h.id}
                onClick={() => setSel(h.id)}
                onMouseEnter={() => setSel(h.id)}
                onFocus={() => setSel(h.id)}
                className="flex w-full flex-col items-center py-0.5 sm:px-1 sm:py-0"
              >
                <span aria-hidden className="signal-wire h-3 w-px sm:hidden" />
                <span
                  className={`font-mono text-[0.625rem] whitespace-nowrap ${sel === h.id ? "text-brass" : "text-sage"}`}
                >
                  {h.name}
                </span>
                <span aria-hidden className="signal-wire h-3 w-px sm:mt-1 sm:h-px sm:w-full" />
              </button>
            </li>
          ),
        )}
      </ol>
      <div className="mt-4 min-h-[6.5rem] border-t border-line pt-3" aria-live="polite">
        <p className="text-sm text-ink">{hop.title}</p>
        <ul className="mt-1.5 space-y-1 font-mono text-xs text-sage">
          {hop.lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
