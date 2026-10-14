---
name: run-portfolio
description: Build, run, serve and screenshot Saumya's portfolio site (Next.js static export) at phone and desktop width. Use when asked to run, start, preview, test or screenshot the site, or to check a visual change in the real pages.
---

# Run the portfolio

A Next.js 16 static export. The agent path is: build to `out/`, serve it, and drive it with
`driver.mjs` (Playwright on the pre-installed Chromium), which saves screenshots at 390 px and
1440 px. Paths are relative to the repo root on the `portfolio` branch.

## Setup and checks (what CI runs)

```bash
npm ci
npm run lint && npm run typecheck && npm test && npm run build   # 42 tests; build writes out/
```

## Run (agent path)

```bash
npx serve@14 out -l 4173 &          # static export, as Vercel serves it
node .claude/skills/run-portfolio/driver.mjs http://localhost:4173/ /tmp/shots
node .claude/skills/run-portfolio/driver.mjs http://localhost:4173/projects/pod /tmp/shots-pod "main"
```

Saves `desktop-fold.png`, `desktop-full.png`, `mobile-fold.png`, `mobile-full.png`, and with a
selector `element.png` (phone width). Open the PNGs and look at them.

For live editing use `npx next dev -p 3000` and point the driver at `http://localhost:3000/`.

## Gotchas

- `import "playwright"` in the driver resolves from the repo's `node_modules`. Its bundled headless
  shell is not downloaded here, so the driver launches `/opt/pw-browsers/chromium` (override with
  `CHROMIUM_PATH`). Don't run `playwright install`.
- The driver emulates `prefers-reduced-motion: reduce`. Without it, below-the-fold sections wait
  for scroll reveals and full-page shots come out with empty gaps.
- 3D models only load after the first scroll, tap, mouse move or key (`src/lib/engaged.ts`), so
  screenshots show each tile's photo or drawing, not the model.
- `next dev` writes an `AGENTS.md` at the repo root. Delete it; don't commit it.
- Killing the dev server with `pkill -f "next dev"` inside a longer bash command kills that shell
  too (the pattern matches its own command line). Kill it in a separate command.
- The round "N" badge bottom-left is the Next dev indicator; it is not on the built site.
