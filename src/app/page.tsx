import Link from "next/link";
import { AngleGuides } from "@/components/bench/AngleGuides";
import { DimensionLine } from "@/components/bench/DimensionLine";
import { ProjectTile } from "@/components/bench/ProjectTile";
import { Reveal } from "@/components/bench/Reveal";
import { RulerStrip } from "@/components/bench/RulerStrip";
import { Silk } from "@/components/bench/Silk";
import { bugLog, disciplines } from "@/content/site";
import { getProjects, toTile } from "@/lib/projects";

export default function Home() {
  return (
    <>
      <Hero />
      <RulerStrip className="mt-6" />
      <Projects />
      <HowIWork />
      <Now />
      <Experience />
      <Started />
      <RulerStrip start={12} className="mt-24" />
      <Contact />
    </>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-10 pb-8 sm:px-8 md:grid-cols-[1.05fr_1fr] md:gap-14 md:pt-16 lg:pt-20">
      <AngleGuides className="absolute -top-16 -left-24 hidden w-[520px] md:block" />
      <div className="relative">
        <p className="font-mono text-sm text-brass">Mechanical engineering, IIT Bombay</p>
        <h1
          translate="no"
          className="mt-4 text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.035em] text-ink sm:text-[4rem]"
        >
          Saumya Hindocha
        </h1>
        <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-sage">
          I’m in my second year. Outside class I build things that have to survive the real world:{" "}
          <span className="text-ink">a robot that balances on two wheels</span>,{" "}
          <span className="text-ink">a music player I soldered in one night</span> and{" "}
          <span className="text-ink">a parking system built to read plates on moving bikes</span>.
        </p>
        <p className="mt-4 max-w-[46ch] text-lg leading-relaxed font-medium text-copper">
          I write down what broke on every build, because that’s where most of the learning was.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/projects"
            className="rounded-[4px] bg-brass px-4 py-2.5 text-sm font-semibold text-mat-shade shadow-[0_6px_16px_-6px_rgb(5_18_12/0.7)] transition-[transform,background-color] duration-200 hover:bg-[#e6bf86] active:translate-y-px"
          >
            See projects
          </Link>
          <Link
            href="/resume"
            className="rounded-[4px] border border-line-strong px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-200 hover:border-ink/60 active:translate-y-px"
          >
            Resume
          </Link>
        </div>
      </div>
      <BugLog />
    </section>
  );
}

