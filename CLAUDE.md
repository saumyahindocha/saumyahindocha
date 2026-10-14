# Saumya Hindocha's portfolio

Next.js 16 (App Router, static export to `out/`), TypeScript, Tailwind v4, React Three Fiber.
Read this before changing anything; the design system is in [DESIGN.md](DESIGN.md).

## Where things live

- **Repo and branch.** The site lives on the `portfolio` branch of `saumyahindocha/saumyahindocha`.
  `main` of that repo is Saumya's GitHub profile README: never touch it, never target it with a PR.
  Vercel deploys `portfolio` to production; every other branch gets a preview link.
- `content/projects/<slug>.mdx`: one file per project (schema below). Pages, tiles, `/projects`,
  and the sitemap all read from these.
- `content/resume.json`: the resume. `scripts/resume-pdf.mjs` builds the PDF before every build.
- `src/sims/<name>/`: pure TypeScript simulations with Vitest tests, no React.
- `src/components/sims/`: the lab UIs (sliders, plots) on project pages.
- `src/three/`: React Three Fiber scenes. `src/components/bench/`: layout pieces.
- `tools/`: offline generators (Pod display compiled to wasm, remote PCB renders). Their output is
  committed under `public/`, so the build never runs them.

```
npm run dev         # http://localhost:3000
npm run lint && npm run typecheck && npm test && npm run build    # what CI runs
```

## The honesty rule

Every number on the site comes from a project repo (README, PROGRESS.md, docs, code, MATLAB) or
from Saumya directly. Nothing is rounded up, invented or implied.

- If a number is assumed (a sim parameter, noise level), the page says so next to it.
- If something is untested, planned or not fitted yet, say that plainly.
- Keep the AI-assisted workflow visible: Saumya owns the engineering; AI agents help write the
  firmware and code, and Saumya reviews it.
- Never publish: a photo of Saumya, clubs, awards, a contact form, the CPI anywhere but the resume
  PDF, or the Pod touch-debug photo (it shows a real footballer wallpaper).
- The SS Filters page must not mention Emergent or a mentor.
- JEE Mains rank stays off the site until Saumya gives the exact number.

## Design rules (short version of DESIGN.md)

- One canvas: the green cutting mat with its 12 px / 120 px grid. Brass for controls, copper for
  the most important text (headline numbers, one emphasis line, key links). No light mode, no
  third accent colour, no gradient text.
- Bricolage Grotesque for headings, Manrope for body, JetBrains Mono for every number, unit, code
  and label.
- Tiles rest on the mat with soft shadows and lift slightly on hover.
- The home page is a 3D bench hero (all four builds on one mat, `src/three/BenchScene.tsx`),
  then one scroll chapter per project (`src/components/home/Chapter.tsx`), a failure reel, a short
  About and contact. Chapter copy and the reel live in `src/content/home.ts`, sourced from the MDX.
- No project is the centrepiece: every project gets an equal chapter, in `code` order, each with
  its own model. Keep it that way when adding projects (add it to the bench too).
- Motion: transform and opacity only, eased desktop wheel scroll (Lenis), a white loupe that
  follows the mouse and a touch glow on phones. Scroll-driven effects read `--p` from
  `useScrollProgress` (`src/lib/scroll.ts`, no React state per frame); on desktop chapters pin and
  reveal step by step, on phones they reveal as they scroll in. Everything respects
  `prefers-reduced-motion` (all steps shown, nothing pinned).
- Focus rings: brass, 2 px, visible on every control.

## Performance budget (check before merging anything visual)

Lighthouse mobile ≥ 90 in all four categories, LCP < 2.5 s, CLS 0, under 200 KB of JS on the home
page before 3D. To stay there:

- 3D scenes load only after the visitor's first scroll, tap, mouse move or key (`useEngaged` in
  `src/lib/engaged.ts`), and only when on screen. Until then the tile shows its photo or drawing.
- Never hide content that is on screen at load (`Reveal` only hides what is below the fold).
- Fonts use `display: optional`. Images are WebP with width and height set.
- The hero shows `public/media/bench-poster.webp` until the scene loads (on phones only after the
  first touch, so the headline is the LCP). After changing `BenchScene`, re-render it:
  `npm run build && npx serve@14 out -l 4173`, then `node tools/bench-poster/render.mjs http://localhost:4173/`.

## Content schema

Frontmatter of `content/projects/<slug>.mdx` (types in `src/lib/types.ts`, required keys checked in
`src/lib/projects.ts`; the build fails with the missing key's name):

| Key                      | Notes                                                                            |
| ------------------------ | -------------------------------------------------------------------------------- |
| `title`, `slug`          | `slug` must equal the file name                                                  |
| `code`                   | `SH-NN`, sets the order                                                          |
| `context`                | e.g. Personal, Internship, Freelance, Course                                     |
| `dates`, `role`, `team`  | role written neutrally from what the repo shows                                  |
| `status`                 | `Built`, `In progress` or `Pilot-ready`                                          |
| `summary`                | one sentence                                                                     |
| `headline`               | 3–4 `{value, label}` numbers for the project page                                |
| `tags`, `areas`          | `areas` drives the `/projects` filter                                            |
| `repo`, `links`, `media` | media: `{src, alt, caption, width, height, video?}` under `public/media/<slug>/` |
| `model`                  | optional: `nids`, `pod`, `gate` or `tower`. Leave out for a photo-only project   |
| `lessons`                | the "What I took away" bullets                                                   |
| `tile`                   | `{silk, tilt, cover, headline}`: three short numbers for the tile                |

Body: `## Why it exists`, `## How it works`, `## The build`, `## What broke and how I fixed it`,
`## What I took away` (level-2 headings become the page's side navigation).

**Adding a project** = one MDX file plus its media. A model is optional: add a scene in
`src/three/`, a key to `ModelKey`, a branch in `ModelWindow`, and, for a lab, a sim in `src/sims/`
with tests against numbers from the repo and an entry in `LAB` in `src/app/projects/[slug]/page.tsx`.

## Weekly update workflow

A project is **ready to publish** when its repo has a `portfolio.md` at the root (template:
[docs/portfolio.md](docs/portfolio.md)) or a GitHub release tag.

1. Scan Saumya's public repos. Look for new ready projects, and for meaningful progress on
   existing ones (new dated entries in `PROGRESS.md`, new releases).
2. Draft the update on a new branch off `portfolio`: the MDX file, media (WebP, no faces, nothing
   on the never-publish list), and a model or sim only where it fits.
3. Run lint, typecheck, tests and build; screenshot changed pages at 390 px and 1440 px.
4. Open a pull request **into `portfolio`**. Vercel posts a preview link on it.
5. The PR description lists exactly what changed, the repo file each new number came from, and
   anything Saumya must confirm. Attach the screenshots.
6. **Never merge or publish without Saumya's approval.** Saumya approves by merging.
