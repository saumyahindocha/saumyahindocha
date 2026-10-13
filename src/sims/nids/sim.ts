/*
  Live NIDS balance sim. The plant is the linear model from balance_model.m,
  integrated with fixed-step RK4. Around it sits a copy of what the firmware
  does: a PID loop on pitch every 5 ms, the firmware's Kalman filter on a noisy
  simulated IMU, the motor dead zone, the battery's voltage limit, and the
  "fallen" cut-off at 35°.

  Assumptions that are not in the repo are marked SIM.
*/

import { Kalman } from "./kalman";
import { MATLAB_GAINS, stateSpace, type Gains, type OuterGains } from "./model";

export const H = 0.001; // s, RK4 step
export const TC = 0.005; // s, controller period (SIM: the firmware loop runs as fast as it can)
export const V_MAX = 9.1; // V the motors see: 11.1 V nominal 3S minus ~2 V L298N drop (docs/tuning.md)
export const V_DEAD = (65 / 255) * V_MAX; // firmware DEADZONE = 65 PWM (a placeholder in the code)
export const FALL_RAD = (35 * Math.PI) / 180; // firmware: |pitch| > 35° counts as fallen
export const REST_RAD = (68 * Math.PI) / 180; // SIM: where the top plate meets the floor
/** SIM: illustrative outer-loop gains, chosen so every closed-loop pole is stable. Not tested on hardware. */
export const OUTER: OuterGains = { kPos: 70, kVel: 32.5 };

const ACC_NOISE_DEG = Math.sqrt(0.03); // SIM: accelerometer noise at the level the filter's R assumes
const GYRO_NOISE_DPS = 0.15; // SIM
const GYRO_BIAS_DPS = 0.6; // SIM
const BUMP = 0.8; // SIM: floor and wiring disturbance, rad/s² (std)
const PUSH = 0.9; // SIM: a push adds this much pitch rate, rad/s

export type NidsOptions = {
  gains: Gains;
  controller: boolean;
  kalman: boolean;
  deadZone: boolean;
  outer: boolean;
};

export const DEFAULT_OPTIONS: NidsOptions = {
  gains: { ...MATLAB_GAINS },
  controller: true,
  kalman: true,
  deadZone: false,
  outer: false,
};

const LOG_DT = 0.01;
export const LOG_N = 800; // 8 s of history at 100 Hz

function rng(seed: number) {
  let a = seed >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
}

export class NidsSim {
  opts: NidsOptions;
  x = [0, 0, 0, 0]; // p, ṗ, θ, θ̇
  t = 0;
  u = 0; // volts applied to the motors
  thetaEst = 0; // what the controller believes θ is (rad)
  fallen = false;
  /** Rolling history for the plots. */
  log = {
    t: new Float64Array(LOG_N),
    theta: new Float64Array(LOG_N),
    est: new Float64Array(LOG_N),
    p: new Float64Array(LOG_N),
    u: new Float64Array(LOG_N),
    head: 0,
    count: 0,
  };

  private A = stateSpace().A;
  private B = stateSpace().B;
  private kf = new Kalman();
  private integral = 0;
  private lastErr = 0;
  private acc = 0;
  private sinceCtl = 0;
  private sinceLog = 0;
  private bump = 0;
  private gauss: () => number;
  private fallDir = 1;
  private fallRate = 0;

  constructor(opts: NidsOptions = DEFAULT_OPTIONS, seed = 1) {
    this.opts = { ...opts, gains: { ...opts.gains } };
    this.gauss = rng(seed);
    this.reset();
  }

  reset() {
    this.x = [0, 0, 0, 0];
    this.t = 0;
    this.u = 0;
    this.thetaEst = 0;
    this.fallen = false;
    this.fallRate = 0;
    this.integral = 0;
    this.lastErr = 0;
    this.acc = 0;
    this.sinceCtl = 0;
    this.sinceLog = 0;
    this.kf.reset();
    this.log.head = 0;
    this.log.count = 0;
  }

  /** A shove: dir +1 tips the robot forward, −1 back. */
  push(dir = 1, strength = 1) {
    if (this.fallen) return;
    this.x[3] += dir * PUSH * strength;
  }

