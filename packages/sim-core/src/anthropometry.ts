export type Percentile = 'P5' | 'P50' | 'P95';
export type Sex = '男' | '女';

export interface BodyDimensions {
  stature: number;
  shoulderHeight: number;
  armLength: number;
  eyeHeight: number;
}

const Z: Record<Percentile, number> = { P5: -1.645, P50: 0, P95: 1.645 };

const DATA: Record<Sex, Record<keyof BodyDimensions, { mean: number; sd: number }>> = {
  男: {
    stature: { mean: 1700, sd: 60 },
    shoulderHeight: { mean: 1400, sd: 45 },
    armLength: { mean: 740, sd: 40 },
    eyeHeight: { mean: 1580, sd: 55 }
  },
  女: {
    stature: { mean: 1580, sd: 55 },
    shoulderHeight: { mean: 1290, sd: 42 },
    armLength: { mean: 660, sd: 35 },
    eyeHeight: { mean: 1470, sd: 50 }
  }
};

export function bodyDimensions(percentile: Percentile, sex: Sex): BodyDimensions {
  const z = Z[percentile] ?? 0;
  const d = DATA[sex] ?? DATA['男'];
  const calc = (k: keyof BodyDimensions) => Number((d[k].mean + z * d[k].sd).toFixed(0));
  return {
    stature: calc('stature'),
    shoulderHeight: calc('shoulderHeight'),
    armLength: calc('armLength'),
    eyeHeight: calc('eyeHeight')
  };
}
