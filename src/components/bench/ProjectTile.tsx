import Link from "next/link";
import type { CSSProperties } from "react";
import type { ProjectTileData } from "@/lib/types";
import { Cover } from "./Cover";
import { ModelWindow } from "./ModelWindow";
import { Silk } from "./Silk";
import { StatusChip } from "./StatusChip";
import { SpecStrip } from "./SpecStrip";

/** A project laid on the mat. Lifts slightly on hover; the shadow spreads. */
export function ProjectTile({ project }: { project: ProjectTileData }) {
  const href = `/projects/${project.slug}`;
  return (
    <article
      className="tile group relative flex h-full flex-col rounded-md border border-line bg-surface p-5 sm:p-6"
      style={{ "--tilt": `${project.tilt}deg` } as CSSProperties}
    >
      {/* Corner pads, like mounting holes on a board. */}
      <span
        aria-hidden
        className="absolute top-2.5 left-2.5 size-1.5 rounded-full border border-brass/50"
      />
      <span
        aria-hidden
        className="absolute right-2.5 bottom-2.5 size-1.5 rounded-full border border-brass/50"
      />

      <header className="flex items-start justify-between gap-3 pl-2">
        <Silk>
          {project.code} <span className="text-sage-dim">/</span> {project.silk}
        </Silk>
        <StatusChip status={project.status} />
      </header>

      <div>
        <TileWindow project={project} />
        <div className="flex flex-col">
          <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            <Link href={href} className="tile-link after:absolute after:inset-0 after:rounded-md">
              {project.title}
            </Link>
          </h3>
          <p className="mt-1 font-mono text-xs text-brass">{project.context}</p>
          <p className="mt-3 max-w-[42ch] text-[0.9375rem] leading-relaxed text-sage">
            {project.summary}
          </p>

          <SpecStrip items={project.headlines} className="mt-6 border-t border-line pt-4" />

          <footer className="relative z-10 mt-auto flex items-center gap-5 pt-6 text-sm">
            <Link
              href={href}
              className="font-medium text-ink underline decoration-brass/60 underline-offset-4 transition-colors duration-200 hover:decoration-brass"
            >
              Open project
            </Link>
            {project.model && (
              <Link
                href={`${href}#model`}
                className="text-sage transition-colors duration-200 hover:text-ink"
              >
                Try the model
              </Link>
            )}
          </footer>
        </div>
      </div>
    </article>
  );
}

/** The tile's picture: a 3D model with a switch to the real photo. Sits above the tile link. */
function TileWindow({ project }: { project: ProjectTileData }) {
  return (
    <div className="relative z-10 mt-4 aspect-[4/3] overflow-hidden rounded-[3px] border border-line bg-mat-shade/60">
      {project.model ? (
        <ModelWindow model={project.model} media={project.media} />
      ) : (
        <Cover media={project.media} sizes="(min-width: 768px) 560px, 92vw" />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgb(242_239_230/0.06)]"
      />
    </div>
  );
}
