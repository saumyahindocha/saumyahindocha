/*
  A synthetic commuter day at the station lot, ported from the repo's own
  full-day simulator (Car-parking-software backend/sim/simulator.py):
  - 40 % monthly-pass holders, 2 % one-time visitors, the rest walk-ins
  - entries: 72 % in a morning peak ~N(8:40, 45 min), 18 % spread over
    10:30–16:00, 10 % ~N(17:30, 50 min), all within 06:00–21:00
  - morning commuters mostly come back ~N(18:45, 50 min); others stay ~N(150, 80) min
  - 2 % of reads unreadable and 2 % misread, at entry and at exit
  - a quarter of walk-in payments in cash, the rest UPI
  Plates are made up in the simulator's format. Times are minutes after midnight.
*/

import { charge } from "./tariff";

export type Read = "OK" | "UNREAD" | "MISREAD";
export type Rider = {
  id: number;
  plate: string;
  kind: "PASS" | "WALKIN" | "ONETIME";
  entry: number;
  exit: number;
  entryGate: 0 | 1;
  exitGate: 0 | 1;
  entryRead: Read;
  exitRead: Read;
  entryMisread?: string;
  exitMisread?: string;
  pay: "UPI" | "CASH" | "NONE";
  chargePaise: number;
};

const STATES = ["MH", "MH", "MH", "MH", "MH", "MH", "MH", "MH", "KA", "GJ", "DL", "TS", "MP"];
const LETTERS = "ABCDEFHJKLMNPRTUVWXY";
const CONFUSE: Record<string, string> = {
  B: "8",
  "8": "B",
  "0": "O",
  O: "0",
  "5": "S",
  S: "5",
  "2": "Z",
  Z: "2",
  "1": "I",
  "6": "G",
  G: "6",
};

export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeDay(n = 3000, seed = 7): Rider[] {
  const rnd = mulberry(seed);
  const gauss = (mu: number, sd: number) =>
    mu + sd * Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)];
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const used = new Set<string>();
  const plate = () => {
    for (;;) {
      const p =
        pick(STATES) +
        String(int(1, 50)).padStart(2, "0") +
        pick([...LETTERS]) +
        pick([...LETTERS]) +
        String(int(1, 9999)).padStart(4, "0");
      if (!used.has(p)) {
        used.add(p);
        return p;
      }
    }
  };
  const misread = (p: string) => {
    const c = [...p];
    if (rnd() < 0.6) {
      const idx = c.map((ch, i) => (ch in CONFUSE ? i : -1)).filter((i) => i >= 0);
      if (idx.length) {
        const i = pick(idx);
        c[i] = CONFUSE[c[i]];
        return c.join("");
      }
    }
    const i = int(c.length - 4, c.length - 1);
    c[i] = pick([..."0123456789"].filter((d) => d !== c[i]));
    return c.join("");
  };
  const sampleEntry = () => {
    const r = rnd();
    let m: number;
    if (r < 0.72) m = gauss(8 * 60 + 40, 45);
    else if (r < 0.9) m = 10 * 60 + 30 + rnd() * (5.5 * 60);
    else m = gauss(17 * 60 + 30, 50);
    return Math.min(Math.max(m, 6 * 60), 21 * 60);
  };
  const sampleStay = (entry: number) => {
    if (entry < 10 * 60 && rnd() < 0.85) {
      const back = gauss(18 * 60 + 45, 50);
      if (back > entry + 120) return back - entry;
    }
    return Math.max(20, gauss(150, 80));
  };
  const read = (): { r: Read; bad: boolean } => {
    const x = rnd();
    return x < 0.02
      ? { r: "UNREAD", bad: true }
      : x < 0.04
        ? { r: "MISREAD", bad: true }
        : { r: "OK", bad: false };
  };

  const nPass = Math.floor(n * 0.4);
  const nOne = Math.floor(n * 0.02);
  const riders: Rider[] = [];
  for (let i = 0; i < n; i++) {
    const kind = i < nPass ? "PASS" : i < nPass + nOne ? "ONETIME" : "WALKIN";
    const entry = sampleEntry();
    const exit = Math.min(entry + sampleStay(entry), 23 * 60 + 30);
    const er = read();
    const xr = read();
    const p = plate();
    let pay: Rider["pay"] = "NONE";
    if (kind !== "PASS") {
      const x = rnd();
      pay = x < 0.012 ? "NONE" : x < 0.06 + 0.25 * 0.94 && x >= 0.06 ? "CASH" : "UPI";
    }
    riders.push({
      id: i,
      plate: p,
      kind,
      entry,
      exit,
      entryGate: rnd() < 2 / 3 ? 0 : 1,
      exitGate: rnd() < 1 / 3 ? 0 : 1,
      entryRead: er.r,
      exitRead: xr.r,
      entryMisread: er.r === "MISREAD" ? misread(p) : undefined,
      exitMisread: xr.r === "MISREAD" ? misread(p) : undefined,
      pay,
      chargePaise: kind === "PASS" ? 0 : charge(exit - entry),
    });
  }
  return riders;
}

export type DayStats = {
  inside: number;
  passInside: number;
  entered: number;
  exited: number;
  upiPaise: number;
  cashPaise: number;
  review: number;
};

/** The dashboard at minute `t`: money is counted when a session closes, at the tariff charge. */
export function statsAt(day: Rider[], t: number): DayStats {
  const s: DayStats = {
    inside: 0,
    passInside: 0,
    entered: 0,
    exited: 0,
    upiPaise: 0,
    cashPaise: 0,
    review: 0,
  };
  for (const r of day) {
    if (r.entry > t) continue;
    s.entered++;
    if (r.entryRead === "UNREAD") s.review++;
    if (r.exit <= t) {
      s.exited++;
      if (r.exitRead === "UNREAD") s.review++;
      if (r.pay === "UPI") s.upiPaise += r.chargePaise;
      if (r.pay === "CASH") s.cashPaise += r.chargePaise;
    } else {
      s.inside++;
      if (r.kind === "PASS") s.passInside++;
    }
  }
  return s;
}

/** Entries and exits in each hour from 05:00 to 24:00. */
export function hourly(day: Rider[]): { hour: number; in: number; out: number }[] {
  const rows = Array.from({ length: 19 }, (_, i) => ({ hour: i + 5, in: 0, out: 0 }));
  for (const r of day) {
    rows[Math.floor(r.entry / 60) - 5].in++;
    rows[Math.min(18, Math.floor(r.exit / 60) - 5)].out++;
  }
  return rows;
}

export const prettyPlate = (p: string) =>
  `${p.slice(0, 2)} ${p.slice(2, 4)} ${p.slice(4, 6)} ${p.slice(6)}`;
