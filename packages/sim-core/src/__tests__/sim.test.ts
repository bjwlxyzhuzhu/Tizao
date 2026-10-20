import { describe, expect, it } from 'vitest';
import {
  bodyDimensions,
  costAndYield,
  flowStressMpa,
  hardnessAndYield,
  reachCheck,
  recrystallizedFraction,
  rulaScore,
  scheilSeverity,
  secondaryDendriteArmSpacing,
  simulateThermal
} from '../index.js';

describe('thermal', () => {
  const base = {
    initialTempC: 1700,
    boundaryTempC: 300,
    lengthMm: 300,
    nodes: 60,
    totalTimeS: 600,
    alphaMm2S: 2.8,
    meltRateMmMin: 12
  };

  it('produces a center temperature series that cools down', () => {
    const r = simulateThermal(base);
    expect(r.timeS.length).toBeGreaterThan(5);
    expect(r.centerTempC[0]).toBeGreaterThan(r.centerTempC[r.centerTempC.length - 1]!);
  });

  it('higher melt rate increases pool depth', () => {
    const slow = simulateThermal({ ...base, meltRateMmMin: 8 });
    const fast = simulateThermal({ ...base, meltRateMmMin: 20 });
    expect(fast.poolDepthMm).toBeGreaterThanOrEqual(slow.poolDepthMm);
  });

  it('reports a positive solidification time', () => {
    const r = simulateThermal(base);
    expect(r.solidificationTimeS).toBeGreaterThan(0);
  });
});

describe('segregation', () => {
  it('enriches solute when k < 1', () => {
    const r = scheilSeverity(0.06, 0.8);
    expect(r.index).toBeGreaterThan(1);
    expect(r.cL.length).toBe(r.fs.length);
  });
});

describe('flow stress', () => {
  it('decreases as temperature rises', () => {
    const cold = flowStressMpa(1, 900);
    const hot = flowStressMpa(1, 1100);
    expect(hot).toBeLessThan(cold);
  });
});

describe('recrystallization', () => {
  it('fraction grows with time and stays in range', () => {
    const short = recrystallizedFraction(10, 950, 0.5, 50);
    const long = recrystallizedFraction(600, 950, 0.5, 50);
    expect(short.fraction).toBeLessThanOrEqual(long.fraction);
    expect(long.fraction).toBeLessThanOrEqual(1);
  });
});

describe('grain and hardness', () => {
  it('finer grain gives higher hardness', () => {
    const fine = hardnessAndYield(10);
    const coarse = hardnessAndYield(100);
    expect(fine.hv).toBeGreaterThan(coarse.hv);
  });

  it('secondary dendrite arm spacing is positive', () => {
    expect(secondaryDendriteArmSpacing(10)).toBeGreaterThan(0);
  });
});

describe('anthropometry', () => {
  it('orders percentiles correctly', () => {
    const p5 = bodyDimensions('P5', '男');
    const p50 = bodyDimensions('P50', '男');
    const p95 = bodyDimensions('P95', '男');
    expect(p5.stature).toBeLessThan(p50.stature);
    expect(p50.stature).toBeLessThan(p95.stature);
  });
});

describe('reach', () => {
  it('fails when target is beyond arm length', () => {
    const near = reachCheck(1350, 700, 400, 1350);
    const far = reachCheck(1350, 700, 900, 1350);
    expect(near.reachable).toBe(true);
    expect(far.reachable).toBe(false);
  });
});

describe('rula', () => {
  it('worse posture gives higher action level', () => {
    const good = rulaScore(10, 0, 5);
    const bad = rulaScore(100, 70, 30);
    expect(bad.actionLevel).toBeGreaterThanOrEqual(good.actionLevel);
  });
});

describe('cost', () => {
  it('yield drops when melt rate is too high', () => {
    const ok = costAndYield(100, 6, 20, 12, 25);
    const bad = costAndYield(100, 6, 20, 20, 25);
    expect(bad.yieldPct).toBeLessThan(ok.yieldPct);
    expect(ok.total).toBeGreaterThan(0);
  });
});
