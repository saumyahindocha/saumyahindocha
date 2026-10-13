// Stage 1 placeholder data. Stage 2 replaces this with content/projects/*.mdx.
// Numbers here are taken from the brief; final wording and sources come in stage 2.

export type Status = "Built" | "In progress" | "Pilot-ready";

export type Headline = { value: string; label: string };

export type TileMedia =
  | { kind: "photo"; src: string; width: number; height: number; alt: string }
  | { kind: "drawing"; name: "cooling-tower" };

export type ModelKey = "nids" | "pod" | "gate" | "tower";

export type ProjectTileData = {
  code: string;
  silk: string;
  slug: string;
  title: string;
  summary: string;
  context: string;
  status: Status;
  headlines: [Headline, Headline, Headline];
  tilt: number;
  media: TileMedia;
  model: ModelKey;
};

export const projects: ProjectTileData[] = [
  {
    code: "SH-01",
    silk: "J1 · NIDS",
    slug: "nids-self-balancing-robot",
    title: "NIDS",
    summary: "A two-wheeled self-balancing robot. I led a team of four.",
    context: "ITSP 2026",
    status: "Built",
    headlines: [
      { value: "~50 s", label: "unassisted balance" },
      { value: "+8.5 s⁻¹", label: "open-loop pole" },
      { value: "₹5.6–9.2k", label: "bill of materials" },
    ],
    tilt: -0.4,
    model: "nids",
    media: {
      kind: "photo",
      src: "/media/nids-assembled.webp",
      width: 900,
      height: 794,
      alt: "The NIDS robot on a bench: three acrylic plates on threaded rods, two wheels, motor driver and LiPo on top.",
    },
  },
  {
    code: "SH-02",
    silk: "K3 · ANPR",
    slug: "station-parking",
    title: "Station Parking",
    summary: "Number-plate parking system for a railway-station two-wheeler lot.",
    context: "Software",
    status: "Pilot-ready",
    headlines: [
      { value: "~3,000", label: "movements a day, each way" },
      { value: "99.4%", label: "plates right when confident*" },
      { value: "87+134+31", label: "tests passing" },
    ],
    tilt: -0.6,
    model: "gate",
    media: {
      kind: "photo",
      src: "/media/parking-dashboard-live.webp",
      width: 1100,
      height: 650,
      alt: "Station Parking dashboard, live view: vehicles inside, revenue, cash, review queue and movements per gate per hour.",
    },
  },
  {
    code: "SH-03",
    silk: "P4 · SSF",
    slug: "ss-filters-energy-audit",
    title: "Cooling-tower energy audit",
    summary: "A live energy-audit dashboard for cooling towers at SS Filters.",
    context: "Internship",
    status: "Built",
    headlines: [
      { value: "Jul 2026", label: "about 1 month" },
      { value: "28 °C", label: "design wet bulb" },
      { value: "3.517 kW", label: "per ton of refrigeration" },
    ],
    tilt: 0.5,
    model: "tower",
    media: { kind: "drawing", name: "cooling-tower" },
  },
  {
    code: "SH-04",
    silk: "U1 · POD",
    slug: "pod",
    title: "Pod",
    summary: "A pocket music player on a Pico 2 W with Bluetooth and album art.",
    context: "Personal",
    status: "In progress",
    headlines: [
      { value: "240×320", label: "touch UI" },
      { value: "57×115×24", label: "mm, device" },
      { value: "52×109", label: "mm PCB, 2 layers" },
    ],
    tilt: -0.4,
    model: "pod",
    media: {
      kind: "photo",
      src: "/media/pod-perfboard-underside.webp",
      width: 800,
      height: 957,
      alt: "Underside of the Pod perfboard: solder bridges and red, yellow and black wire links.",
    },
  },
];

export const disciplines = [
  {
    key: "M",
    title: "Mechanical design & CAD",
    tools: "Fusion 360",
    example: "NIDS chassis: three laser-cut acrylic plates on M6 rods.",
  },
  {
    key: "E",
    title: "Electronics & PCB",
    tools: "EasyEDA · KiCad basics · perfboard",
    example: "NIDS remote: a custom EasyEDA PCB for the NRF24L01 link, built on perfboard.",
  },
  {
    key: "C",
    title: "Controls & simulation",
    tools: "PID · Kalman filter · MATLAB",
    example: "Balance model and PID tuned in MATLAB for NIDS.",
  },
  {
    key: "S",
    title: "Software systems",
    tools: "Python/FastAPI · C/C++ · React · Flutter",
    example: "Station Parking: backend, dashboard, worker app, installer.",
  },
];
