import Link from "next/link";
import { Reveal } from "@/components/bench/Reveal";
import { RulerStrip } from "@/components/bench/RulerStrip";
import { Chapter } from "@/components/home/Chapter";
import { ChapterRail } from "@/components/home/ChapterRail";
import { FailureReel } from "@/components/home/FailureReel";
import { Hero } from "@/components/home/Hero";
import { chapters, failures } from "@/content/home";
import { getProjects, toTile } from "@/lib/projects";

export default function Home() {
  const projects = getProjects().map(toTile);
  return (
    <>
      <Hero />
      <RulerStrip className="mt-4" />
      <ChapterRail items={projects.map((p) => ({ slug: p.slug, silk: p.silk }))} />
      <h2 className="sr-only">Projects</h2>
      {projects.map((p, i) => (
        <Chapter key={p.slug} project={p} copy={chapters[p.slug]} index={i} />
      ))}
      <p className="mx-auto max-w-6xl px-5 text-xs leading-relaxed text-sage sm:px-8">
        * Station Parking’s plate accuracy is measured on held-out computer-generated plates, not
        yet on real bikes.{" "}
        <Link
          href="/projects"
          className="text-ink underline decoration-brass/50 underline-offset-4"
        >
          All projects
        </Link>
      </p>
      <FailureReel items={failures} />
      <About />
      <RulerStrip start={12} className="mt-24" />
      <Contact />
    </>
  );
}

const facts = [
  {
    k: "Studying",
    v: "B.Tech Mechanical Engineering, IIT Bombay, minor in Robotics. Expected 2029.",
  },
  { k: "Internship", v: "SS Filters, July 2026: the cooling-tower energy audit." },
  {
    k: "Building now",
    v: "Pod on perfboard, and an EE 617 research project in sensors and instrumentation.",
  },
  {
    k: "Where I started",
    v: "XLR8 in first year: a four-wheeled wireless line follower, built with a team. Also a Depron foam plane.",
  },
  { k: "Tools", v: "Fusion 360, EasyEDA, MATLAB, C/C++, Python, React, Flutter." },
  { k: "JEE Advanced", v: "Rank 1834." },
];

function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-h"
      className="mx-auto max-w-6xl px-5 pt-16 sm:px-8 md:pt-24"
    >
      <div className="grid gap-8 md:grid-cols-12 md:gap-12">
        <Reveal className="md:col-span-4">
          <h2 id="about-h" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            About me
          </h2>
        </Reveal>
        <div className="md:col-span-8">
          <Reveal>
            <p className="font-display text-2xl leading-snug font-medium tracking-[-0.02em] text-ink sm:text-[2rem]">
              I like the moment a machine finally works,{" "}
              <span className="text-copper">and knowing exactly why it didn’t before.</span>
            </p>
            <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-sage">
              I pick the parts, wire them, design the mechanics and test everything on the bench. AI
              coding agents write much of the firmware and software; I review what they write and
              decide when it’s done.
            </p>
          </Reveal>
          <Reveal>
            <dl className="mt-10 grid gap-x-10 border-t border-line sm:grid-cols-2">
              {facts.map((f) => (
                <div key={f.k} className="border-b border-line py-4">
                  <dt className="font-mono text-[0.6875rem] tracking-[0.12em] text-sage uppercase">
                    {f.k}
                  </dt>
                  <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink">{f.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
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
        <h2
          id="contact-h"
          className="max-w-[16ch] text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl"
        >
          The next build starts <span className="text-copper">with an email.</span>
        </h2>
        <ul className="mt-10 space-y-3">
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
