import { R_GAS } from './params.js';

export interface RecrystallizationResult {
  t50: number;
  fraction: number;
}

export function recrystallizedFraction(
  timeS: number,
  tempC: number,
  strain: number,
  d0Um: number
): RecrystallizationResult {
  const tk = tempC + 273.15;
  const Q = 200000;
  const A = 1e-7;
  const m = 0.5;
  const strainExponent = -0.5;
  const t50 = A * Math.pow(d0Um, m) * Math.pow(Math.max(strain, 0.01), strainExponent) *
    Math.exp(Q / (R_GAS * tk));
  const x = 1 - Math.exp(-0.693 * Math.pow(Math.max(timeS, 0) / Math.max(t50, 1e-6), 1.5));
  return {
    t50: Number(t50.toFixed(1)),
    fraction: Number(Math.min(1, Math.max(0, x)).toFixed(3))
  };
}
