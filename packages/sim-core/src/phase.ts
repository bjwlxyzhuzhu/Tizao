import { R_GAS } from './params.js';

export function betaFraction(timeS: number, tempC: number, k0 = 0.02, Q = 150000, n = 1.5): number {
  const tk = tempC + 273.15;
  const k = k0 * Math.exp(-Q / (R_GAS * tk));
  const t = Math.max(timeS, 0);
  return Number((1 - Math.exp(-k * Math.pow(t, n))).toFixed(3));
}
