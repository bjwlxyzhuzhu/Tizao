import { Router } from 'express';
import { getStep, nextStepId, STEPS, type SessionState, type StepInput } from '@tizao/shared';
import { buildProfile, evaluateStep } from '@tizao/scoring';
import {
  bodyDimensions,
  betaFraction,
  costAndYield,
  flowStressMpa,
  hardnessAndYield,
  reachCheck,
  recrystallizedFraction,
  rulaScore,
  scheilSeverity,
  secondaryDendriteArmSpacing,
  simulateThermal,
  TC4
} from '@tizao/sim-core';
import { authRequired, type AuthedRequest } from '../auth.js';
import { db, nowIso } from '../db.js';

export const experimentRouter = Router();

interface SessionRow {
  id: number;
  user_id: number;
  started_at: string;
  finished_at: string | null;
  total_score: number;
  current_step_id: string;
}

interface RecordRow {
  step_id: string;
  score: number;
  max_score: number;
}

function num(input: StepInput, key: string, fallback: number): number {
  const value = input[key];
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function text(input: StepInput, key: string, fallback: string): string {
  const value = input[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function thermalRun(meltRate: number) {
  return simulateThermal({
    initialTempC: 1700,
    boundaryTempC: 300,
    lengthMm: 600,
    nodes: 80,
    totalTimeS: 1200,
    alphaMm2S: TC4.thermalDiffusivityMm2S,
    meltRateMmMin: meltRate
  });
}

function runStep(
  stepId: string,
  input: StepInput,
  records: Array<{ stepId: string; score: number; maxScore: number }>
): Record<string, unknown> {
  switch (stepId) {
    case 'S03': {
      const percentile = text(input, 'percentile', 'P50') as 'P5' | 'P50' | 'P95';
      const sex = text(input, 'sex', '男') as '男' | '女';
      return { dimensions: bodyDimensions(percentile, sex) };
    }
    case 'S05': {
      const sponge = num(input, 'spongeKg', 100);
      const alv = num(input, 'alVKg', 6);
      const alloyingPct = sponge > 0 ? (alv / sponge) * 100 : 6;
      const segregation = scheilSeverity(alloyingPct, 0.8);
      return {
        alloyingPct: Number(alloyingPct.toFixed(2)),
        segregationIndex: segregation.index,
        liquidCurve: segregation.cL
      };
    }
    case 'S06': {
      const targetPa = num(input, 'targetPa', 1);
      const pumpMin = num(input, 'pumpMin', 30);
      const achievedPa = Math.max(0.05, targetPa * Math.exp(-pumpMin / 20));
      return {
        achievedPa: Number(achievedPa.toFixed(2)),
        ok: achievedPa <= targetPa * 1.2,
        pumpMin
      };
    }
    case 'S07': {
      const meltRate = num(input, 'meltRate', 12);
      const result = thermalRun(meltRate);
      return {
        poolDepthMm: result.poolDepthMm,
        solidificationTimeS: result.solidificationTimeS,
        superheatC: result.superheatC,
        timeS: result.timeS,
        centerTempC: result.centerTempC
      };
    }
    case 'S08': {
      const startCurrentA = num(input, 'startCurrentA', 3000);
      const rampSec = num(input, 'rampSec', 60);
      const arcStability = Math.max(0, Math.min(100,
        100 - Math.abs(startCurrentA - 3000) / 100 - Math.abs(rampSec - 60) * 0.5
      ));
      return { arcStability: Number(arcStability.toFixed(1)) };
    }
    case 'S09': {
      const effectiveMeltRate = 12 + num(input, 'adjustRate', 0);
      const result = thermalRun(effectiveMeltRate);
      return {
        effectiveMeltRate,
        poolDepthMm: result.poolDepthMm,
        solidificationTimeS: result.solidificationTimeS,
        timeS: result.timeS,
        centerTempC: result.centerTempC
      };
    }
    case 'S10': {
      const coolingRate = Math.max(0.5, 20 - num(input, 'meltRate', 0));
      return {
        sdasUm: secondaryDendriteArmSpacing(coolingRate),
        observation: text(input, 'defect', '正常')
      };
    }
    case 'S11': {
      return {
        segregationIndex: num(input, 'segregationIndex', 1.2),
        defect: text(input, 'defect', '无')
      };
    }
    case 'S12': {
      const forgeTempC = num(input, 'forgeTempC', 950);
      return {
        flowStressMpa: flowStressMpa(1, forgeTempC),
        phaseRegion: forgeTempC >= TC4.betaTransusC ? 'β 相区' : 'α+β 相区'
      };
    }
    case 'S13': {
      const strain = Math.max(0.05, num(input, 'passes', 4) * num(input, 'reductionPct', 25) / 100);
      const recrystallization = recrystallizedFraction(300, 950, strain, 50);
      return { strain: Number(strain.toFixed(2)), ...recrystallization };
    }
    case 'S14': {
      const pressSpeed = num(input, 'pressSpeed', 5);
      const finalTempC = num(input, 'finalTempC', 900);
      return {
        strainRate: Number((pressSpeed / 10).toFixed(2)),
        flowStressMpa: flowStressMpa(pressSpeed / 10, finalTempC)
      };
    }
    case 'S15': {
      return { defect: text(input, 'defect', '无') };
    }
    case 'S16': {
      const grainUm = num(input, 'grainUm', 50);
      return { grainUm, ...hardnessAndYield(grainUm) };
    }
    case 'S17': {
      const agingC = num(input, 'agingC', 540);
      const agingH = num(input, 'agingH', 6);
      return {
        betaFraction: betaFraction(agingH * 3600, agingC),
        ...hardnessAndYield(50)
      };
    }
    case 'S18': {
      const coolingRate = num(input, 'coolingRate', 10);
      const grainUm = Math.max(10, 80 - coolingRate * 2);
      return { grainUm: Number(grainUm.toFixed(0)), ...hardnessAndYield(grainUm) };
    }
    case 'S19': {
      const voltage = num(input, 'anodizeV', 60);
      const minutes = num(input, 'anodizeMin', 20);
      return {
        filmThicknessUm: Number((voltage * minutes * 0.08).toFixed(1)),
        colorDelta: Number((Math.abs(voltage - 60) * 0.2).toFixed(1))
      };
    }
    case 'S20': {
      const benchHeight = num(input, 'benchHeight', 900);
      const deviationMm = Math.abs(benchHeight - 950);
      return {
        deviationMm,
        suggestion: deviationMm <= 50 ? '工位高度合适' : '建议调整至 900–1000 mm'
      };
    }
    case 'S21': {
      const shoulderH = num(input, 'shoulderH', 1350);
      const armLen = num(input, 'armLen', 700);
      const targetX = num(input, 'targetX', 450);
      return { ...reachCheck(shoulderH, armLen, targetX, shoulderH - 150) };
    }
    case 'S22': {
      return {
        ...rulaScore(
          num(input, 'upperArmDeg', 45),
          num(input, 'trunkDeg', 10),
          num(input, 'neckDeg', 20)
        )
      };
    }
    case 'S23': {
      const result = costAndYield(100, 6, 20, 12, 25);
      const targetCost = num(input, 'targetCost', 500);
      const targetYield = num(input, 'targetYield', 80);
      return {
        ...result,
        meetsCost: result.total <= targetCost,
        meetsYield: result.yieldPct >= targetYield
      };
    }
    case 'S24': {
      return { profile: buildProfile(records) };
    }
    default:
      return { echo: input };
  }
}

function loadSession(sessionId: number, userId: number): SessionState | null {
  const session = db
    .prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?')
    .get(sessionId, userId) as SessionRow | undefined;
  if (!session) return null;

  const rows = db
    .prepare('SELECT step_id, score, max_score FROM step_records WHERE session_id = ? ORDER BY id')
    .all(sessionId) as unknown as RecordRow[];

  return {
    sessionId: session.id,
    currentStepId: session.current_step_id,
    totalScore: Number(Number(session.total_score).toFixed(1)),
    finished: session.finished_at !== null,
    stepRecords: rows.map((row) => ({
      stepId: row.step_id,
      score: Number(row.score),
      maxScore: Number(row.max_score)
    }))
  };
}

experimentRouter.get('/steps', (_req, res) => {
  res.json({ steps: STEPS });
});

experimentRouter.post('/start', authRequired, (req: AuthedRequest, res) => {
  const user = req.user!;
  const info = db
    .prepare('INSERT INTO sessions (user_id, started_at, current_step_id) VALUES (?, ?, ?)')
    .run(user.id, nowIso(), 'S01');
  const sessionId = Number(info.lastInsertRowid);
  res.json(loadSession(sessionId, user.id));
});

experimentRouter.post('/:id/reset', authRequired, (req: AuthedRequest, res) => {
  const user = req.user!;
  const sessionId = Number(req.params.id);
  if (!loadSession(sessionId, user.id)) {
    res.status(404).json({ code: 'NO_SESSION', message: '实验会话不存在' });
    return;
  }
  db.prepare('DELETE FROM step_records WHERE session_id = ?').run(sessionId);
  db.prepare('UPDATE sessions SET total_score = 0, current_step_id = ?, finished_at = NULL WHERE id = ?')
    .run('S01', sessionId);
  res.json(loadSession(sessionId, user.id));
});

experimentRouter.get('/:id', authRequired, (req: AuthedRequest, res) => {
  const user = req.user!;
  const state = loadSession(Number(req.params.id), user.id);
  if (!state) {
    res.status(404).json({ code: 'NO_SESSION', message: '实验会话不存在' });
    return;
  }
  res.json(state);
});

experimentRouter.post('/:id/step/:stepId', authRequired, (req: AuthedRequest, res) => {
  const user = req.user!;
  const sessionId = Number(req.params.id);
  const stepId = String(req.params.stepId);
  const session = db
    .prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?')
    .get(sessionId, user.id) as SessionRow | undefined;

  if (!session) {
    res.status(404).json({ code: 'NO_SESSION', message: '实验会话不存在' });
    return;
  }

  const step = getStep(stepId);
  if (!step) {
    res.status(400).json({ code: 'BAD_STEP', message: '步骤不存在' });
    return;
  }

  const input = (req.body?.input ?? {}) as StepInput;
  const existingRows = db
    .prepare('SELECT step_id, score, max_score FROM step_records WHERE session_id = ? ORDER BY id')
    .all(sessionId) as unknown as RecordRow[];
  const records = existingRows.map((row) => ({
    stepId: row.step_id,
    score: Number(row.score),
    maxScore: Number(row.max_score)
  }));

  const startedAt = Date.now();
  const result = runStep(stepId, input, records);
  const outcome = evaluateStep(step, input);
  const next = nextStepId(stepId);
  const durationMs = Date.now() - startedAt;

  const previous = existingRows.find((row) => row.step_id === stepId);
  if (previous) {
    db.prepare('DELETE FROM step_records WHERE session_id = ? AND step_id = ?').run(sessionId, stepId);
  }

  db.prepare(`
    INSERT INTO step_records (session_id, step_id, input_json, output_json, score, max_score, duration_ms, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    stepId,
    JSON.stringify(input),
    JSON.stringify(result),
    outcome.score,
    step.maxScore,
    durationMs,
    nowIso()
  );

  const baseTotal = Number(session.total_score) - Number(previous?.score ?? 0);
  const totalScore = Number((baseTotal + outcome.score).toFixed(1));
  const finished = next === null;

  db.prepare('UPDATE sessions SET total_score = ?, current_step_id = ?, finished_at = ? WHERE id = ?')
    .run(totalScore, next ?? stepId, finished ? nowIso() : null, sessionId);

  res.json({
    stepId,
    score: outcome.score,
    maxScore: step.maxScore,
    result,
    feedback: outcome.feedback,
    nextStepId: next
  });
});
