export interface SegregationResult {
  fs: number[];
  cL: number[];
  index: number;
}

export function scheilSeverity(c0: number, k: number, fsMax = 0.9, points = 10): SegregationResult {
  const fs: number[] = [];
  const cL: number[] = [];
  for (let i = 0; i <= points; i++) {
    const f = fsMax * i / points;
    fs.push(Number(f.toFixed(2)));
    cL.push(Number((c0 * Math.pow(Math.max(1 - f, 1e-3), k - 1)).toFixed(3)));
  }
  const last = cL[cL.length - 1] ?? c0;
  return { fs, cL, index: Number((last / c0).toFixed(2)) };
}
