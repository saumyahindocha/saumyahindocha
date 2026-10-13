import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Project, ProjectTileData } from "./types";

// Adding a project = adding content/projects/<slug>.mdx (plus, optionally, a model component).
const DIR = path.join(process.cwd(), "content/projects");

const REQUIRED = [
  "title",
  "slug",
  "code",
  "context",
  "dates",
  "role",
  "status",
  "summary",
  "headline",
  "tags",
  "areas",
  "repo",
  "model",
  "lessons",
  "tile",
] as const;

function load(file: string): Project {
  const { data, content } = matter(fs.readFileSync(path.join(DIR, file), "utf8"));
  for (const key of REQUIRED) {
    if (data[key] === undefined) throw new Error(`${file}: frontmatter is missing "${key}"`);
  }
  if (`${data.slug}.mdx` !== file)
    throw new Error(`${file}: slug "${data.slug}" must match the file name`);
  return {
    team: [],
    links: [],
    media: [],
    ...data,
    body: content,
  } as unknown as Project;
}

let cache: Project[] | undefined;

/** All projects, ordered by their SH-NN code. */
export function getProjects(): Project[] {
  cache ??= fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(load)
    .sort((a, b) => a.code.localeCompare(b.code));
  return cache;
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

export function toTile(p: Project): ProjectTileData {
  return {
    code: p.code,
    silk: p.tile.silk,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    context: p.context,
    status: p.status,
    headlines: p.tile.headline,
    tilt: p.tile.tilt,
    media: p.tile.cover,
    model: p.model,
  };
}

/** Split an MDX body into its level-2 sections, keyed by heading. */
export function sections(body: string): { heading: string; id: string; content: string }[] {
  return body
    .split(/^## /m)
    .slice(1)
    .map((chunk) => {
      const nl = chunk.indexOf("\n");
      const heading = chunk.slice(0, nl).trim();
      return {
        heading,
        id: heading
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        content: chunk.slice(nl + 1).trim(),
      };
    });
}
