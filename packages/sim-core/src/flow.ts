import { R_GAS } from './params.js';

export function flowStressMpa(strainRate: number, tempC: number): number {
  const tk = tempC + 273.15;
  const Q = 200000;
  const A = 1e10;
  const n = 4;
  const alpha = 0.005;
  const z = Math.max(strainRate, 1e-4) * Math.exp(Q / (R_GAS * tk));
  const stress = (1 / alpha) * Math.asinh(Math.pow(z / A, 1 / n));
  return Number(Math.max(0, stress).toFixed(1));
}
