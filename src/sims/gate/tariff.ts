/*
  Port of Car-parking-software backend/app/domain/tariff.py (calculate_charge),
  with the seed tariff: ₹10 for the first 2 h, ₹5 per started extra hour,
  10 min grace past every slab boundary, 12 h blocks capped at ₹30.
  Amounts are in paise, as in the backend.
*/

export type Tariff = {
  firstSlabMinutes: number;
  firstSlabPaise: number;
  perHourPaise: number;
  graceMinutes: number;
  blockMinutes: number;
  blockCapPaise: number | null;
  dailyCapPaise: number | null;
  freeMinutes: number;
};

export const SEED_TARIFF: Tariff = {
  firstSlabMinutes: 120,
  firstSlabPaise: 1000,
  perHourPaise: 500,
  graceMinutes: 10,
  blockMinutes: 720,
  blockCapPaise: 3000,
  dailyCapPaise: null,
  freeMinutes: 0,
};

function blockCharge(t: Tariff, minutes: number): number {
  const over = minutes - t.firstSlabMinutes - t.graceMinutes;
  const extraHours = over > 0 ? Math.ceil(over / 60) : 0;
  let charge = t.firstSlabPaise + extraHours * t.perHourPaise;
  if (t.blockCapPaise !== null) charge = Math.min(charge, t.blockCapPaise);
  return charge;
}

function spanCharge(t: Tariff, minutes: number): number {
  if (minutes <= 0) return 0;
  const block = t.blockMinutes > 0 ? t.blockMinutes : null;
  if (!block) return blockCharge(t, minutes);
  const full = Math.floor(minutes / block);
  const rem = minutes - full * block;
  const cap = t.blockCapPaise ?? blockCharge(t, block);
  let total = full * cap;
  if (rem > 0 && !(full > 0 && rem <= t.graceMinutes)) total += blockCharge(t, rem);
  return total;
}

/** Charge in paise for a stay of `minutes` (overnight charges are off in the seed tariff). */
export function charge(minutes: number, t: Tariff = SEED_TARIFF): number {
  if (minutes < 0) throw new Error("exit before entry");
  if (t.freeMinutes > 0 && minutes <= t.freeMinutes) return 0;
  const m = Math.max(minutes, 1e-9);
  if (t.dailyCapPaise !== null) {
    const day = 1440;
    const fullDays = Math.floor(m / day);
    const rem = m - fullDays * day;
    let total = fullDays * Math.min(spanCharge(t, day), t.dailyCapPaise);
    if (rem > 0 && !(fullDays > 0 && rem <= t.graceMinutes))
      total += Math.min(spanCharge(t, rem), t.dailyCapPaise);
    return total;
  }
  return spanCharge(t, m);
}
