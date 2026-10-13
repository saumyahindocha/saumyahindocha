/*
  Cooling-tower energy audit, ported from SS-filters backend/server.py:
  the sensor simulator (TowerSimState.sample, without its random jitter
  unless a noise source is passed) and the analytics (compute_analytics_row).
  Tower CT-01's design values and the default ₹9/kWh tariff come from the
  same file.
*/

export const CP_WATER = 4.186; // kJ/kg·K
export const RHO_WATER = 1000; // kg/m³
export const KW_PER_TR = 3.517; // 1 TR = 3.517 kW thermal
export const DEFAULT_TARIFF = 9.0; // ₹/kWh
export const THRESHOLDS = { watch: 0.35, fouled: 0.6, critical: 0.85 } as const;

export const CT01 = {
  designFlow: 520, // m³/h
  designDeltaT: 5.5, // °C
  baselineSlope: 0.17, // kW per TR
  baselineIntercept: 4.0, // kW
};
export type TowerSpec = typeof CT01;

export type Readings = {
  flow: number; // m³/h
  supply: number; // °C, cold water leaving the tower
  ret: number; // °C, hot water returning to it
  ambient: number;
  wetBulb: number;
  pIn: number; // kPa
  pOut: number;
  filterDp: number; // kPa
  conductivity: number; // µS/cm
  turbidity: number; // NTU
  ph: number;
  fanKw: number;
  pumpKw: number;
  chillerKw: number;
};

/**
 * Sensor values for fouling drift `f` (0…0.98) at simulator step `t`.
 * `jitter(a)` returns a value in ±a; the default is noiseless.
 */
export function sample(
  f: number,
  t: number,
  tower: TowerSpec = CT01,
  towerIndex = 0,
  jitter: (a: number) => number = () => 0,
): Readings {
  const ambient = 32 + 3 * Math.sin(t / 240) + jitter(0.3);
  const wetBulb = ambient - 5.5 + jitter(0.3);
  const load = 0.7 + 0.25 * Math.sin(t / 120 + towerIndex) + jitter(0.02);
  const flow = tower.designFlow * (0.85 + 0.15 * load) - f * 20;
  const supply = wetBulb + 4.0 + jitter(0.2);
  const deltaT = tower.designDeltaT * (1 - 0.35 * f) + jitter(0.15);
  const pIn = 320 + jitter(4);
  return {
    flow,
    supply,
    ret: supply + deltaT,
    ambient,
    wetBulb,
    pIn,
    pOut: pIn - 40 - f * 25 + jitter(2),
    filterDp: 6 + 30 * f + jitter(0.5),
    conductivity: 900 + 1400 * f + jitter(30),
    turbidity: 1.5 + 12 * f + jitter(0.2),
    ph: 7.6 - 0.6 * f + jitter(0.05),
    fanKw: 22 * load * (1 + 0.25 * f) + jitter(0.5),
    pumpKw: 30 * load * (1 + 0.15 * f) + jitter(0.5),
    chillerKw: 210 * load * (1 + 0.12 * f) + jitter(2),
  };
}

export type Category = "Clean" | "Watch" | "Fouled" | "Critical";

export function category(idx: number): Category {
  if (idx >= THRESHOLDS.critical) return "Critical";
  if (idx >= THRESHOLDS.fouled) return "Fouled";
  if (idx >= THRESHOLDS.watch) return "Watch";
  return "Clean";
}

export type Analytics = {
  heatKw: number;
  effectiveness: number; // 0…1
  totalKw: number;
  tr: number;
  kwPerTr: number;
  foulingIndex: number;
  category: Category;
  expectedKw: number;
  excessKw: number;
  rupeesPerHour: number;
};

export function analyse(v: Readings, tariff = DEFAULT_TARIFF, tower: TowerSpec = CT01): Analytics {
  const mDot = (v.flow / 3600) * RHO_WATER; // kg/s
  const deltaT = Math.max(0.01, v.ret - v.supply);
  const heatKw = mDot * CP_WATER * deltaT;
  const denom = Math.max(0.01, v.ret - v.wetBulb);
  const effectiveness = Math.max(0, Math.min(1, (v.ret - v.supply) / denom));
  const totalKw = v.fanKw + v.pumpKw + v.chillerKw;
  const tr = heatKw > 0 ? heatKw / KW_PER_TR : 0;
  const kwPerTr = tr > 0 ? totalKw / tr : 0;
  const dpTower = Math.max(0, v.pIn - v.pOut);
  const fDp = Math.min(1, v.filterDp / 45);
  const fCond = Math.min(1, Math.max(0, (v.conductivity - 800) / 1600));
  const fTurb = Math.min(1, v.turbidity / 15);
  const fDpt = Math.min(1, dpTower / 100);
  const foulingIndex = 0.35 * fDp + 0.25 * fCond + 0.2 * fTurb + 0.2 * fDpt;
  const expectedKw = tower.baselineSlope * tr + tower.baselineIntercept;
  const excessKw = Math.max(0, totalKw - expectedKw);
  return {
    heatKw,
    effectiveness,
    totalKw,
    tr,
    kwPerTr,
    foulingIndex,
    category: category(foulingIndex),
    expectedKw,
    excessKw,
    rupeesPerHour: excessKw * tariff,
  };
}
