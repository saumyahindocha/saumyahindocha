import type { ReactNode } from "react";

/** Silkscreen label: small uppercase mono, like a component designator on a PCB. */
export function Silk({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono text-silk text-sage uppercase ${className}`}>{children}</span>;
}
