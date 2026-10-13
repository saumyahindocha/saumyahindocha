"use client";

import { useState } from "react";
import type { ProjectTileData } from "@/lib/types";
import { ProjectTile } from "./ProjectTile";

/** Every project on the bench, filterable by discipline. */
export function ProjectBench({
  tiles,
  tags,
}: {
  tiles: (ProjectTileData & { tags: string[] })[];
  tags: string[];
}) {
  const [tag, setTag] = useState<string | null>(null);
  const shown = tag ? tiles.filter((t) => t.tags.includes(tag)) : tiles;
  const chip =
    "rounded-[3px] border px-2.5 py-1 font-mono text-xs transition-colors duration-150 aria-pressed:border-brass aria-pressed:bg-brass aria-pressed:text-mat-shade";
  return (
    <>
      <div role="group" aria-label="Filter by discipline" className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={tag === null}
          onClick={() => setTag(null)}
          className={`${chip} border-line-strong text-ink`}
        >
          All
        </button>
        {tags.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tag === t}
            onClick={() => setTag(tag === t ? null : t)}
            className={`${chip} border-line text-sage hover:text-ink`}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {shown.length} projects shown
      </p>
      <h2 className="sr-only">Project list</h2>
      <ul className="mt-10 grid gap-8 md:grid-cols-2 md:gap-10">
        {shown.map((p) => (
          <li key={p.code}>
            <ProjectTile project={p} />
          </li>
        ))}
      </ul>
    </>
  );
}
