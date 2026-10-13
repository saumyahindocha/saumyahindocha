import Image from "next/image";
import type { MediaItem } from "@/lib/types";

/** Build photos and videos laid on the mat. Videos load nothing until played. */
export function Gallery({ items }: { items: MediaItem[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-8 grid gap-6 sm:grid-cols-2">
      {items.map((m) => (
        <li key={m.video ?? m.src}>
          <figure className="overflow-hidden rounded-md border border-line bg-surface shadow-[var(--shadow-rest)]">
            {m.video ? (
              <video
                controls
                preload="none"
                playsInline
                poster={m.src}
                className="aspect-[4/3] w-full bg-mat-shade object-cover focus:outline-2 focus:outline-offset-2 focus:outline-brass"
                aria-label={m.alt}
              >
                <source src={m.video} type="video/mp4" />
              </video>
            ) : (
              <Image
                src={m.src}
                alt={m.alt}
                width={m.width ?? 1200}
                height={m.height ?? 900}
                sizes="(min-width: 640px) 540px, 92vw"
                className="aspect-[4/3] w-full bg-mat-shade object-cover"
              />
            )}
            {m.caption && (
              <figcaption className="border-t border-line px-4 py-2.5 text-xs leading-relaxed text-sage">
                {m.caption}
              </figcaption>
            )}
          </figure>
        </li>
      ))}
    </ul>
  );
}
