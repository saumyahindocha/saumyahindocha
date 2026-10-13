// Site-wide copy that is not tied to one project.

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
