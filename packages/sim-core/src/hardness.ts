export interface HardnessResult {
  yieldMpa: number;
  hv: number;
}

export function hardnessAndYield(grainUm: number): HardnessResult {
  const dMm = Math.max(grainUm, 0.1) / 1000;
  const sigma = 800 + 20 / Math.sqrt(dMm);
  return {
    yieldMpa: Number(sigma.toFixed(0)),
    hv: Number((sigma / 3).toFixed(0))
  };
}
