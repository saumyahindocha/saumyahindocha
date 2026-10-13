import Link from "next/link";
import { AngleGuides } from "@/components/bench/AngleGuides";
import { DimensionLine } from "@/components/bench/DimensionLine";
import { PhotoPrint } from "@/components/bench/PhotoPrint";
import { PodPoster } from "@/components/bench/PodPoster";
import { ProjectTile } from "@/components/bench/ProjectTile";
import { Reveal } from "@/components/bench/Reveal";
import { RulerStrip } from "@/components/bench/RulerStrip";
import { Silk } from "@/components/bench/Silk";
import { disciplines, projects } from "@/content/placeholder";

export default function Home() {
  return (
    <>
      <Hero />
      <RulerStrip className="mt-6" />
      <WhatIDo />
      <Projects />
      <Currently />
      <Experience />
      <RulerStrip start={12} className="mt-24" />
      <Contact />
    </>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-10 pb-8 sm:px-8 md:grid-cols-[1fr_1.2fr] md:pt-16 lg:pt-20">
      <AngleGuides className="absolute -top-16 -left-24 hidden w-[520px] md:block" />
      <div className="relative">
        <p className="font-mono text-sm text-brass">Mechanical Design &amp; Robotics</p>
        <h1
          translate="no"
          className="mt-4 text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.03em] text-ink sm:text-6xl"
        >
          Saumya Hindocha
        </h1>
        <p className="mt-5 max-w-[44ch] text-lg leading-relaxed text-sage">
          I build machines where mechanical design meets electronics and code, and document every
          build from the breadboard up.
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

      <figure className="relative mx-auto w-full max-w-[480px] md:max-w-none">
        <div className="relative">
          <PodPoster className="h-auto w-full" />
          <PhotoPrint
            src="/media/pod-pico-above-screen.webp"
            alt="The Pod's Pico 2 W mounted above its 2.8 inch screen, held in a hand."
            width={560}
            height={1008}
            caption="Pico 2 W over the screen"
            tilt={5}
            priority
            className="absolute top-[14%] right-[1%] w-[31%]"
          />
        </div>
        <figcaption className="mt-2 text-center text-xs text-sage-dim">
          Pod, top view. An orbitable 3D model replaces this drawing in stage 3.
        </figcaption>
      </figure>
    </section>
  );
}

function WhatIDo() {
  return (
    <section aria-labelledby="what-i-do" className="mx-auto max-w-6xl px-5 pt-20 sm:px-8">
      <Reveal>
        <h2 id="what-i-do" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          What I do
        </h2>
        <p className="mt-4 max-w-[62ch] leading-relaxed text-sage">
          I own the engineering: hardware choices, wiring, mechanical design and testing. I write
          much of the firmware with AI coding agents and review it. Every project has a README and a
          dated build log.
        </p>
      </Reveal>
      <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
        {disciplines.map((d, i) => (
          <Reveal key={d.key} delay={i * 60} className="bg-mat-deep/85 p-6 sm:p-7">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-sm text-brass">{d.key}</span>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{d.title}</h3>
                <p className="mt-1 font-mono text-xs text-sage">{d.tools}</p>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink/85">{d.example}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Projects() {
  return (
    <section aria-labelledby="projects" className="mx-auto max-w-6xl px-5 pt-24 sm:px-8">
      <div className="flex items-end justify-between gap-4">
        <h2 id="projects" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Projects
        </h2>
        <Link href="/projects" className="text-sm text-sage transition-colors hover:text-ink">
          All projects
        </Link>
      </div>
      <ul className="mt-10 grid items-start gap-8 md:grid-cols-2 md:gap-x-10 md:gap-y-12">
        {projects.map((p, i) => (
          <Reveal
            as="li"
            key={p.code}
            delay={(i % 2) * 80}
            className={i % 2 === 1 ? "md:mt-16" : ""}
          >
            <ProjectTile project={p} />
          </Reveal>
        ))}
      </ul>
      <p className="mt-8 max-w-[70ch] text-xs leading-relaxed text-sage-dim">
        * Measured on held-out computer-generated plates, not yet on real bikes.
      </p>
    </section>
  );
}

function Currently() {
  const items = [
    {
      silk: "U1",
      title: "Pod",
      body: "Built on perfboard, touch working. Next: SD playback and Bluetooth tests, then the battery and charger.",
    },
    {
      silk: "R7",
      title: "EE 617 research project",
      body: "An ongoing research project in sensors and instrumentation, under the course professor.",
    },
  ];
  return (
    <section aria-labelledby="currently" className="mx-auto max-w-6xl px-5 pt-24 sm:px-8">
      <Reveal className="grid gap-8 md:grid-cols-[14rem_1fr]">
        <h2 id="currently" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Currently
        </h2>
        <ul className="divide-y divide-line border-y border-line">
          {items.map((it) => (
            <li key={it.title} className="flex gap-5 py-5">
              <Silk className="w-8 shrink-0 pt-1">{it.silk}</Silk>
              <div>
                <h3 className="font-semibold">
                  {it.title}
                  <span className="ml-3 font-mono text-xs font-normal text-sage">in progress</span>
                </h3>
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
              Built a real-time energy-audit dashboard for cooling towers: heat load, efficiency,
              fouling and savings in rupees.
            </p>
            <DimensionLine label="≈ 1 month" className="mt-5 max-w-sm" />
          </div>
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h3 className="text-lg font-semibold">B.Tech Mechanical Engineering, IIT Bombay</h3>
              <span className="font-mono text-xs text-sage">expected 2029</span>
            </div>
            <p className="mt-2 text-[0.9375rem] text-sage">Minor in Robotics</p>
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
                className="font-mono text-base break-all text-ink underline decoration-brass/50 underline-offset-[6px] transition-colors duration-200 hover:decoration-brass sm:text-xl"
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
