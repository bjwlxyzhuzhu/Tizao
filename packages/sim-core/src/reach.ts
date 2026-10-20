export interface ReachResult {
  distanceMm: number;
  ratio: number;
  reachable: boolean;
}

export function reachCheck(
  shoulderHeightMm: number,
  armLengthMm: number,
  targetXmm: number,
  targetHeightMm: number
): ReachResult {
  const dx = targetXmm;
  const dy = targetHeightMm - shoulderHeightMm;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const ratio = distance / Math.max(armLengthMm, 1);
  return {
    distanceMm: Number(distance.toFixed(0)),
    ratio: Number(ratio.toFixed(2)),
    reachable: ratio <= 1
  };
}
