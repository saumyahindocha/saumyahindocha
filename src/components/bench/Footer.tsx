import { Silk } from "./Silk";

export function Footer() {
  return (
    <footer className="relative z-10 mx-auto mt-24 flex max-w-6xl flex-col gap-2 px-5 pb-10 text-sm text-sage sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <p>
        Saumya Hindocha.{" "}
        <a
          href="https://github.com/saumyahindocha/saumyahindocha/tree/portfolio"
          className="text-ink underline decoration-brass/50 underline-offset-4 transition-colors hover:decoration-brass"
        >
          Source on GitHub
        </a>
      </p>
      <Silk>IIT Bombay</Silk>
    </footer>
  );
}
