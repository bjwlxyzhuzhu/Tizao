import { TC4 } from './params.js';

export function secondaryDendriteArmSpacing(coolingRateCPerS: number, A = 8, n = 0.5): number {
  const lst = (TC4.liquidusC - TC4.solidusC) / Math.max(coolingRateCPerS, 0.01);
  return Number((A * Math.pow(lst, n)).toFixed(1));
}
