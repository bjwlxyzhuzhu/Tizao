import { Router } from 'express';
import type { AiReviewResponse, StepInput } from '@tizao/shared';
import { STEPS } from '@tizao/shared';
import { buildProfile } from '@tizao/scoring';
import { authRequired, type AuthedRequest } from '../auth.js';
import { db, nowIso } from '../db.js';
import { callModel } from '../ai/client.js';

export const aiRouter = Router();

type Risk = AiReviewResponse['risks'][number];

function num(input: StepInput, key: string, fallback: number): number {
  const parsed = Number(input[key]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function text(input: StepInput, key: string, fallback: string): string {
  const value = input[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function ruleReview(input: StepInput): Risk[] {
  const risks: Risk[] = [];
  const grade = text(input, 'grade', 'TC4');
  const partType = text(input, 'partType', '支架');
  const meltRate = num(input, 'meltRate', 12);
  const percentile = text(input, 'percentile', 'P50');

  if (grade === 'TA15' && partType === '法兰') {
    risks.push({
      level: 'mid',
      item: '材料与构件匹配',
      reason: '大规格法兰采用 TA15 时锻造窗口较窄，需确认设备能力与热处理制度。'
    });
  }
  if (meltRate > 16) {
    risks.push({
      level: 'high',
      item: '熔速过高',
      reason: '熔速超过 16 mm/min 会导致熔池过深，缩孔与偏析风险显著上升。'
    });
  }
  if (percentile === 'P5') {
    risks.push({
      level: 'mid',
      item: '人机尺寸基准',
      reason: '以 P5 为设计基准时需校核高百分位用户的可达性与舒适度。'
    });
  }
  if (risks.length === 0) {
    risks.push({
      level: 'low',
      item: '方案完整性',
      reason: '当前方案未发现明显风险，建议补充成本约束与工效评价。'
    });
  }
  return risks.slice(0, 3);
}

aiRouter.post('/review', authRequired, async (req: AuthedRequest, res) => {
  const input = (req.body?.input ?? {}) as StepInput;
  const sessionId = req.body?.sessionId ? Number(req.body.sessionId) : null;
  const startedAt = Date.now();

  const prompt = [
    '你是钛合金成形工艺与工效学教学助手。',
    `学生方案：${JSON.stringify(input)}`,
    '请列出最多 3 条风险，只输出 JSON，不要解释。',
    '格式：{"risks":[{"level":"high|mid|low","item":"...","reason":"..."}]}'
  ].join('\n');

  const modelText = await callModel([
    { role: 'system', content: '你只输出合法 JSON。' },
    { role: 'user', content: prompt }
  ]);

  let risks: Risk[] | null = null;
  let source: AiReviewResponse['source'] = 'rule';
  if (modelText) {
    try {
      const start = modelText.indexOf('{');
      const end = modelText.lastIndexOf('}');
      const parsed = JSON.parse(modelText.slice(start, end + 1)) as { risks?: Risk[] };
      if (Array.isArray(parsed.risks) && parsed.risks.length > 0) {
        risks = parsed.risks.slice(0, 3);
        source = 'model';
      }
    } catch {
      risks = null;
    }
  }
  if (!risks) risks = ruleReview(input);

  db.prepare(`
    INSERT INTO ai_logs (session_id, agent, model, prompt_hash, response, latency_ms, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    'review',
    process.env.AI_MODEL ?? null,
    `len:${prompt.length}`,
    JSON.stringify(risks),
    Date.now() - startedAt,
    nowIso()
  );

  const payload: AiReviewResponse = { risks, source };
  res.json(payload);
});

aiRouter.post('/feedback', authRequired, (req: AuthedRequest, res) => {
  const stepId = String(req.body?.stepId ?? '');
  const result = (req.body?.result ?? {}) as Record<string, unknown>;

  let feedback = '参数已提交，请结合结果判断下一步。';
  if (result.ok === false) feedback = '真空度未达到目标，建议延长抽真空时间或检查密封。';
  else if (typeof result.poolDepthMm === 'number' && result.poolDepthMm > 80) {
    feedback = '熔池深度偏大，建议降低熔速后重新熔炼。';
  } else if (result.reachable === false) {
    feedback = '目标位置超出可达域，建议调整工位或物料位置。';
  } else if (typeof result.actionLevel === 'number' && result.actionLevel >= 3) {
    feedback = '工效风险较高，建议优先改善作业姿态。';
  } else if (stepId) {
    feedback = '本步骤已完成，结果已计入能力画像。';
  }

  res.json({ feedback });
});

aiRouter.post('/report', authRequired, (req: AuthedRequest, res) => {
  const user = req.user!;
  const sessionId = Number(req.body?.sessionId ?? 0);
  const session = db
    .prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?')
    .get(sessionId, user.id) as { id: number; total_score: number } | undefined;
  if (!session) {
    res.status(404).json({ code: 'NO_SESSION', message: '实验会话不存在' });
    return;
  }

  const rows = db
    .prepare('SELECT step_id, score, max_score FROM step_records WHERE session_id = ? ORDER BY id')
    .all(sessionId) as Array<{ step_id: string; score: number; max_score: number }>;

  const records = rows.map((row) => ({
    stepId: row.step_id,
    score: Number(row.score),
    maxScore: Number(row.max_score)
  }));
  const profile = buildProfile(records);

  const lines: string[] = [];
  lines.push(`# 钛境智造 · 实验报告`);
  lines.push('');
  lines.push(`- 学生：${user.username}`);
  lines.push(`- 会话编号：${sessionId}`);
  lines.push(`- 生成时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push(`- 总分：${Number(session.total_score).toFixed(1)} / 100`);
  lines.push('');
  lines.push('## 能力画像');
  lines.push('');
  lines.push('| 维度 | 得分 | 满分 | 达成率 |');
  lines.push('| --- | ---: | ---: | ---: |');
  for (const item of profile) {
    lines.push(`| ${item.label} | ${item.score} | ${item.max} | ${item.percent}% |`);
  }
  lines.push('');
  lines.push('## 步骤记录');
  lines.push('');
  lines.push('| 步骤 | 名称 | 得分 | 满分 |');
  lines.push('| --- | --- | ---: | ---: |');
  for (const record of records) {
    const step = STEPS.find((s) => s.id === record.stepId);
    lines.push(`| ${record.stepId} | ${step?.name ?? '-'} | ${record.score} | ${record.maxScore} |`);
  }
  lines.push('');
  lines.push('## 结论');
  lines.push('');
  const weakest = [...profile].sort((a, b) => a.percent - b.percent)[0];
  lines.push(weakest
    ? `本次实验 weakest 维度为「${weakest.label}」，达成率 ${weakest.percent}%，建议针对该维度补充练习。`
    : '暂无足够数据形成结论。');

  const contentMd = lines.join('\n');
  const info = db
    .prepare('INSERT INTO reports (session_id, content_md, created_at) VALUES (?, ?, ?)')
    .run(sessionId, contentMd, nowIso());

  res.json({ reportId: Number(info.lastInsertRowid), contentMd });
});
