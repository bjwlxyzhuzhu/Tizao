export interface RulaResult {
  total: number;
  actionLevel: number;
  advice: string;
}

export function rulaScore(upperArmDeg: number, trunkDeg: number, neckDeg: number): RulaResult {
  const upperArm = upperArmDeg < 20 ? 1 : upperArmDeg < 45 ? 2 : upperArmDeg < 90 ? 3 : 4;
  const trunk = trunkDeg < 5 ? 1 : trunkDeg < 20 ? 2 : trunkDeg < 60 ? 3 : 4;
  const neck = neckDeg < 10 ? 1 : neckDeg < 20 ? 2 : 3;
  const total = upperArm + trunk + neck;
  const actionLevel = total <= 3 ? 1 : total <= 5 ? 2 : total <= 7 ? 3 : 4;
  const advice = actionLevel <= 1
    ? '姿态可接受，保持现有工位'
    : actionLevel === 2
      ? '需进一步观察，建议微调工位高度'
      : '需尽快改善工位与作业姿态';
  return { total, actionLevel, advice };
}
