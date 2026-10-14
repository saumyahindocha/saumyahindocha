import Link from "next/link";
import { HeroStage, type StageItem } from "./HeroStage";

export function Hero({ items }: { items: StageItem[] }) {
  return (
    <section className="relative">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pt-10 pb-20 sm:px-8 md:min-h-[calc(100svh-4rem)] md:grid-cols-12 md:items-center md:gap-10 md:pt-4 md:pb-12">
        <div className="md:col-span-6">
          <p className="font-mono text-[0.8125rem] text-sage">
            Saumya Hindocha <span className="text-sage-dim">/</span> Mechanical Engineering, IIT
            Bombay
          </p>
          <h1 className="mt-6 text-[3.4rem] leading-[0.95] font-semibold tracking-[-0.05em] text-ink sm:text-7xl lg:text-[5.75rem]">
            Machines that work. <span className="text-copper">Eventually.</span>
          </h1>
          <p className="mt-7 max-w-[36ch] text-lg leading-relaxed text-sage sm:text-xl sm:leading-relaxed">
            I design, wire and program small machines, then write down exactly what broke on the
            way.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#work"
              className="rounded-[10px] bg-copper px-5 py-3 text-sm font-semibold text-mat-shade transition-[transform,background-color] duration-200 hover:bg-[#f8c3a5] active:translate-y-px"
            >
              See the work
            </a>
            <Link
              href="/resume"
              className="rounded-[10px] border border-line-strong px-5 py-3 text-sm font-medium text-ink transition-colors duration-200 hover:border-ink/50 active:translate-y-px"
            >
              Resume
            </Link>
          </div>
        </div>
        <div className="md:col-span-6">
          <HeroStage items={items} />
        </div>
      </div>
    </section>
  );
}
