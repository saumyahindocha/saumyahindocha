import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { ProjectTileData, TileMedia } from "@/content/placeholder";
import { TowerWindow } from "./TowerWindow";
import { Silk } from "./Silk";
import { StatusChip } from "./StatusChip";
import { SpecStrip } from "./SpecStrip";

/** A project laid on the mat. Lifts slightly on hover; the shadow spreads. */
export function ProjectTile({
  project,
  featured = false,
}: {
  project: ProjectTileData;
  featured?: boolean;
}) {
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
          {project.code} <span className="text-sage-dim">/</span> {project.silk.split(" · ")[1]}
        </Silk>
        <StatusChip status={project.status} />
      </header>

      <div className={featured ? "md:mt-1 md:grid md:grid-cols-[1.35fr_1fr] md:gap-8" : ""}>
        <TileWindow media={project.media} featured={featured} />
        <div className="flex flex-col">
          <h3
            className={`mt-5 font-semibold tracking-tight text-ink ${featured ? "text-2xl sm:text-3xl md:mt-4" : "text-xl sm:text-2xl"}`}
          >
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
            <Link
              href={`${href}#model`}
              className="text-sage transition-colors duration-200 hover:text-ink"
            >
              Try the model
            </Link>
          </footer>
        </div>
      </div>
    </article>
  );
}

/** The tile's picture: a photo inset like a print, or a line drawing on the tile. */
function TileWindow({ media, featured }: { media: TileMedia; featured: boolean }) {
  return (
    <div
      className={`relative mt-4 overflow-hidden ${featured ? "aspect-[16/10] md:aspect-[4/3]" : "aspect-[16/10]"} rounded-[3px] border border-line bg-mat-shade`}
    >
      {media.kind === "photo" ? (
        <Image
          src={media.src}
          alt={media.alt}
          width={media.width}
          height={media.height}
          sizes={featured ? "(min-width: 768px) 620px, 92vw" : "(min-width: 768px) 520px, 92vw"}
          className="size-full object-cover brightness-[0.88] saturate-[0.85] transition-[filter,transform] duration-300 group-hover:scale-[1.02] group-hover:brightness-100 group-hover:saturate-100"
        />
      ) : (
        <TowerWindow />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgb(242_239_230/0.06),inset_0_-40px_60px_-30px_rgb(5_18_12/0.6)]"
      />
    </div>
  );
}
