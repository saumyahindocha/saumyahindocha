// Site-wide copy that is not tied to one project. Every fact here comes from a project page.

export const disciplines = [
  {
    key: "M",
    title: "Mechanical design and CAD",
    tools: "Fusion 360, laser cutting, 3D printing",
    example:
      "Cut the NIDS chassis from three 6 mm acrylic plates on M6 rods, and designed a pistol-grip remote for it.",
  },
  {
    key: "E",
    title: "Electronics and PCBs",
    tools: "EasyEDA, KiCad basics, perfboard",
    example:
      "Drew a 2-layer, 52 × 109 mm board for Pod, then built it on perfboard when the assembly quote came to about $90.",
  },
  {
    key: "C",
    title: "Controls and simulation",
    tools: "PID, Kalman filter, MATLAB",
    example:
      "Modelled NIDS as an inverted pendulum on wheels and tuned its PID in MATLAB around an open-loop pole at +8.5 s⁻¹.",
  },
  {
    key: "S",
    title: "Software",
    tools: "Python and FastAPI, C/C++, React, Flutter",
    example:
      "Specified and reviewed Station Parking: backend, supervisor dashboard, worker app and a one-command installer.",
  },
];

/** Real failures from the projects' "What broke" sections, newest first. */
export const bugLog = [
  {
    date: "10 Oct 2026",
    project: "Pod",
    slug: "pod",
    symptom: "Every touch reading came back as 0 or 8191.",
    fix: "I printed the raw readings on the screen, traced it to an open solder link from `GP4` to `T_DO` and resoldered it. The firmware now rejects anything above 4095 as a broken line.",
  },
  {
    date: "8 Oct 2026",
    project: "NIDS",
    slug: "nids-self-balancing-robot",
    symptom: "The IMU calibration had never been applied.",
    fix: "`calibrateAccelGyro(200)` passed 200 as a pointer, and `-fpermissive` hid the error. It now passes `&calib` and calls `init(calib)`.",
  },
  {
    date: "8 Oct 2026",
    project: "Pod",
    slug: "pod",
    symptom: "The PCB outline had a line the fab would have milled as a slot.",
    fix: "A stray 6.35 mm line from the jack footprint sat 2.2 mm inside the bottom edge. I removed it from the outline file before export.",
  },
  {
    date: "27 Sep 2026",
    project: "Station Parking",
    slug: "station-parking",
    symptom: "The install rehearsal ran at 392% CPU, with events 4.5 s late.",
    fix: "The plate finder ran on every frame. Running it on motion or every 5th frame brought CPU to about 160% and 95th-percentile latency to 0.8 s.",
  },
];
