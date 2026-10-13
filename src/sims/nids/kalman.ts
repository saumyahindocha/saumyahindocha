/**
 * The firmware's angle Kalman filter (self-balancing-bot firmware/balance,
 * "same as the IIT Delhi reference"): states angle and gyro bias, in degrees.
 */
export class Kalman {
  qAngle = 0.001;
  qBias = 0.003;
  rMeasure = 0.03;
  angle = 0;
  bias = 0;
  private P = [
    [0, 0],
    [0, 0],
  ];

  reset(angle = 0) {
    this.angle = angle;
    this.bias = 0;
    this.P = [
      [0, 0],
      [0, 0],
    ];
  }

  /** newAngle: accelerometer angle (°); newRate: gyro rate (°/s); dt in s. */
  update(newAngle: number, newRate: number, dt: number): number {
    const P = this.P;
    const rate = newRate - this.bias;
    this.angle += dt * rate;
    P[0][0] += dt * (dt * P[1][1] - P[1][0] - P[0][1] + this.qAngle);
    P[0][1] -= dt * P[1][1];
    P[1][0] -= dt * P[1][1];
    P[1][1] += this.qBias * dt;
    const S = P[0][0] + this.rMeasure;
    const K0 = P[0][0] / S;
    const K1 = P[1][0] / S;
    const y = newAngle - this.angle;
    this.angle += K0 * y;
    this.bias += K1 * y;
    const p00 = P[0][0];
    const p01 = P[0][1];
    P[0][0] -= K0 * p00;
    P[0][1] -= K0 * p01;
    P[1][0] -= K1 * p00;
    P[1][1] -= K1 * p01;
    return this.angle;
  }
}
