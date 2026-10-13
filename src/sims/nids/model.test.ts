import { describe, expect, test } from "vitest";
import { roots } from "../lib/poly";
import { closedLoop, dcGain, fullLoopPoles, MATLAB_GAINS, plantTF, stepResponse } from "./model";
import { DEFAULT_OPTIONS, NidsSim, OUTER } from "./sim";

// Reference values from self-balancing-bot: matlab/balance_model.m and docs/simulation.md.
describe("NIDS model matches balance_model.m", () => {
  test("plant θ(s)/V(s) ≈ 1.75 s / (s³ + 1.68 s² − 75.6 s − 101)", () => {
    const G = plantTF();
    expect(G.num.length).toBe(2);
    expect(G.num[0]).toBeCloseTo(1.75, 2);
    expect(G.num[1]).toBeCloseTo(0, 9);
    expect(G.den[1]).toBeCloseTo(1.68, 2);
    expect(G.den[2]).toBeCloseTo(-75.6, 1);
    expect(G.den[3]).toBeCloseTo(-101, 0);
  });

  test("open-loop poles about +8.5, −8.9 and −1.3", () => {
    const p = roots(plantTF().den).map((c) => c.re);
    expect(p[0]).toBeCloseTo(-8.9, 1);
    expect(p[1]).toBeCloseTo(-1.33, 1);
    expect(p[2]).toBeCloseTo(8.55, 1);
  });

  test("closed-loop poles −172.3 and −2.04 ± 1.83j with the final gains", () => {
    const { poles } = closedLoop(MATLAB_GAINS);
    expect(poles).toHaveLength(3);
    expect(poles[0].re).toBeCloseTo(-172.3, 1);
    expect(poles[0].im).toBe(0);
    expect(poles[1].re).toBeCloseTo(-2.04, 2);
    expect(Math.abs(poles[1].im)).toBeCloseTo(1.83, 2);
    expect(poles[2].re).toBeCloseTo(-2.04, 2);
  });

  test("final value 1.078 and a ~17 ms 10–90 % rise", () => {
    const cl = closedLoop(MATLAB_GAINS);
    const fv = dcGain(cl);
    expect(fv).toBeCloseTo(1.078, 3);
    const { t, y } = stepResponse(cl, 0.2, 5e-5);
    const t10 = t[y.findIndex((v) => v >= 0.1 * fv)];
    const t90 = t[y.findIndex((v) => v >= 0.9 * fv)];
    expect((t90 - t10) * 1000).toBeGreaterThan(14);
    expect((t90 - t10) * 1000).toBeLessThan(20);
  });

  test("pitch-only PID leaves the wheel modes at the origin; the outer loop moves them left", () => {
    const pitchOnly = fullLoopPoles(MATLAB_GAINS);
    expect(pitchOnly.filter((c) => Math.hypot(c.re, c.im) < 1e-4)).toHaveLength(2);
    const withOuter = fullLoopPoles(MATLAB_GAINS, OUTER).map((c) => c.re);
    // One pole stays at 0: with θ held at 0, any matching (∫θ, p) pair is an equilibrium.
    expect(withOuter.filter((r) => Math.abs(r) < 1e-6)).toHaveLength(1);
    expect(withOuter.filter((r) => r > 1e-6)).toHaveLength(0);
    expect(withOuter.filter((r) => r < -1)).toHaveLength(4);
  });
});

describe("live sim", () => {
  const settle = (s: NidsSim, seconds: number) => {
    for (let i = 0; i < seconds * 10; i++) s.advance(0.1);
  };

  test("recovers from a push with the MATLAB gains", () => {
    const s = new NidsSim(DEFAULT_OPTIONS, 7);
    settle(s, 0.5);
    s.push(1);
    settle(s, 5);
    expect(s.fallen).toBe(false);
    expect(Math.abs(s.x[2])).toBeLessThan(0.02);
  });

  test("falls with the controller off", () => {
    const s = new NidsSim({ ...DEFAULT_OPTIONS, controller: false }, 7);
    settle(s, 3);
    expect(s.fallen).toBe(true);
  });

  test("pitch-only PID drifts; the outer wheel loop holds position", () => {
    const drift = new NidsSim(DEFAULT_OPTIONS, 11);
    const held = new NidsSim({ ...DEFAULT_OPTIONS, outer: true }, 11);
    for (const s of [drift, held]) {
      settle(s, 0.5);
      s.push(1);
      settle(s, 8);
      expect(s.fallen).toBe(false);
    }
    expect(Math.abs(drift.x[0])).toBeGreaterThan(5 * Math.abs(held.x[0]));
    expect(Math.abs(held.x[1])).toBeLessThan(0.05);
  });

  test("is deterministic for a given seed", () => {
    const a = new NidsSim(DEFAULT_OPTIONS, 5);
    const b = new NidsSim(DEFAULT_OPTIONS, 5);
    settle(a, 2);
    settle(b, 2);
    expect(a.x).toEqual(b.x);
  });
});
