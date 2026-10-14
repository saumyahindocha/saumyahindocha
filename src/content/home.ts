// Home-page copy. Every fact comes from a project page (content/projects/*.mdx) or from Saumya.

/** One line per project to open its chapter, plus the failure it is told through. */
export const chapters: Record<
  string,
  {
    hook: string;
    wordmark: string;
    tryIt: string;
    broke: { when: string; symptom: string; fix: string };
  }
> = {
  "nids-self-balancing-robot": {
    hook: "It wants to fall over in 0.12 seconds. It balanced for 50.",
    wordmark: "NIDS",
    tryIt: "Click the robot to push it.",
    broke: {
      when: "Jun 2026",
      symptom: "Pressing the mode button froze the whole balance loop.",
      fix: "The debounce used delay(300). The rewrite debounces without blocking.",
    },
  },
  "station-parking": {
    hook: "Built so 3,000 bikes a day never stop for a ticket.",
    wordmark: "ANPR",
    tryIt: "Each plate is read as it crosses the line.",
    broke: {
      when: "27 Sep 2026",
      symptom: "The install rehearsal ran at 392% CPU, with events 4.5 s late.",
      fix: "Reading plates on motion or every 5th frame cut it to about 160% and 0.8 s.",
    },
  },
  "ss-filters-energy-audit": {
    hook: "Dirty cooling water has a price. This puts it in rupees.",
    wordmark: "TOWER",
    tryIt: "Its project page has a live audit you can tune.",
    broke: {
      when: "Jul 2026",
      symptom: "The first login only worked inside the platform it was built on.",
      fix: "I took the sign-in out of the frontend, so the dashboard opens without it.",
    },
  },
  pod: {
    hook: "A music player I soldered together in one night.",
    wordmark: "POD",
    tryIt: "Use the screen: it runs Pod’s own display code.",
    broke: {
      when: "10 Oct 2026",
      symptom: "Every touch reading came back as 0 or 8191.",
      fix: "An open solder link from GP4 to T_DO. Resoldered, and the firmware now rejects readings from an open line.",
    },
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
