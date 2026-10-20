import type { StepDefinition, StepInput } from '@tizao/shared';

export interface ScoreOutcome {
  score: number;
  feedback: string;
}

const RULES: Record<string, (input: StepInput) => string | null> = {
  S07: (i) => {
    const current = Number(i.currentA ?? 0);
    const meltRate = Number(i.meltRate ?? 0);
    if (current < 6000 || current > 10000) return '电流偏离推荐区间 6000–10000 A';
    if (meltRate < 8 || meltRate > 16) return '熔速偏离推荐区间 8–16 mm/min';
    return null;
  },
  S12: (i) => {
    const t = Number(i.forgeTempC ?? 0);
    return t < 900 || t > 980 ? '锻造温度偏离推荐区间 900–980 °C' : null;
  },
  S13: (i) => {
    const passes = Number(i.passes ?? 0);
    const reduction = Number(i.reductionPct ?? 0);
    if (passes < 3) return '道次少于 3，变形不充分';
    if (reduction < 15 || reduction > 35) return '单道压下量偏离 15–35%';
    return null;
  },
  S17: (i) => {
    const solution = Number(i.solutionC ?? 0);
    const aging = Number(i.agingC ?? 0);
    if (solution < 930 || solution > 970) return '固溶温度偏离推荐区间 930–970 °C';
    if (aging < 520 || aging > 560) return '时效温度偏离推荐区间 520–560 °C';
    return null;
  },
  S20: (i) => {
    const h = Number(i.benchHeight ?? 0);
    return h < 850 || h > 1000 ? '工位高度偏离 850–1000 mm' : null;
  },
  S22: (i) => {
    const upper = Number(i.upperArmDeg ?? 0);
    return upper > 90 ? '上臂抬举超过 90°，工效风险高' : null;
  },
  S23: (i) => {
    const y = Number(i.targetYield ?? 0);
    return y < 70 || y > 95 ? '目标成材率建议设定在 70–95%' : null;
  }
};

export function evaluateStep(step: StepDefinition, input: StepInput): ScoreOutcome {
  if (step.fields.length === 0) {
    return { score: Number((step.maxScore * 0.9).toFixed(1)), feedback: '已完成本步骤。' };
  }

  const filled = step.fields.filter((f) => {
    const v = input[f.key];
    return v !== undefined && v !== '';
  }).length;
  const completeness = filled / step.fields.length;

  let ratio = 0.5 + 0.35 * completeness;
  const notes: string[] = [];

  const rule = RULES[step.id];
  if (rule) {
    const warning = rule(input);
    if (warning) {
      notes.push(warning);
      ratio = Math.min(ratio, 0.7);
    } else {
      ratio = Math.min(1, ratio + 0.15);
      notes.push('关键参数在推荐区间内。');
    }
  } else if (completeness === 1) {
    notes.push('参数填写完整。');
  } else {
    notes.push('部分参数未填写。');
  }

  return {
    score: Number((step.maxScore * ratio).toFixed(1)),
    feedback: notes.join('；')
  };
}

export interface ProfileDimension {
  key: string;
  label: string;
  score: number;
  max: number;
  percent: number;
}

const DIMENSIONS: Array<{ key: string; label: string; steps: string[] }> = [
  { key: 'design', label: '工艺设计', steps: ['S01', 'S02', 'S03', 'S04', 'S05', 'S07', 'S12', 'S13', 'S17'] },
  { key: 'control', label: '过程控制', steps: ['S06', 'S08', 'S09', 'S14', 'S18', 'S19'] },
  { key: 'quality', label: '质量判读', steps: ['S10', 'S11', 'S15', 'S16'] },
  { key: 'ergonomics', label: '人机工效', steps: ['S20', 'S21', 'S22'] },
  { key: 'optimization', label: '成本优化', steps: ['S23', 'S24'] }
];

export function buildProfile(
  records: Array<{ stepId: string; score: number; maxScore: number }>
): ProfileDimension[] {
  return DIMENSIONS.map((d) => {
    const items = records.filter((r) => d.steps.includes(r.stepId));
    const score = items.reduce((s, r) => s + r.score, 0);
    const max = items.reduce((s, r) => s + r.maxScore, 0);
    return {
      key: d.key,
      label: d.label,
      score: Number(score.toFixed(1)),
      max,
      percent: max > 0 ? Number(((score / max) * 100).toFixed(1)) : 0
    };
  });
}
