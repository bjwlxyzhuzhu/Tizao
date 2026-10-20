export interface CostResult {
  materialCost: number;
  energyCost: number;
  laborCost: number;
  lossCost: number;
  total: number;
  yieldPct: number;
}

export function costAndYield(
  spongeKg: number,
  alVKg: number,
  returnPct: number,
  meltRate: number,
  reductionPct: number
): CostResult {
  const materialCost = spongeKg * 60 + alVKg * 300;
  const energyCost = 80 + Math.max(0, meltRate) * 3;
  const laborCost = 120;
  const lossCost = spongeKg * 60 * 0.02 +
    Math.max(0, 25 - reductionPct) * 0.5 +
    Math.max(0, returnPct - 20) * 0.8;
  const total = materialCost + energyCost + laborCost + lossCost;
  const yieldPct = Math.min(99, Math.max(40,
    95 - Math.max(0, meltRate - 12) * 1.5 - Math.max(0, 25 - reductionPct) * 0.5
  ));
  return {
    materialCost: Number(materialCost.toFixed(0)),
    energyCost: Number(energyCost.toFixed(0)),
    laborCost,
    lossCost: Number(lossCost.toFixed(0)),
    total: Number(total.toFixed(0)),
    yieldPct: Number(yieldPct.toFixed(1))
  };
}
