"use client";

import { useRef, type CSSProperties } from "react";
import { useScrollProgress } from "@/lib/scroll";

/**
 * A paragraph that brightens word by word as it scrolls up the screen, so it reads at the
 * pace you scroll. `parts` are runs of text; `em` runs are copper. With reduced motion (or
 * before scripts run) every word is fully lit.
 */
export function LitText({
  parts,
  className = "",
}: {
  parts: { text: string; em?: boolean }[];
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  useScrollProgress(ref, "view");
  let i = 0;
  const words = parts.flatMap((part) =>
    part.text
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => ({ w, em: part.em, i: i++ })),
  );
  return (
    <p ref={ref} className={`lit ${className}`} style={{ "--n": words.length } as CSSProperties}>
      {words.map(({ w, em, i }) => (
        <span
          key={i}
          className={em ? "text-copper" : undefined}
          style={{ "--i": i } as CSSProperties}
        >
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
