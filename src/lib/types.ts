// Shared content types. Projects come from content/projects/*.mdx (see src/lib/projects.ts).

export type Status = "Built" | "In progress" | "Pilot-ready";

export type Headline = { value: string; label: string };

export type TileMedia =
  | { kind: "photo"; src: string; width: number; height: number; alt: string }
  | { kind: "drawing"; name: "cooling-tower" };

export type ModelKey = "nids" | "pod" | "gate" | "tower";

export type MediaItem = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  /** Videos play on click, with `src` as the poster image. */
  video?: string;
};

export type Project = {
  title: string;
  slug: string;
  code: string;
  context: string;
  dates: string;
  role: string;
  team: string[];
  status: Status;
  summary: string;
  headline: Headline[];
  tags: string[];
  /** Broad disciplines, used for the filter on /projects. */
  areas: string[];
  repo: string;
  links: { label: string; href: string }[];
  media: MediaItem[];
  /** Optional: a project without a model shows its tile cover instead. */
  model?: ModelKey;
  lessons: string[];
  /** Tile: short designator, resting tilt in degrees, poster shown before 3D loads, three short numbers. */
  tile: { silk: string; tilt: number; cover: TileMedia; headline: Headline[] };
  body: string;
};

export type ProjectTileData = {
  code: string;
  silk: string;
  slug: string;
  title: string;
  summary: string;
  context: string;
  status: Status;
  headlines: Headline[];
  tilt: number;
  media: TileMedia;
  model?: ModelKey;
};
