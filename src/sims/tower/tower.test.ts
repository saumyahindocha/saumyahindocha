import { describe, expect, test } from "vitest";
import { analyse, category, CT01, sample } from "./model";

describe("cooling-tower analytics match server.py", () => {
  test("a clean tower at mean load, worked by hand", () => {
    // t = 0: ambient 32, wet bulb 26.5, load 0.7, supply 30.5, ΔT 5.5
    const v = sample(0, 0);
    expect(v.wetBulb).toBeCloseTo(26.5, 9);
    expect(v.flow).toBeCloseTo(520 * (0.85 + 0.15 * 0.7), 9);
    const a = analyse(v);
    const q = (v.flow / 3600) * 1000 * 4.186 * 5.5;
    expect(a.heatKw).toBeCloseTo(q, 6);
    expect(a.tr).toBeCloseTo(q / 3.517, 6);
    expect(a.effectiveness).toBeCloseTo(5.5 / (36 - 26.5), 9);
    expect(a.totalKw).toBeCloseTo(0.7 * (22 + 30 + 210), 9);
    expect(a.expectedKw).toBeCloseTo(0.17 * a.tr + 4, 9);
    expect(a.rupeesPerHour).toBeCloseTo(a.excessKw * 9, 9);
  });

  test("fouling index weights and categories", () => {
    const a = analyse(sample(0, 0));
    // filter 6/45, conductivity (900-800)/1600, turbidity 1.5/15, dp 40/100
    expect(a.foulingIndex).toBeCloseTo(
      0.35 * (6 / 45) + 0.25 * (100 / 1600) + 0.2 * 0.1 + 0.2 * 0.4,
      9,
    );
    expect(category(0.34)).toBe("Clean");
    expect(category(0.35)).toBe("Watch");
    expect(category(0.6)).toBe("Fouled");
    expect(category(0.85)).toBe("Critical");
  });

  test("more fouling: lower effectiveness, more excess power", () => {
    let prev = analyse(sample(0, 0));
    for (const f of [0.2, 0.4, 0.6, 0.8, 0.98]) {
      const a = analyse(sample(f, 0));
      expect(a.effectiveness).toBeLessThan(prev.effectiveness);
      expect(a.excessKw).toBeGreaterThan(prev.excessKw);
      expect(a.foulingIndex).toBeGreaterThan(prev.foulingIndex);
      prev = a;
    }
  });

  test("tariff scales the money linearly", () => {
    const v = sample(0.5, 30);
    expect(analyse(v, 12).rupeesPerHour).toBeCloseTo((analyse(v, 9).rupeesPerHour * 12) / 9, 9);
    expect(CT01.designFlow).toBe(520);
  });
});
