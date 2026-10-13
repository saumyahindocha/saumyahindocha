import { expect, test } from "vitest";
import { charPoly, polyMul, roots } from "./poly";

test("roots of (s + 1)(s − 2)(s² + 2s + 5)", () => {
  const p = polyMul(polyMul([1, 1], [1, -2]), [1, 2, 5]);
  const r = roots(p);
  expect(r[0].re).toBeCloseTo(-1, 9);
  expect(r[0].im).toBeCloseTo(-2, 9);
  expect(r[2].re).toBeCloseTo(-1, 9);
  expect(r[3].re).toBeCloseTo(2, 9);
});

test("characteristic polynomial of a companion matrix", () => {
  // Companion of s³ + 6s² + 11s + 6
  const A = [
    [0, 1, 0],
    [0, 0, 1],
    [-6, -11, -6],
  ];
  charPoly(A).forEach((c, i) => expect(c).toBeCloseTo([1, 6, 11, 6][i], 9));
});