  /** Advances by `seconds` of sim time in fixed steps (capped so a stalled tab can't spiral). */
  advance(seconds: number) {
    this.acc += Math.min(seconds, 0.1);
    while (this.acc >= H) {
      this.acc -= H;
      this.step();
    }
  }

  private f(x: number[], u: number, bump: number): number[] {
    const { A, B } = this;
    return [
      x[1],
      A[1][1] * x[1] + A[1][2] * x[2] + B[1] * u,
      x[3],
      A[3][1] * x[1] + A[3][2] * x[2] + B[3] * u + bump,
    ];
  }

  private control() {
    const { gains, controller, kalman, deadZone, outer } = this.opts;
    const th = this.x[2];
    // Simulated MPU6500: accelerometer angle and gyro rate, in degrees as the firmware reads them.
    const accDeg = (th * 180) / Math.PI + ACC_NOISE_DEG * this.gauss();
    const gyroDps = (this.x[3] * 180) / Math.PI + GYRO_BIAS_DPS + GYRO_NOISE_DPS * this.gauss();
    const kfDeg = this.kf.update(accDeg, gyroDps, TC);
    this.thetaEst = ((kalman ? kfDeg : accDeg) * Math.PI) / 180;

    if (!controller) {
      this.u = 0;
      this.integral = 0;
      this.lastErr = 0;
      return;
    }
    // Same shape as the firmware loop: error, clamped integral, difference-quotient derivative.
    const err = 0 - this.thetaEst;
    this.integral = Math.max(-V_MAX, Math.min(V_MAX, this.integral + gains.ki * err * TC));
    const deriv = (err - this.lastErr) / TC;
    this.lastErr = err;
    let v = gains.kp * err + this.integral + gains.kd * deriv;
    if (outer) v += OUTER.kPos * this.x[0] + OUTER.kVel * this.x[1];
    v = Math.max(-V_MAX, Math.min(V_MAX, v));
    if (deadZone && Math.abs(v) < V_DEAD) v = 0;
    this.u = v;
  }

  private step() {
    if (this.fallen) {
      // Past 35° the firmware cuts the motors; the body tips over onto the floor.
      const th = this.x[2];
      if (Math.abs(th) < REST_RAD) {
        this.fallRate += this.A[3][2] * Math.sin(th) * H;
        this.x[2] = Math.max(-REST_RAD, Math.min(REST_RAD, th + this.fallRate * H));
      } else this.x[2] = this.fallDir * REST_RAD;
      this.x[1] = 0;
      this.thetaEst = this.x[2];
      this.t += H;
      this.record();
      return;
    }

    this.sinceCtl += H;
    if (this.sinceCtl >= TC - 1e-9) {
      this.sinceCtl -= TC;
      this.control();
      this.bump = BUMP * this.gauss();
    }

    const { x, u, bump } = this;
    const k1 = this.f(x, u, bump);
    const k2 = this.f(
      x.map((v, i) => v + (H / 2) * k1[i]),
      u,
      bump,
    );
    const k3 = this.f(
      x.map((v, i) => v + (H / 2) * k2[i]),
      u,
      bump,
    );
    const k4 = this.f(
      x.map((v, i) => v + H * k3[i]),
      u,
      bump,
    );
    this.x = x.map((v, i) => v + (H / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    this.t += H;

    if (Math.abs(this.x[2]) > FALL_RAD) {
      this.fallen = true;
      this.fallDir = Math.sign(this.x[2]);
      this.fallRate = this.x[3];
      this.u = 0;
    }
    this.record();
  }

  private record() {
    this.sinceLog += H;
    if (this.sinceLog < LOG_DT - 1e-9) return;
    this.sinceLog -= LOG_DT;
    const L = this.log;
    L.t[L.head] = this.t;
    L.theta[L.head] = this.x[2];
    L.est[L.head] = this.thetaEst;
    L.p[L.head] = this.x[0];
    L.u[L.head] = this.u;
    L.head = (L.head + 1) % LOG_N;
    L.count = Math.min(L.count + 1, LOG_N);
  }
}
