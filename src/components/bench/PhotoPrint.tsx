import Image from "next/image";
import type { CSSProperties } from "react";

/** A photo print lying on the mat: off-white border, a caption strip, lamp-cast shadow. */
export function PhotoPrint({
  src,
  alt,
  width,
  height,
  caption,
  tilt = -4,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
  tilt?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure
      className={`print tile bg-[#ece8dc] p-[5%] pb-0 ${className}`}
      style={{ "--tilt": `${tilt}deg` } as CSSProperties}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes="(min-width: 768px) 200px, 34vw"
        className="aspect-[4/5] w-full object-cover"
      />
      <figcaption className="py-[7%] font-mono text-[clamp(0.5rem,1.6vw,0.6875rem)] leading-tight text-[#3d4a42]">
        {caption}
      </figcaption>
    </figure>
  );
}
