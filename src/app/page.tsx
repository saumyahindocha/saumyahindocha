import Link from "next/link";
import { FailureReel } from "@/components/home/FailureReel";
import { Hero } from "@/components/home/Hero";
import { LitText } from "@/components/home/LitText";
import { WorkStack } from "@/components/home/WorkStack";
import { failures, hooks } from "@/content/home";
import { getProjects, toTile } from "@/lib/projects";

export default function Home() {
  const projects = getProjects().map(toTile);
  const stage = projects.map((p) => ({
    slug: p.slug,
    short: hooks[p.slug]?.short ?? p.title,
    summary: p.summary,
  }));
  return (
    <>
      <Hero items={stage} />
      <About />
      <section id="work" aria-labelledby="work-h" className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2
          id="work-h"
          className="text-[2.5rem] leading-[1] font-semibold tracking-[-0.045em] sm:text-6xl"
        >
          Four builds so far.
        </h2>
        <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-sage">
          Every model below is live. Push the robot, open up the Pod, watch a plate get read.
        </p>
        <div className="mt-12 md:mt-16">
          <WorkStack projects={projects} hooks={hooks} />
        </div>
        <p className="mt-8 text-xs leading-relaxed text-sage">
          * Station Parking’s plate accuracy is measured on held-out computer-generated plates, not
          yet on real bikes.{" "}
          <Link
            href="/projects"
            className="text-ink underline decoration-copper/50 underline-offset-4"
          >
            All projects
          </Link>
        </p>
      </section>
      <FailureReel items={failures} />
      <Contact />
    </>
  );
}

const facts = [
  {
    k: "Studying",
    v: "B.Tech Mechanical Engineering at IIT Bombay, minor in Robotics, expected 2029. JEE Advanced rank 1834.",
  },
  {
    k: "Building now",
    v: "Pod on perfboard, and an EE 617 research project in sensors and instrumentation.",
  },
  {
    k: "Where I started",
    v: "XLR8 in first year: a four-wheeled wireless line follower, built with a team. Also a Depron foam plane.",
  },
  { k: "Tools", v: "Fusion 360, EasyEDA, MATLAB, C/C++, Python, React, Flutter." },
];

function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-h"
      className="mx-auto max-w-6xl px-5 pt-8 pb-28 sm:px-8 md:pt-16 md:pb-40"
    >
      <h2 id="about-h" className="font-mono text-[0.8125rem] text-brass">
        About me
      </h2>
      <LitText
        className="mt-6 max-w-[30ch] text-[1.875rem] leading-[1.18] font-medium tracking-[-0.03em] text-ink sm:text-[2.6rem] lg:text-[3.1rem]"
        parts={[
          {
            text: "I’m Saumya, a second-year mechanical engineering student at IIT Bombay. I like",
          },
          { text: "machines you can pick up.", em: true },
          {
            text: "I model them in Fusion 360, solder the boards and test them on the bench. AI agents write much of the code; I review it and decide when it’s done.",
          },
        ]}
      />
      <dl className="mt-16 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((f) => (
          <div key={f.k} className="border-t border-line-strong pt-4">
            <dt className="text-sm font-semibold text-ink">{f.k}</dt>
            <dd className="mt-2 text-[0.9375rem] leading-relaxed text-sage">{f.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Contact() {
  const links = [
    { href: "https://github.com/saumyahindocha", label: "GitHub" },
    { href: "mailto:25b2218@iitb.ac.in", label: "25b2218@iitb.ac.in" },
  ];
  return (
    <section
      id="contact"
      aria-labelledby="contact-h"
      className="mx-auto max-w-6xl px-5 pt-24 pb-4 sm:px-8 md:pt-28"
    >
      <h2
        id="contact-h"
        className="max-w-[14ch] text-[2.75rem] leading-[1] font-semibold tracking-[-0.05em] sm:text-7xl"
      >
        The next build starts <span className="text-copper">with an email.</span>
      </h2>
      <a
        href="mailto:saumyahindocha@gmail.com"
        className="mt-10 inline-block font-mono text-lg break-all text-ink underline decoration-copper/60 underline-offset-[8px] transition-colors duration-200 hover:text-copper sm:text-2xl"
      >
        saumyahindocha@gmail.com
      </a>
      <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              className="text-sage transition-colors duration-200 hover:text-ink"
              {...(l.href.startsWith("http") ? { rel: "me noopener", target: "_blank" } : {})}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
