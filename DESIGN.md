---
version: alpha
name: The Design Bench
description: Saumya Hindocha's portfolio design system. The site is a workbench seen from above. A deep-green cutting mat after dark is the canvas, its grid barely visible; projects sit on it as cards and live 3D models, and one accent, copper (like bare PCB traces), marks the controls and the text that matters most. Calm and premium first, interactive second.

colors:
  mat: "#0f1a15"
  mat-deep: "#0c1511"
  mat-shade: "#08100c"
  surface: "#14211b"
  surface-raised: "#1a2a23"
  ink: "#eeeae1"
  sage: "#a6b3aa"
  sage-dim: "#7f8f85"
  line: "rgb(238 234 225 / 0.1)"
  line-strong: "rgb(238 234 225 / 0.22)"
  brass: "#eaa682"
  brass-deep: "#c98462"
  on-brass: "#08100c"
  copper: "#f4b08c"

typography:
  display:
    fontFamily: Geist, system-ui, sans-serif
    fontSize: 60px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.03em
  h2:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.015em
  h3:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.015em
  lead:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.65
  small:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  number:
    fontFamily: Geist Mono, ui-monospace, monospace
    fontSize: 18px
    fontWeight: 400
    fontFeature: tabular-nums
  silk:
    fontFamily: Geist Mono
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
  chip: 6px
  button: 10px
  panel: 14px
  card: 20px

motion:
  ease: cubic-bezier(0.22, 1, 0.36, 1)
  fast: 150ms
  base: 240ms
  slow: 300ms
---

## Overview

The whole site is my bench at night, under one desk lamp. The canvas is a very dark green cutting
mat: a 12 px grid with a major line every 120 px, drawn so faintly it reads as texture, a soft
green light pool at the top of the page and a light speckle. Projects sit on it as cards with live
3D models, the way I would lay parts out to show someone.

It must feel calm and expensive: big confident type, lots of dark space, one accent. Bench details
(dimension lines, silkscreen labels, corner pads) are seasoning. If a section has more than one of
them, remove one.

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

- One accent family. `brass` is now a slightly deeper copper (the token keeps its old name) for
  controls: context labels, focus rings, slider thumbs, chips. `copper` is the primary button fill.
- `copper` (#F4B08C) is for the text that matters most: headline numbers in spec strips, the one
  emphasis line in the hero, dates in the bug log, bold text in write-ups, contact links. 5.4:1 on
  `mat`, 7.3:1 on `surface`. Use it on text only, never as a fill, and no more than one copper
  sentence per section.
- No third accent. Status colours (red, amber, green) appear only inside sims and demos, never in
  page chrome.

## Typography

- **Geist** for headings and body, **Geist Mono** for every number, label, spec, unit and
  designator. One family keeps it quiet; hierarchy comes from size, weight and tight tracking.
- The home hero headline goes up to 92 px with -0.05em tracking; section headings 60 to 72 px.
- Silkscreen labels (`silk`) are small uppercase mono, like PCB designators: `SH-01 / NIDS`,
  `U1`, `R7`. Use them on tiles and list rows, not as eyebrows above every section heading.
- Numbers use `tabular-nums`. Units sit next to their number in the same mono run.
- No em-dashes in copy. No serif.

## Layout

### Grid and container

- Container 1152 px, gutters 20 px on mobile and 32 px on desktop. Sections are 96 px apart.
- Home, in order: split hero (headline left, 3D turntable right), About me (one large paragraph
  that lights up word by word, then four short facts), the work as a stack of sticky cards, the
  sideways failure reel, and a big contact line. No timelines.

### Responsive

- Works from 360 px. Every multi-column layout declares its single-column fallback.
- The work cards stack (stick and slide over each other) only at 768 px and up; on phones they are a
  plain list with the model on top. The failure reel pans sideways on desktop and is a swipeable
  row on phones.
- The lamp light and tile tilt hover are disabled for touch and coarse pointers.

## Elevation and depth

Two shadow levels, both tinted to the mat (never pure black):

- `rest`: an inset 1 px top highlight, a tight contact shadow and a soft 24 px ambient shadow.
- `lift`: on hover or focus-within, the tile rises 4 px and straightens; the ambient shadow grows
  to 48 px.

Tiles rest with a tiny tilt (±0.4–0.6°) so they read as placed by hand. Never more than 1°.

## Shapes

- Chips 6 px, buttons 10 px, inner panels (model windows) 14 px, cards 20 px. Nothing pill-shaped.
- Corner pads: 6 px brass-outlined circles at two opposite tile corners, like mounting holes.

## Components

### Buttons

- Primary: `copper` fill, `on-brass` text, 10 px radius, presses down 1 px.
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
canvas so they sit on the mat with a contact shadow. Each loads lazily (after the first
interaction), shows a still or its line drawing until ready, and stops rendering off-screen.
Mouse users can orbit; on touch, dragging scrolls the page and a tap acts on the model.

The hero turntable (`src/three/TurntableScene.tsx`) shows one build at a time on a round plinth
with a copper rim, turning slowly. It steps through the four builds on its own; a copper bar under
the build's name shows the time left, hovering holds it, and the names switch it. The robot gets
pushed now and then and can be clicked; the Pod keeps its screen to the viewer and comes apart while
hovered. Each work card has the project's own live model.

### Desk lamp

Tiles also tilt up to ~5° toward the pointer with a soft glare, and a touch on the mat brightens
a small circle of grid lines under the finger. A very low-intensity radial lightening of the mat (6% warm white at the centre, 560 px radius)
that follows a mouse pointer. Off on touch devices and with `prefers-reduced-motion`.

## Motion

- 150–300 ms with the bench ease. Animate only `transform` and `opacity`.
- Content below the fold fades and rises 32 px once as it enters (about 1 s, glide ease). Content
  already on screen at load never waits. Nothing loops in the page chrome.
- Scroll motion is allowed where it explains something: the About paragraph lights up at reading
  pace, each work card settles back as the next slides over it, the failure reel pans. No
  decorative parallax, no autoplaying sound. Mouse-wheel scrolling eases on desktop (Lenis); touch
  scrolling is native. With reduced motion, everything shows at once, nothing pins or auto-advances,
  tiles do not move, sims start paused and the lamp is off.

## Do's and Don'ts

### Do

- Put every number in mono and source it from a repo or the brief.
- Say plainly when something is untested or unrecorded.
- Keep the AI-assisted part of my workflow visible: I own the engineering; agents help write
  firmware, and I review it.
- Use `brass` (deep copper) for focus rings, at 2 px with a 3 px offset.

### Don't

- Don't add a third accent colour, gradients on text, or glows.
- Don't put a silkscreen eyebrow above every section heading.
- Don't use a light mode or a theme toggle.
- Don't add clubs, awards, a photo slot or a contact form.
- Don't copy the reference site's blueprint theme, section names or wording.
