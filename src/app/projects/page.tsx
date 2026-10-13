import type { Metadata } from "next";
import { ProjectTile } from "@/components/bench/ProjectTile";
import { projects } from "@/content/placeholder";

export const metadata: Metadata = { title: "Projects" };

// Stage 1 stub. Tag filters and the bench layout arrive with the MDX content in stage 2.
export default function ProjectsPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-12 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Projects</h1>
      <ul className="mt-10 grid gap-8 md:grid-cols-2 md:gap-x-10">
        {projects.map((p) => (
          <li key={p.code}>
            <ProjectTile project={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
