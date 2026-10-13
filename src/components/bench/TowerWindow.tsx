"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { CoolingTowerDrawing } from "./CoolingTowerDrawing";

const TowerScene = dynamic(() => import("@/three/TowerScene").then((m) => m.TowerScene), {
  ssr: false,
});

/** The SS Filters tile picture: the line drawing until the 3D tower scrolls into view. */
export function TowerWindow() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [active, setActive] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        setActive(e.isIntersecting);
        if (e.isIntersecting) {
          setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
          setSeen(true);
        }
      },
      { rootMargin: "200px" },
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative size-full">
      <CoolingTowerDrawing
        className={`absolute inset-0 size-full p-3 transition-opacity duration-500 ${seen ? "opacity-0" : ""}`}
      />
      {seen && (
        <div className="absolute inset-0" aria-hidden>
          <TowerScene active={active} reducedMotion={reduced} />
        </div>
      )}
    </div>
  );
}
