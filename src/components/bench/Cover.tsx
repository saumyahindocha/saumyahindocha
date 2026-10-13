import Image from "next/image";
import type { TileMedia } from "@/lib/types";
import { CoolingTowerDrawing } from "./CoolingTowerDrawing";

/** A project's still picture, for projects that have no 3D model yet. */
export function Cover({ media, sizes }: { media: TileMedia; sizes: string }) {
  return media.kind === "photo" ? (
    <Image
      src={media.src}
      alt={media.alt}
      width={media.width}
      height={media.height}
      sizes={sizes}
      className="size-full object-cover"
    />
  ) : (
    <CoolingTowerDrawing className="size-full p-3" />
  );
}
