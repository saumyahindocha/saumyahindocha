import type { Metadata } from "next";
import Link from "next/link";
import { Silk } from "@/components/bench/Silk";
import { getProjects } from "@/lib/projects";
import { RESUME_PDF, resume, type ResumeEntry } from "@/lib/resume";

export const metadata: Metadata = {
  title: "Resume",
  description: "Saumya Hindocha's resume: education, experience, projects, coursework and skills.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line py-8 md:grid-cols-[11rem_1fr]">
      <h2 className="font-mono text-silk text-sage uppercase">{title}</h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Entry({ e }: { e: ResumeEntry }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="font-semibold">{e.title}</h3>
        <span className="font-mono text-xs text-sage">{e.when}</span>
      </div>
      {e.lines.map((l) => (
        <p key={l} className="mt-1 text-[0.9375rem] leading-relaxed text-sage">
          {l}
        </p>
      ))}
    </div>
  );
}

export default function ResumePage() {
  const projects = getProjects();
  return (
    <article className="mx-auto max-w-4xl px-5 pt-12 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-6 pb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{resume.name}</h1>
          <p className="mt-2 font-mono text-sm text-brass">{resume.position}</p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-sage">
            {resume.contact.map((c) => (
              <li key={c.href}>
                <a href={c.href} className="hover:text-ink">
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <a
          href={RESUME_PDF}
          download
          className="inline-flex items-center rounded-[4px] bg-brass px-4 py-2.5 text-sm font-medium text-mat-shade shadow-[0_2px_8px_-2px_rgb(5_18_12/0.6)] transition-transform active:translate-y-px"
        >
          Download PDF
        </a>
      </header>

      <Section title="Education">
        {resume.education.map((e) => (
          <Entry key={e.title} e={e} />
        ))}
      </Section>
      <Section title="Experience">
        {resume.experience.map((e) => (
          <Entry key={e.title} e={e} />
        ))}
      </Section>
      <Section title="Projects">
        {projects.map((p) => (
          <div key={p.slug}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h3 className="font-semibold">
                <Link href={`/projects/${p.slug}`} className="hover:text-brass">
                  {p.title}
                </Link>
                <span className="ml-3 font-mono text-xs font-normal text-brass">{p.context}</span>
              </h3>
              <span className="font-mono text-xs text-sage">{p.dates}</span>
            </div>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-sage">{p.summary}</p>
            <p className="mt-1 font-mono text-xs text-sage-dim">
              {p.headline
                .slice(0, 3)
                .map((h) => `${h.value} ${h.label}`)
                .join("  ·  ")}
            </p>
          </div>
        ))}
      </Section>
      <Section title="Competitions">
        {resume.competitions.map((e) => (
          <Entry key={e.title} e={e} />
        ))}
      </Section>
      <Section title="Coursework">
        <ul className="space-y-1 text-[0.9375rem] text-sage">
          {resume.coursework.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Section>
      <Section title="Skills">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[8rem_1fr]">
          {resume.skills.map((s) => (
            <div key={s.group} className="contents">
              <dt>
                <Silk>{s.group}</Silk>
              </dt>
              <dd className="text-[0.9375rem] text-sage">{s.items.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </article>
  );
}