/** Real failures, one line each; open one to read the fix. Native details, so no JS. */
function BugLog() {
  return (
    <div className="relative rounded-md border border-line bg-mat-deep/70 p-5 shadow-[var(--shadow-rest)] backdrop-blur-[2px] sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight">What broke, and the fix</h2>
      <ul className="mt-4 border-t border-line">
        {bugLog.map((b, i) => (
          <li key={b.symptom} className="border-b border-line">
            <details className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-start gap-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <span className="hidden w-[5.5rem] shrink-0 pt-0.5 font-mono text-xs text-copper tabular-nums sm:block">
                  {b.date}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[0.6875rem] tracking-[0.12em] text-sage uppercase">
                    <span className="text-copper sm:hidden">{b.date} / </span>
                    {b.project}
                  </span>
                  <span className="mt-1 block text-[0.9375rem] leading-snug font-semibold text-ink">
                    {b.symptom}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="mt-1 font-mono text-sm text-brass transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="-mt-1 pr-6 pb-4 text-sm leading-relaxed text-sage sm:pl-[6.5rem]">
                {withCode(b.fix)}
              </p>
            </details>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-sage">
        Each project page has its full list.{" "}
        <Link
          href="/projects"
          className="text-ink underline decoration-brass/60 underline-offset-4 transition-colors hover:decoration-brass"
        >
          Browse projects
        </Link>
      </p>
    </div>
  );
}

/** Renders `backticked` spans in mono, like the project pages do for code. */
function withCode(text: string) {
  return text.split("`").map((part, i) =>
    i % 2 ? (
      <code key={i} className="font-mono text-[0.8125rem] text-ink">
        {part}
      </code>
    ) : (
      part
    ),
  );
}

const SPAN = ["md:col-span-7", "md:col-span-5", "md:col-span-6", "md:col-span-6"];

function Projects() {
  const projects = getProjects().map(toTile);
  return (
    <section aria-labelledby="projects" className="mx-auto max-w-6xl px-5 pt-20 sm:px-8">
      <div className="flex items-end justify-between gap-4">
        <h2 id="projects" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Projects
        </h2>
        <Link href="/projects" className="text-sm text-sage transition-colors hover:text-ink">
          All projects
        </Link>
      </div>
      {/* Every project gets a live model and close to the same space; NIDS is a touch wider. */}
      <ul className="mt-10 grid gap-8 md:grid-cols-12 md:gap-10">
        {projects.map((p, i) => (
          <Reveal as="li" key={p.code} delay={(i % 2) * 140} className={SPAN[i] ?? "md:col-span-6"}>
            <ProjectTile project={p} />
          </Reveal>
        ))}
      </ul>
      <p className="mt-8 max-w-[70ch] text-xs leading-relaxed text-sage">
        * Measured on held-out computer-generated plates, not yet on real bikes.
      </p>
    </section>
  );
}

function HowIWork() {
  return (
    <section aria-labelledby="how" className="mx-auto max-w-6xl px-5 pt-24 sm:px-8">
      <Reveal className="grid gap-6 md:grid-cols-[14rem_1fr] md:gap-8">
        <h2 id="how" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          How I work
        </h2>
        <p className="max-w-[62ch] text-lg leading-relaxed text-sage">
          I choose the parts, do the wiring and the mechanical design, and test everything on the
          bench.{" "}
          <span className="text-ink">AI coding agents write much of the firmware and software</span>
          ; I review what they write and decide when it’s done.
        </p>
      </Reveal>
      <ul className="mt-10 grid border-t border-l border-line sm:grid-cols-2">
        {disciplines.map((d, i) => (
          <Reveal
            as="li"
            key={d.key}
            delay={(i % 2) * 120}
            className="border-r border-b border-line p-5 sm:p-6"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm text-copper">{d.key}</span>
              <h3 className="text-lg font-semibold tracking-tight">{d.title}</h3>
            </div>
            <p className="mt-1 font-mono text-xs text-sage">{d.tools}</p>
            <p className="mt-3 max-w-[48ch] text-[0.9375rem] leading-relaxed text-ink/85">
              {d.example}
            </p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function Now() {
  const items = [
    {
      silk: "U4",
      title: "Pod",
      body: "The perfboard boots to the home screen and touch works. Next: SD playback and phone streaming on the board, then fitting the charger, switch and battery.",
    },
    {
      silk: "R7",
      title: "EE 617 research project",
      body: "Research in sensors and instrumentation, with the course professor.",
    },
  ];
  return (
    <section aria-labelledby="now" className="mx-auto max-w-6xl px-5 pt-24 sm:px-8">
      <Reveal className="grid gap-8 md:grid-cols-[14rem_1fr]">
        <h2 id="now" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Now working on
        </h2>
        <ul className="divide-y divide-line border-y border-line">
          {items.map((it) => (
            <li key={it.title} className="flex gap-5 py-5">
              <Silk className="w-8 shrink-0 pt-1">{it.silk}</Silk>
              <div>
                <h3 className="text-lg font-semibold">{it.title}</h3>
                <p className="mt-1 max-w-[60ch] text-[0.9375rem] leading-relaxed text-sage">
                  {it.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

// From Saumya, 13 Oct 2026.
const early = [
  {
    silk: "C1",
    title: "XLR8",
    when: "First year",
    detail: "My first robot: a four-wheeled wireless line follower, built with a team.",
  },
  { silk: "C2", title: "Aeromodelling", when: "", detail: "A basic plane built from Depron foam." },
];

function Started() {
  return (
    <section aria-labelledby="started" className="mx-auto max-w-6xl px-5 pt-24 sm:px-8">
      <Reveal className="grid gap-8 md:grid-cols-[14rem_1fr]">
        <h2 id="started" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Where I started
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2">
          {early.map((c) => (
            <li key={c.title} className="relative rounded-md border border-line bg-surface/60 p-6">
              <Silk>{c.silk}</Silk>
              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="text-xl font-semibold tracking-tight">{c.title}</h3>
                {c.when && <span className="font-mono text-xs text-sage">{c.when}</span>}
              </div>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-sage">{c.detail}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

function Experience() {
  return (
    <section aria-labelledby="experience" className="mx-auto max-w-6xl px-5 pt-24 sm:px-8">
      <Reveal className="grid gap-8 md:grid-cols-[14rem_1fr]">
        <h2 id="experience" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Experience
        </h2>
        <div className="space-y-10">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h3 className="text-lg font-semibold">Intern, SS Filters</h3>
              <span className="font-mono text-xs text-sage">July 2026</span>
            </div>
            <p className="mt-2 max-w-[60ch] text-[0.9375rem] leading-relaxed text-sage">
              Built a dashboard that turns cooling-tower sensor data into heat load, fouling and the
              rupees lost to it, tower by tower.
            </p>
            <DimensionLine label="≈ 1 month" className="mt-5 max-w-sm" />
          </div>
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h3 className="text-lg font-semibold">B.Tech Mechanical Engineering, IIT Bombay</h3>
              <span className="font-mono text-xs text-sage">expected 2029</span>
            </div>
            <p className="mt-2 text-[0.9375rem] text-sage">Second year · Minor in Robotics</p>
            <p className="mt-1 font-mono text-xs text-sage">
              JEE Advanced rank <span className="text-copper">1834</span>
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Contact() {
  const links = [
    { href: "mailto:saumyahindocha@gmail.com", label: "saumyahindocha@gmail.com" },
    { href: "mailto:25b2218@iitb.ac.in", label: "25b2218@iitb.ac.in" },
    { href: "https://github.com/saumyahindocha", label: "github.com/saumyahindocha" },
  ];
  return (
    <section
      id="contact"
      aria-labelledby="contact-h"
      className="mx-auto max-w-6xl px-5 pt-20 sm:px-8"
    >
      <Reveal>
        <h2 id="contact-h" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Contact
        </h2>
        <p className="mt-3 text-sage">Email is the best way to reach me.</p>
        <ul className="mt-8 space-y-3">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="font-mono text-base break-all text-copper underline decoration-copper/40 underline-offset-[6px] transition-colors duration-200 hover:decoration-copper sm:text-xl"
                {...(l.href.startsWith("http") ? { rel: "me noopener", target: "_blank" } : {})}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
