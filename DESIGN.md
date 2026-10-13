---
version: alpha
name: The Design Bench
description: Saumya Hindocha's portfolio design system. The site is a workbench seen from above. A deep-green self-healing cutting mat is the canvas, projects rest on it as tiles with soft, realistic shadows, and the only accent is warm brass, like solder pads and brass inserts. Calm and premium first, interactive second.

colors:
  mat: "#1d4b39"
  mat-deep: "#163d2e"
  mat-shade: "#10291f"
  surface: "#133528"
  surface-raised: "#17402f"
  ink: "#f2efe6"
  sage: "#a9bda4"
  sage-dim: "#7f977b"
  line: "rgb(242 239 230 / 0.14)"
  line-strong: "rgb(242 239 230 / 0.28)"
  brass: "#ddb06f"
  brass-deep: "#b8874a"
  on-brass: "#10291f"

typography:
  display:
    fontFamily: Manrope, system-ui, sans-serif
    fontSize: 60px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.03em
  h2:
    fontFamily: Manrope
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.015em
  h3:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.015em
  lead:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.65
  small:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  number:
    fontFamily: JetBrains Mono, ui-monospace, monospace
    fontSize: 18px
    fontWeight: 400
    fontFeature: tabular-nums
  silk:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0.14em
    textTransform: uppercase

spacing:
  unit: 4px
  grid-minor: 12px
  grid-major: 120px
  gutter-mobile: 20px
  gutter-desktop: 32px
  section-gap: 96px
  container: 1152px

radius:
  chip: 3px
  button: 4px
  tile: 6px

motion:
  ease: cubic-bezier(0.22, 1, 0.36, 1)
  fast: 150ms
  base: 240ms
  slow: 300ms
---

## Overview

The whole site is my bench seen from above. The canvas is a green self-healing cutting mat: a fine
12 px grid with a major line every 10 units (120 px), ruler ticks along the top and left edges,
faint 30°, 45° and 60° angle guides, and a light speckle texture. Projects sit on the mat as tiles,
the way I would lay parts out to show someone.

It must feel calm. Bench details (rulers, dimension lines, silkscreen labels, corner pads) are
seasoning. If a section has more than one of them, remove one.

## Colors

### Canvas

- `mat` is the page background and the base of the grid. `mat-deep` and `mat-shade` are for
  recessed strips (ruler dividers, list panels) and for text on brass.
- `surface` is a tile: a slightly darker, denser green so it reads as an object on the mat.

### Text

- `ink` (#F2EFE6) for headings and primary text: 8.6:1 on `mat`.
- `sage` for secondary text: 5.0:1 on `mat`, 6.0:1 on `mat-deep`.
- `sage-dim` only for decorative numbers and footnotes at 12 px or larger that are not essential.

### Accent

- `brass` is the one accent: primary button fill, link underlines, context labels, focus rings,
  corner pads, leader dots. 5.0:1 on `mat` when used as text.
- Never introduce a second accent. Status colours (red, amber, green) appear only inside sims and
  demos, never in page chrome.

## Typography

- **Manrope** for headings and body. **JetBrains Mono** for every number, label, spec, unit and
  designator.
- Headings use weight and tracking for hierarchy, not size jumps. Display tops out at 60 px.
- Silkscreen labels (`silk`) are small uppercase mono, like PCB designators: `SH-01 / NIDS`,
  `U1`, `R7`. Use them on tiles and list rows, not as eyebrows above every section heading.
- Numbers use `tabular-nums`. Units sit next to their number in the same mono run.
- No em-dashes in copy. No serif.

## Layout

### Grid and container

- Container 1152 px, gutters 20 px on mobile and 32 px on desktop. Sections are 96 px apart.
- Sections vary their layout family: split hero, 2×2 hairline grid, staggered tile bench, labelled
  list (heading column + content), dimensioned timeline, plain contact list.

### Responsive

- Works from 360 px. Every multi-column layout declares its single-column fallback.
- The staggered tile offset (`md:mt-16` on the right column) only applies at 768 px and up.
- The lamp light and tile tilt hover are disabled for touch and coarse pointers.

## Elevation and depth

Two shadow levels, both tinted to the mat (never pure black):

- `rest`: an inset 1 px top highlight, a tight contact shadow and a soft 24 px ambient shadow.
- `lift`: on hover or focus-within, the tile rises 4 px and straightens; the ambient shadow grows
  to 48 px.

Tiles rest with a tiny tilt (±0.4–0.6°) so they read as placed by hand. Never more than 1°.

## Shapes

- Chips 3 px, buttons 4 px, tiles 6 px. Nothing pill-shaped, nothing larger than 6 px.
- Corner pads: 6 px brass-outlined circles at two opposite tile corners, like mounting holes.

## Components

### Buttons

- Primary: `brass` fill, `on-brass` text, 4 px radius, soft tinted shadow, presses down 1 px.
- Secondary: transparent with a `line-strong` border, `ink` text.
- One label per intent across the site ("See projects", "Resume", "Open project").

### Project tile

Silk designator and status chip on top; title; context in brass mono; one-line summary; a spec strip
of three headline numbers; "Open project" and "Try the model" links. The title link stretches over
the whole tile; its focus ring is drawn on the tile edge.

### Status chip

`Built` and `Pilot-ready` in brass outline; `In progress` in a dashed sage outline.

### Spec strip

Three to five numbers in mono with a sage label underneath. Numbers come only from the repos or the
brief, never rounded up.

### Ruler strip

A measuring-tape divider: millimetre ticks, centimetre numbers in `sage-dim`. At most two per page.

### Dimension line

A CAD dimension with extension ticks, arrowheads and a centred mono label. Used for durations
("≈ 1 month"), drawing callouts and the 404 page ("nothing measured here").

### 3D models

Built procedurally in React Three Fiber from real dimensions in the repos, on a transparent
canvas so they sit on the mat with a contact shadow. Each loads lazily (after first paint for the
hero, on scroll for tiles), shows its line drawing until ready, and stops rendering off-screen.
Mouse users can orbit; on touch, dragging scrolls the page and a tap acts on the model.

### Desk lamp

Tiles also tilt up to ~5° toward the pointer with a soft glare, and a touch on the mat brightens
a small circle of grid lines under the finger. A very low-intensity radial lightening of the mat (6% warm white at the centre, 560 px radius)
that follows a mouse pointer. Off on touch devices and with `prefers-reduced-motion`.

## Motion

- 150–300 ms with the bench ease. Animate only `transform` and `opacity`.
- Content below the fold fades and rises 32 px once as it enters (about 1 s, glide ease). Content
  already on screen at load never waits. Nothing loops in the page chrome.
- No parallax and no autoplaying sound. Mouse-wheel scrolling eases on desktop (Lenis, at my request);
  touch scrolling is native. With reduced motion, reveals are instant,
  tiles do not move, sims start paused and the lamp is off.

## Do's and Don'ts

### Do

- Put every number in mono and source it from a repo or the brief.
- Say plainly when something is untested or unrecorded.
- Keep the AI-assisted part of my workflow visible: I own the engineering; agents help write
  firmware, and I review it.
- Use brass for focus rings, at 2 px with a 3 px offset.

### Don't

- Don't add a second accent colour, gradients on text, or glows.
- Don't put a silkscreen eyebrow above every section heading.
- Don't use a light mode or a theme toggle.
- Don't add clubs, awards, a photo slot or a contact form.
- Don't copy the reference site's blueprint theme, section names or wording.
