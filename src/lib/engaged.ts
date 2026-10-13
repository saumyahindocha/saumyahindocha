"use client";

import { useSyncExternalStore } from "react";

/*
  "Has the visitor done anything yet?" The 3D scenes wait for the first scroll,
  touch, pointer move or key press before they load, so a page that is only
  being looked at (or measured) paints its text and posters first.
*/

const EVENTS = ["pointermove", "pointerdown", "wheel", "touchstart", "scroll", "keydown"] as const;
let engaged = false;
const subs = new Set<() => void>();

function engage() {
  if (engaged) return;
  engaged = true;
  for (const e of EVENTS) window.removeEventListener(e, engage, true);
  for (const f of subs) f();
}

function subscribe(onChange: () => void) {
  if (!engaged && subs.size === 0) {
    for (const e of EVENTS) window.addEventListener(e, engage, { capture: true, passive: true });
  }
  subs.add(onChange);
  return () => {
    subs.delete(onChange);
  };
}

export function useEngaged(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => engaged,
    () => false,
  );
}
