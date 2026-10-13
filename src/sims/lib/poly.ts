/*
  Small linear-algebra and polynomial helpers for the sims.
  Polynomials are coefficient arrays, highest power first (MATLAB order):
  [1, 2, 3] is s² + 2s + 3.
*/

export type Complex = { re: number; im: number };
export type Matrix = number[][];

export function polyMul(a: number[], b: number[]): number[] {
  const out = new Array(a.length + b.length - 1).fill(0);
  a.forEach((x, i) => b.forEach((y, j) => (out[i + j] += x * y)));
  return out;
}

export function polyAdd(a: number[], b: number[]): number[] {
  const n = Math.max(a.length, b.length);
  const pa = [...new Array(n - a.length).fill(0), ...a];
  const pb = [...new Array(n - b.length).fill(0), ...b];
  return pa.map((x, i) => x + pb[i]);
}

/** Drops leading near-zero coefficients. */
export function polyTrim(p: number[], tol = 1e-9): number[] {
  const scale = Math.max(...p.map(Math.abs), 1e-300);
  let i = 0;
  while (i < p.length - 1 && Math.abs(p[i]) <= tol * scale) i++;
  return p.slice(i);
}

/** Value of a real polynomial at a real point. */
export function polyVal(p: number[], s: number): number {
  return p.reduce((acc, c) => acc * s + c, 0);
}

/**
 * Characteristic polynomial det(sI − A) by Faddeev–LeVerrier.
 * Returns [1, c1, …, cn].
 */
export function charPoly(A: Matrix): number[] {
  const n = A.length;
  const coeffs = [1];
  let M: Matrix = A.map((r) => r.map(() => 0)); // M0 = 0
  for (let k = 1; k <= n; k++) {
    // M_k = A·M_{k−1} + c_{k−1}·I
    const prev = M;
    const c = coeffs[k - 1];
    M = A.map((row, i) =>
      row.map((_, j) => row.reduce((acc, a, m) => acc + a * prev[m][j], 0) + (i === j ? c : 0)),
    );
    // c_k = −tr(A·M_k)/k
    let tr = 0;
    for (let i = 0; i < n; i++) for (let m = 0; m < n; m++) tr += A[i][m] * M[m][i];
    coeffs.push(-tr / k);
  }
  return coeffs;
}

const cmul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
const cdiv = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
const csub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });

/** All roots of a real polynomial (Durand–Kerner), sorted by real part. */
export function roots(p: number[]): Complex[] {
  const q = polyTrim(p);
  const n = q.length - 1;
  if (n < 1) return [];
  const a = q.map((c) => c / q[0]);
  // Start points on a circle sized to the root bound.
  const r = 1 + Math.max(...a.slice(1).map(Math.abs));
  let z: Complex[] = Array.from({ length: n }, (_, k) => {
    const ang = (2 * Math.PI * k) / n + 0.4;
    return { re: r * Math.cos(ang), im: r * Math.sin(ang) };
  });
  const evalAt = (s: Complex) =>
    a.reduce<Complex>(
      (acc, c) => {
        const m = cmul(acc, s);
        return { re: m.re + c, im: m.im };
      },
      { re: 0, im: 0 },
    );
  for (let it = 0; it < 2000; it++) {
    let moved = 0;
    z = z.map((zi, i) => {
      let den: Complex = { re: 1, im: 0 };
      z.forEach((zj, j) => {
        if (j !== i) den = cmul(den, csub(zi, zj));
      });
      const step = cdiv(evalAt(zi), den);
      moved = Math.max(moved, Math.hypot(step.re, step.im));
      return csub(zi, step);
    });
    if (moved < 1e-13 * r) break;
  }
  // Snap tiny imaginary parts so real roots read as real.
  return z
    .map((c) => (Math.abs(c.im) < 1e-7 * Math.max(1, Math.abs(c.re)) ? { re: c.re, im: 0 } : c))
    .sort((x, y) => x.re - y.re || x.im - y.im);
}
