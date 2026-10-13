import type { Metadata } from "next";
import { ProjectBench } from "@/components/bench/ProjectBench";
import { getProjects, toTile } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Every project Saumya Hindocha has built, with the numbers and the build logs.",
};

export default function ProjectsPage() {
  const projects = getProjects();
  const order = ["Mechanical", "Electronics", "Controls", "Embedded", "Software"];
  const areas = [...new Set(projects.flatMap((p) => p.areas))].sort(
    (a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99) || a.localeCompare(b),
  );
  return (
    <section className="mx-auto max-w-6xl px-5 pt-12 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Projects</h1>
      <p className="mt-3 max-w-[60ch] text-sage">
        Each one has a live model, the numbers from its repo, and what broke along the way.
      </p>
      <ProjectBench tiles={projects.map((p) => ({ ...toTile(p), tags: p.areas }))} tags={areas} />
    </section>
  );
}
