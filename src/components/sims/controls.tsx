"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

/** A labelled range slider with its value read out in mono. */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  format = (v) => v.toFixed(step < 1 ? 2 : 0),
  mark,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  /** A reference value drawn as a brass tick under the track. */
  mark?: number;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-sage">{label}</span>
        <span className="font-mono text-ink tabular-nums">
          {format(value)}
          {unit && <span className="text-sage-dim"> {unit}</span>}
        </span>
      </span>
      <span className="relative mt-1.5 block">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="bench-range w-full"
        />
        {mark !== undefined && (
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-1 h-1.5 w-px bg-brass"
            style={{ left: `calc(${((mark - min) / (max - min)) * 100}% )` }}
          />
        )}
      </span>
    </label>
  );
}

/** A switch row: label and hint on the left, the switch on the right. */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span className="min-w-0">
        <span className="block text-sm text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-snug text-sage-dim">{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="bench-switch mt-0.5 shrink-0"
      />
    </label>
  );
}

export function LabButton({
  children,
  onClick,
  pressed,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  pressed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`rounded-[3px] border px-2.5 py-1 font-mono text-xs transition-colors ${pressed ? "border-brass bg-brass text-mat-shade" : "border-line-strong bg-mat-shade/75 text-ink hover:border-brass"} ${className}`}
    >
      {children}
    </button>
  );
}

/** A figure frame for a plot canvas, with a MATLAB-style title above. */
export function Figure({
  title,
  canvasRef,
  height = 150,
  label,
}: {
  title: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  height?: number;
  label: string;
}) {
  return (
    <figure className="rounded-[4px] border border-line bg-mat-shade/55 px-2 pt-2 pb-1">
      <figcaption className="px-1 font-mono text-[0.6875rem] text-sage">{title}</figcaption>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className="block w-full"
        style={{ height }}
      />
    </figure>
  );
}

/**
 * Tracks whether an element is near the viewport. `seen` latches true the
 * first time, so heavy parts load once and then just pause off-screen.
 */
export function useOnScreen<T extends Element>(margin = "200px 0px") {
  const ref = useRef<T>(null);
  const [state, setState] = useState({ seen: false, active: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setState((s) => ({ seen: s.seen || e.isIntersecting, active: e.isIntersecting })),
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return { ref, ...state };
}

/** Reads the user's motion and WebGL environment once on mount. */
export function useLabEnv() {
  const [env, setEnv] = useState({ reduced: false, fine: true, gl: true, ready: false });
  useEffect(() => {
    let gl = false;
    try {
      gl = !!document.createElement("canvas").getContext("webgl2");
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the browser
    setEnv({
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      fine: window.matchMedia("(hover: hover) and (pointer: fine)").matches,
      gl,
      ready: true,
    });
  }, []);
  return env;
}
