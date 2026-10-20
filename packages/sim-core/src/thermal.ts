import { TC4 } from './params.js';

export interface ThermalParams {
  initialTempC: number;
  boundaryTempC: number;
  lengthMm: number;
  nodes: number;
  totalTimeS: number;
  alphaMm2S: number;
  meltRateMmMin: number;
}

export interface ThermalResult {
  timeS: number[];
  centerTempC: number[];
  poolDepthMm: number;
  solidificationTimeS: number;
  superheatC: number;
}

/**
 * 降阶模型：温度曲线由一维瞬态热传导给出，熔池深度与凝固时间采用
 * 经验关系（与熔速、过热度相关），用于教学中快速反馈，不作为 CFD 结果。
 */
export function simulateThermal(p: ThermalParams): ThermalResult {
  const nodes = Math.max(3, Math.floor(p.nodes));
  const dx = p.lengthMm / (nodes - 1);
  const alpha = Math.max(p.alphaMm2S, 1e-6);
  const dt = Math.min(0.35 * dx * dx / alpha, Math.max(p.totalTimeS / 200, 0.1));
  const steps = Math.max(1, Math.ceil(p.totalTimeS / dt));
  const superheat = Math.min(180, Math.max(0, p.meltRateMmMin) * 2);
  const center = Math.floor(nodes / 2);

  let temps: number[] = new Array<number>(nodes).fill(p.initialTempC + superheat);
  temps[nodes - 1] = p.boundaryTempC;

  const sampleEvery = Math.max(1, Math.floor(steps / 60));
  const timeS: number[] = [];
  const centerTempC: number[] = [];

  for (let s = 0; s < steps; s++) {
    const next = temps.slice();
    for (let i = 1; i < nodes - 1; i++) {
      next[i] = temps[i]! + alpha * dt / (dx * dx) * (temps[i + 1]! - 2 * temps[i]! + temps[i - 1]!);
    }
    next[nodes - 1] = p.boundaryTempC;
    next[0] = next[1]!;
    temps = next;

    const t = (s + 1) * dt;
    if (s % sampleEvery === 0 || s === steps - 1) {
      timeS.push(Number(t.toFixed(2)));
      centerTempC.push(Number(temps[center]!.toFixed(1)));
    }
  }

  const poolDepthMm = Number(
    Math.min(150, Math.max(5, 15 + p.meltRateMmMin * 3 + superheat * 0.4)).toFixed(1)
  );
  const solidificationTimeS = Number(
    Math.min(p.totalTimeS, Math.max(60, 90 + poolDepthMm * 5)).toFixed(1)
  );

  return {
    timeS,
    centerTempC,
    poolDepthMm,
    solidificationTimeS,
    superheatC: Number(superheat.toFixed(1))
  };
}
