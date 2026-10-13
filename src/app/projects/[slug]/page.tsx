import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Gallery } from "@/components/bench/Gallery";
import { ModelWindow } from "@/components/bench/ModelWindow";
import { Silk } from "@/components/bench/Silk";
import { SpecStrip } from "@/components/bench/SpecStrip";
import { StatusChip } from "@/components/bench/StatusChip";
import { getProject, getProjects, sections } from "@/lib/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const p = getProject((await params).slug);
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const all = getProjects();
  const i = all.findIndex((p) => p.slug === slug);
  const prev = all[(i - 1 + all.length) % all.length];
  const next = all[(i + 1) % all.length];
  const body = sections(project.body);

  return (
    <article className="mx-auto max-w-6xl px-5 pt-10 sm:px-8 sm:pt-14">
      <Link href="/projects" className="text-sm text-sage transition-colors hover:text-ink">
        ← All projects
      </Link>

      {/* 1. Header */}
      <header className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-end">
        <div>
          <div className="flex items-center gap-3">
            <Silk>
              {project.code} <span className="text-sage-dim">/</span> {project.tile.silk}
            </Silk>
            <StatusChip status={project.status} />
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            {project.title}
          </h1>
          <p className="mt-2 font-mono text-sm text-brass">{project.context}</p>
          <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-sage">{project.summary}</p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 border-l border-line pl-5 text-sm">
          <dt className="font-mono text-xs text-sage-dim">Dates</dt>
          <dd className="text-ink">{project.dates}</dd>
          <dt className="font-mono text-xs text-sage-dim">Role</dt>
          <dd className="text-ink">{project.role}</dd>
          {project.team.length > 0 && (
            <>
              <dt className="font-mono text-xs text-sage-dim">Team</dt>
              <dd className="text-sage">
                <ul>
                  {project.team.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </dd>
            </>
          )}
        </dl>
      </header>

      {/* 2. Spec strip */}
      <SpecStrip items={project.headline} className="mt-10 border-y border-line py-5" />

      {/* 3. Model */}
      <section id="model" aria-label="Interactive model" className="mt-10">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-mat-shade/60 shadow-[var(--shadow-rest)] sm:aspect-[16/9]">
          <ModelWindow model={project.model} media={project.tile.cover} />
        </div>
        <p className="mt-3 text-xs text-sage-dim">
          A first look at the model. The full interactive version, with controls and live plots, is
          being built next.
        </p>
      </section>

      {/* 4–8. Write-up */}
      <div className="mt-16 grid gap-12 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 space-y-2 text-sm">
            {body.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sage transition-colors hover:text-ink">
                  {s.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="max-w-[70ch]">
          {body.map((s) => (
            <section key={s.id} aria-labelledby={s.id} className="mb-14">
              <h2 id={s.id} className="text-2xl font-semibold tracking-tight">
                {s.heading}
              </h2>
              <div className="prose-bench mt-4">
                <MDXRemote source={s.content} />
              </div>
              {s.id === "the-build" && <Gallery items={project.media} />}
              {s.id === "what-i-took-away" && (
                <ol className="mt-6 space-y-4">
                  {project.lessons.map((l, n) => (
                    <li key={l} className="flex gap-4">
                      <span className="font-mono text-sm text-brass">0{n + 1}</span>
                      <span className="leading-relaxed text-ink">{l}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>
      </div>

      {/* 9. Tags, links, next/previous */}
      <footer className="border-t border-line pt-8">
        <ul className="flex flex-wrap gap-2" aria-label="Tech">
          {project.tags.map((t) => (
            <li
              key={t}
              className="rounded-[3px] border border-line px-2 py-0.5 font-mono text-xs text-sage"
            >
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a
            href={project.repo}
            className="font-medium text-ink underline decoration-brass/60 underline-offset-4 hover:decoration-brass"
          >
            Code on GitHub
          </a>
          {project.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sage underline decoration-line-strong underline-offset-4 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>
        <nav aria-label="More projects" className="mt-12 grid grid-cols-2 gap-6">
          <Link href={`/projects/${prev.slug}`} className="group">
            <span className="font-mono text-xs text-sage-dim">Previous</span>
            <span className="mt-1 block text-ink group-hover:text-brass">{prev.title}</span>
          </Link>
          <Link href={`/projects/${next.slug}`} className="group text-right">
            <span className="font-mono text-xs text-sage-dim">Next</span>
            <span className="mt-1 block text-ink group-hover:text-brass">{next.title}</span>
          </Link>
        </nav>
      </footer>
    </article>
  );
}
