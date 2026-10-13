/*
  NIDS balance model: the linearised inverted pendulum on wheels from
  self-balancing-bot/matlab/balance_model.m (project report, Table 6.1).
  States x = [p, ṗ, θ, θ̇] (m, m/s, rad, rad/s), input u = motor voltage (V).
*/

import {
  charPoly,
  polyAdd,
  polyMul,
  polyTrim,
  roots,
  type Complex,
  type Matrix,
} from "../lib/poly";

export const PARAMS = {
  M_body: 1.15, // kg, body excluding wheels and motors
  M_w: 0.106, // kg, each wheel
  R_w: 0.05, // m, wheel radius
  h: 0.108, // m, CoG height above the axle
  I_body: 0.01306, // kg m², body pitch inertia about the CoG
  Ke: 0.118, // V s/rad, back-EMF constant (= Kt)
  Rm: 5.6, // Ω, motor resistance
  Jm: 2.66e-5, // kg m², rotor inertia
  g: 9.81,
} as const;

/** Final MATLAB gains (25 Jun 2026), for θ in radians and output in volts. */
export const MATLAB_GAINS = { kp: 450.4747, ki: 800.905, kd: 100 } as const;

export type Gains = { kp: number; ki: number; kd: number };

export function stateSpace(p = PARAMS): { A: Matrix; B: number[] } {
  const J_w = 0.5 * p.M_w * p.R_w ** 2;
  const I_total = p.I_body + p.M_body * p.h ** 2;
  const M_eq = p.M_body + 2 * p.M_w + (2 * (J_w + p.Jm)) / p.R_w ** 2;
  const Km = p.Ke / p.Rm;
  const Kb = p.Ke ** 2 / (p.Rm * p.R_w);
  const delta = M_eq * I_total - (p.M_body * p.h) ** 2;
  const A: Matrix = [
    [0, 1, 0, 0],
    [
      0,
      (2 * Kb * p.M_body * p.h - (2 * Kb * I_total) / p.R_w) / delta,
      ((p.M_body * p.h) ** 2 * p.g) / delta,
      0,
    ],
    [0, 0, 0, 1],
    [
      0,
      (2 * Kb * M_eq - (2 * Kb * p.M_body * p.h) / p.R_w) / delta,
      (M_eq * p.M_body * p.g * p.h) / delta,
      0,
    ],
  ];
  const B = [
    0,
    (-2 * Km * p.M_body * p.h + (2 * Km * I_total) / p.R_w) / delta,
    0,
    (-2 * Km * M_eq + (2 * Km * p.M_body * p.h) / p.R_w) / delta,
  ];
  return { A, B };
}

export type TF = { num: number[]; den: number[] };

/** Cancels factors of s common to numerator and denominator (MATLAB's minreal, for s = 0 only). */
export function cancelOrigin({ num, den }: TF): TF {
  let n = polyTrim(num);
  let d = polyTrim(den);
  const tiny = (p: number[]) => Math.abs(p[p.length - 1]) < 1e-9 * Math.max(...p.map(Math.abs));
  while (n.length > 1 && d.length > 1 && tiny(n) && tiny(d)) {
    n = n.slice(0, -1);
    d = d.slice(0, -1);
  }
  return { num: n, den: d };
}

/** θ(s)/V(s). For a SISO system, num = det(sI − A + BC) − det(sI − A). */
export function plantTF(p = PARAMS): TF {
  const { A, B } = stateSpace(p);
  const BC = A.map((row, i) => row.map((a, j) => a - B[i] * (j === 2 ? 1 : 0)));
  const den = charPoly(A);
  const num = polyAdd(
    charPoly(BC),
    den.map((c) => -c),
  );
  return cancelOrigin({ num: polyTrim(num), den });
}

/** Closed loop θ/θ_ref with PID C(s) = (Kd s² + Kp s + Ki)/s, as feedback(C·G, 1). */
export function closedLoop(
  g: Gains,
  plant = plantTF(),
): TF & { poles: Complex[]; zeros: Complex[] } {
  const L = cancelOrigin({
    num: polyMul([g.kd, g.kp, g.ki], plant.num),
    den: polyMul([1, 0], plant.den),
  });
  const den = polyTrim(polyAdd(L.den, L.num));
  const num = polyTrim(L.num);
  return { num, den, poles: roots(den), zeros: roots(num) };
}

/** Step response of a strictly proper (or biproper) TF, by RK4 on its controllable canonical form. */
export function stepResponse(tf: TF, tEnd = 1, dt = 2.5e-4): { t: number[]; y: number[] } {
  const den = tf.den.map((c) => c / tf.den[0]);
  const n = den.length - 1;
  const numFull = [
    ...new Array(n + 1 - tf.num.length).fill(0),
    ...tf.num.map((c) => c / tf.den[0]),
  ];
  const d0 = numFull[0]; // direct feed-through
  // y = Σ (b_i − d0·a_i) x_i + d0·u with companion states.
  const c = Array.from({ length: n }, (_, i) => numFull[n - i] - d0 * den[n - i]);
  const f = (x: number[]) => {
    const dx = x.slice(1);
    dx.push(1 - x.reduce((acc, xi, i) => acc + den[n - i] * xi, 0));
    return dx;
  };
  let x = new Array(n).fill(0);
  const t: number[] = [];
  const y: number[] = [];
  const out = (v: number[]) => v.reduce((acc, xi, i) => acc + c[i] * xi, 0) + d0;
  const every = Math.max(1, Math.round(tEnd / dt / 400));
  const steps = Math.round(tEnd / dt);
  for (let k = 0; k <= steps; k++) {
    if (k % every === 0) {
      t.push(k * dt);
      y.push(out(x));
    }
    const k1 = f(x);
    const k2 = f(x.map((v, i) => v + (dt / 2) * k1[i]));
    const k3 = f(x.map((v, i) => v + (dt / 2) * k2[i]));
    const k4 = f(x.map((v, i) => v + dt * k3[i]));
    x = x.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }
  return { t, y };
}

/** DC gain of a TF (∞ if it has a pole at the origin). */
export function dcGain({ num, den }: TF): number {
  return num[num.length - 1] / den[den.length - 1];
}

/** Gains of the optional outer wheel loop, V += kPos·p + kVel·ṗ. */
export type OuterGains = { kPos: number; kVel: number };

/**
 * Closed-loop poles of the full state-space loop: the plant's four states plus
 * the PID integrator, z = ∫θ. With no outer loop the wheel states add two
 * poles at the origin, which is the drift.
 */
export function fullLoopPoles(g: Gains, outer?: OuterGains, p = PARAMS): Complex[] {
  const { A, B } = stateSpace(p);
  // u = −(Kp θ + Ki z + Kd θ̇) + kPos p + kVel ṗ
  const K = [-(outer?.kPos ?? 0), -(outer?.kVel ?? 0), g.kp, g.kd, g.ki]; // u = −K·[x; z]
  const M: Matrix = [0, 1, 2, 3, 4].map((i) =>
    [0, 1, 2, 3, 4].map((j) => {
      if (i < 4) return (j < 4 ? A[i][j] : 0) - B[i] * K[j];
      return j === 2 ? 1 : 0; // ż = θ
    }),
  );
  return roots(charPoly(M));
}
