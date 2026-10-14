// Home-page copy. Every fact comes from a project page (content/projects/*.mdx) or from Saumya.

/** Per project: the line that opens its card, and a short name for the hero turntable. */
export const hooks: Record<string, { hook: string; short: string }> = {
  "nids-self-balancing-robot": {
    hook: "It wants to fall over in 0.12 seconds. It balanced for 50.",
    short: "NIDS robot",
  },
  "station-parking": {
    hook: "Built so 3,000 bikes a day never stop for a ticket.",
    short: "Parking gate",
  },
  "ss-filters-energy-audit": {
    hook: "Dirty cooling water has a price. This puts it in rupees.",
    short: "Cooling tower",
  },
  pod: {
    hook: "A music player I soldered together in one night.",
    short: "Pod",
  },
};

/** The failure reel: more of what broke, oldest first. */
export const failures = [
  {
    when: "2 Jun 2026",
    project: "NIDS",
    symptom: "The IR sensors sat on the pins the radio needed.",
    fix: "Pins 51 and 53 are SPI. IR moved to 30, 32 and 34; the NRF went to CE 48 and CSN 49.",
  },
  {
    when: "18 Aug 2026",
    project: "NIDS",
    symptom: "Given the same command, the two wheels spun in opposite directions.",
    fix: "Negating the left speed only stopped it. The fix is to swap the left motor’s wires.",
  },
  {
    when: "27 Sep 2026",
    project: "Station Parking",
    symptom: "Long number plates turned one bike into two.",
    fix: "A long plate could light up two peaks in the plate finder. Overlapping boxes on one line now merge.",
  },
  {
    when: "27 Sep 2026",
    project: "Station Parking",
    symptom: "The first full install failed on a machine with no GPU.",
    fix: "The plate models run on a CPU anyway, so CPU became the default and the GPU an add-on.",
  },
  {
    when: "7 Oct 2026",
    project: "Pod",
    symptom: "The laptop’s antivirus kept deleting the compiler.",
    fix: "All compiling moved to GitHub Actions, which publishes the firmware on every push.",
  },
  {
    when: "7 Oct 2026",
    project: "Pod",
    symptom: "The touch screen needed a hard press.",
    fix: "The library’s pressure cutoff was fixed at 300. A new driver made it adjustable; 60 works.",
  },
  {
    when: "8 Oct 2026",
    project: "Pod",
    symptom: "The PCB outline had a line the fab would have milled as a slot.",
    fix: "A stray 6.35 mm line sat 2.2 mm inside the bottom edge. Removed before export.",
  },
  {
    when: "8 Oct 2026",
    project: "NIDS",
    symptom: "The IMU calibration had never been applied.",
    fix: "200 was passed as a pointer and -fpermissive hid the error. It now passes &calib.",
  },
];
