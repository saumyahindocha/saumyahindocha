import { describe, expect, test } from "vitest";
import { charge, SEED_TARIFF } from "./tariff";
import { hourly, makeDay, statsAt } from "./day";

// Cases copied from Car-parking-software backend/tests/test_tariff.py
describe("tariff matches the backend", () => {
  test.each([
    [0, 1000],
    [1, 1000],
    [60, 1000],
    [120, 1000],
    [130, 1000],
    [131, 1500],
    [190, 1500],
    [191, 2000],
    [250, 2000],
    [251, 2500],
    [310, 2500],
    [311, 3000],
    [600, 3000],
    [720, 3000],
    [730, 3000],
    [731, 4000],
    [850, 4000],
    [851, 4500],
    [1440, 6000],
    [1450, 6000],
    [1451, 7000],
    [3 * 1440, 18000],
  ])("%i min costs %i paise", (minutes, paise) => {
    expect(charge(minutes)).toBe(paise);
  });

  test("free minutes, daily cap, no block cap", () => {
    expect(charge(5, { ...SEED_TARIFF, freeMinutes: 5 })).toBe(0);
    expect(charge(6, { ...SEED_TARIFF, freeMinutes: 5 })).toBe(1000);
    const capped = { ...SEED_TARIFF, dailyCapPaise: 5000 };
    expect(charge(1440, capped)).toBe(5000);
    expect(charge(1440 + 60, capped)).toBe(6000);
    expect(charge(2 * 1440, capped)).toBe(10000);
    expect(charge(600, { ...SEED_TARIFF, blockCapPaise: null, blockMinutes: 0 })).toBe(
      1000 + 8 * 500,
    );
  });
});

describe("synthetic day", () => {
  const day = makeDay();

  test("3,000 riders, 40 % on passes, everyone out by 23:30", () => {
    expect(day).toHaveLength(3000);
    expect(day.filter((r) => r.kind === "PASS")).toHaveLength(1200);
    expect(day.every((r) => r.exit > r.entry && r.exit <= 23.5 * 60)).toBe(true);
  });

  test("morning entry peak and evening exit peak", () => {
    const h = hourly(day);
    const peakIn = h.reduce((a, b) => (b.in > a.in ? b : a));
    const peakOut = h.reduce((a, b) => (b.out > a.out ? b : a));
    expect(peakIn.hour).toBeGreaterThanOrEqual(8);
    expect(peakIn.hour).toBeLessThanOrEqual(9);
    expect(peakOut.hour).toBeGreaterThanOrEqual(18);
    expect(peakOut.hour).toBeLessThanOrEqual(19);
  });

  test("lot empties and money adds up by midnight", () => {
    const end = statsAt(day, 24 * 60);
    expect(end.inside).toBe(0);
    const total = day.reduce((s, r) => s + (r.pay !== "NONE" ? r.chargePaise : 0), 0);
    expect(end.upiPaise + end.cashPaise).toBe(total);
    // About a quarter of walk-in money is cash
    const share = end.cashPaise / (end.upiPaise + end.cashPaise);
    expect(share).toBeGreaterThan(0.18);
    expect(share).toBeLessThan(0.32);
  });

  test("is deterministic", () => {
    expect(makeDay(50, 3)).toEqual(makeDay(50, 3));
  });
});
