import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Gallery } from "@/components/bench/Gallery";
import { Reveal } from "@/components/bench/Reveal";
import { NidsLab } from "@/components/sims/NidsLab";
import { RemotePcb } from "@/components/sims/RemotePcb";
import { GateLab } from "@/components/sims/GateLab";
import { ArchDiagram } from "@/components/sims/ArchDiagram";
import { TowerLab } from "@/components/sims/TowerLab";
import { PodLab } from "@/components/sims/PodLab";
import type { ModelKey } from "@/lib/types";
import { Cover } from "@/components/bench/Cover";
import { ModelWindow } from "@/components/bench/ModelWindow";
import { Silk } from "@/components/bench/Silk";
import { SpecStrip } from "@/components/bench/SpecStrip";
import { StatusChip } from "@/components/bench/StatusChip";
import { getProject, getProjects, sections } from "@/lib/projects";

export const dynamicParams = false;

// Project pages with a full interactive lab; the rest show the tile's model for now.
const LAB: Partial<Record<ModelKey, React.ReactNode>> = {
  nids: (
    <>
      <NidsLab />
      <p className="mt-4 max-w-[70ch] text-xs leading-relaxed text-sage">
        The sim runs the linear model from <code>matlab/balance_model.m</code> (report Table 6.1),
        stepped with fixed-step RK4 every 1 ms. Around it sit the firmware&apos;s PID form, its
        Kalman filter, a 9.1 V motor limit and the 35° fall cut-off. The IMU noise, the floor
        disturbance, the 5 ms control period and the outer-loop gains are assumptions for the sim,
        not measurements from the robot. The pole-zero map and step response use the same model, so
        its poles match MATLAB: −172.3 and −2.04 ± 1.83j.
      </p>
      <div className="mt-10">
        <RemotePcb />
      </div>
    </>
  ),
  gate: (
    <>
      <GateLab />
      <p className="mt-4 max-w-[70ch] text-xs leading-relaxed text-sage">
        The day is a port of the repo&apos;s own full-day simulator: 3,000 bikes, 40 % on monthly
        passes, a morning entry peak and an evening exit peak, 2 % of reads unreadable and 2 %
        misread, and a quarter of walk-in payments in cash. Charges come from a port of the
        backend&apos;s tariff engine, tested against its own cases. Plates are made up, and the
        frame reads under &quot;Show pipeline&quot; illustrate the vote rather than come from the
        reader.
      </p>
      <div className="mt-10">
        <ArchDiagram />
      </div>
    </>
  ),
  tower: (
    <>
      <TowerLab />
      <p className="mt-4 max-w-[70ch] text-xs leading-relaxed text-sage">
        A client-side port of the dashboard&apos;s backend: the sensor simulator and the analytics
        in <code>backend/server.py</code>, with tower CT-01&apos;s design values, its baseline of
        0.17 kW per TR + 4 kW, and the default ₹9/kWh tariff. Heat is ṁ·Cp·ΔT, effectiveness is
        range over range-plus-approach, and the fouling index weighs filter ΔP, conductivity,
        turbidity and tower ΔP. The sensors are simulated, as they are in the original. Dashed lines
        mark the backend&apos;s watch, fouled and critical thresholds.
      </p>
    </>
  ),
  pod: <PodLab />,
};

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
          <dt className="font-mono text-xs text-sage">Dates</dt>
          <dd className="text-ink">{project.dates}</dd>
          <dt className="font-mono text-xs text-sage">Role</dt>
          <dd className="text-ink">{project.role}</dd>
          {project.team.length > 0 && (
            <>
              <dt className="font-mono text-xs text-sage">Team</dt>
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
      <section id="model" aria-labelledby="model-heading" className="mt-10">
        <h2 id="model-heading" className="sr-only">
          {project.model ? "Interactive model" : "Picture"}
        </h2>
        <Reveal>
          {(project.model && LAB[project.model]) ?? (
            <>
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-mat-shade/60 shadow-[var(--shadow-rest)] sm:aspect-[16/9]">
                {project.model ? (
                  <ModelWindow model={project.model} media={project.tile.cover} />
                ) : (
                  <Cover media={project.tile.cover} sizes="(min-width: 1152px) 1088px, 92vw" />
                )}
              </div>
              {project.model && (
                <p className="mt-3 text-xs text-sage">A first look at the model.</p>
              )}
            </>
          )}
        </Reveal>
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
              <Reveal>
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
              </Reveal>
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
            <span className="font-mono text-xs text-sage">Previous</span>
            <span className="mt-1 block text-ink group-hover:text-brass">{prev.title}</span>
          </Link>
          <Link href={`/projects/${next.slug}`} className="group text-right">
            <span className="font-mono text-xs text-sage">Next</span>
            <span className="mt-1 block text-ink group-hover:text-brass">{next.title}</span>
          </Link>
        </nav>
      </footer>
    </article>
  );
}
