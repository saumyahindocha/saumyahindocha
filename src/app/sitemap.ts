import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/projects", "/resume", ...getProjects().map((p) => `/projects/${p.slug}`)].map(
    (path) => ({ url: `${SITE_URL}${path}` }),
  );
}
