import Link from "next/link";
import { Monogram } from "./Monogram";

const links = [
  { href: "/projects", label: "Projects" },
  { href: "/resume", label: "Resume" },
  { href: "/#contact", label: "Contact" },
];

export function Nav() {
  return (
    <header className="relative z-20">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 pt-3 sm:px-8"
      >
        <Link href="/" className="flex items-center gap-3 rounded-sm">
          <Monogram size={32} />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            Saumya Hindocha
          </span>
        </Link>
        <ul className="flex items-center gap-5 text-sm sm:gap-7">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-sage transition-colors duration-200 hover:text-ink"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
