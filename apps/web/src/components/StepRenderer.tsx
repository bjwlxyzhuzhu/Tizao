import { useState } from 'react';
import type { AiReviewResponse, StepDefinition, StepResult } from '@tizao/shared';
import { api } from '../api';
import { ForgeScene } from '../scenes/ForgeScene';
import { FurnaceScene } from '../scenes/FurnaceScene';
import { WorkstationScene } from '../scenes/WorkstationScene';
import { ChartView } from './ChartView';

interface Props {
  step: StepDefinition;
  input: Record<string, number | string>;
  onChange: (key: string, value: number | string) => void;
  sessionId?: number;
  result: StepResult | null;
}

export function StepRenderer({ step, input, onChange, sessionId, result }: Props) {
  const [review, setReview] = useState<AiReviewResponse | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [report, setReport] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);
  const [localError, setLocalError] = useState<string>('');

  const raw = result?.result ?? {};
  const numberResult = (key: string, fallback: number): number => {
    const value = raw[key];
    return typeof value === 'number' ? value : fallback;
  };
  const timeS = Array.isArray(raw.timeS) ? raw.timeS as number[] : [];
  const centerTempC = Array.isArray(raw.centerTempC) ? raw.centerTempC as number[] : [];

  const runReview = async () => {
    setReviewLoading(true);
    setLocalError('');
    try {
      const data = await api.review(input, sessionId);
      setReview(data);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'AI 评审失败');
    } finally {
      setReviewLoading(false);
    }
  };

  const runReport = async () => {
    if (!sessionId) return;
    setReportLoading(true);
    setLocalError('');
    try {
      const data = await api.report(sessionId);
      setReport(data.contentMd);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : '报告生成失败');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div>
      {step.scene === 'furnace' ? (
        <FurnaceScene
          meltRate={Number(input.meltRate ?? 12)}
          poolDepthMm={numberResult('poolDepthMm', 40)}
        />
      ) : null}

      {step.scene === 'forge' ? (
        <ForgeScene
          pressSpeed={Number(input.pressSpeed ?? 5)}
          temperatureC={Number(input.finalTempC ?? input.anodizeV ?? 900)}
        />
      ) : null}

      {step.scene === 'workstation' ? (
        <WorkstationScene
          benchHeightMm={Number(input.benchHeight ?? 900)}
          targetXMm={Number(input.targetX ?? 450)}
          shoulderHeightMm={Number(input.shoulderH ?? 1350)}
          armLengthMm={Number(input.armLen ?? 700)}
        />
      ) : null}

      {timeS.length > 1 && centerTempC.length > 1 ? (
        <ChartView timeS={timeS} series={centerTempC} />
      ) : null}

      {step.fields.length > 0 ? (
        <div className="form-grid">
          {step.fields.map((field) => (
            <div className="field" key={field.key}>
              <label htmlFor={`${step.id}-${field.key}`}>
                {field.label}{field.unit ? `（${field.unit}）` : ''}
              </label>

              {field.kind === 'select' ? (
                <select
                  id={`${step.id}-${field.key}`}
                  value={String(input[field.key] ?? '')}
                  onChange={(event) => onChange(field.key, event.target.value)}
                >
                  {field.options?.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : field.kind === 'number' ? (
                <input
                  id={`${step.id}-${field.key}`}
                  type="number"
                  value={String(input[field.key] ?? '')}
                  onChange={(event) => onChange(
                    field.key,
                    event.target.value === '' ? '' : Number(event.target.value)
                  )}
                />
              ) : (
                <input
                  id={`${step.id}-${field.key}`}
                  value={String(input[field.key] ?? '')}
                  onChange={(event) => onChange(field.key, event.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      ) : null}

      {step.type === 'ai' ? (
        <div style={{ marginTop: 16 }}>
          <button className="ghost" onClick={runReview} disabled={reviewLoading}>
            {reviewLoading ? '评审中…' : '运行 AI 方案预评审'}
          </button>
          {review ? (
            <div className="risks">
              <span className="badge">来源：{review.source === 'model' ? '大模型' : '规则引擎'}</span>
              {review.risks.map((risk, index) => (
                <div key={index} className={`risk ${risk.level}`}>
                  <b>{risk.item}</b>
                  {risk.reason}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {step.type === 'auto' ? (
        <div style={{ marginTop: 16 }}>
          <button className="ghost" onClick={runReport} disabled={reportLoading || !sessionId}>
            {reportLoading ? '生成中…' : '生成实验报告'}
          </button>
          {report ? (
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12, fontSize: 12, lineHeight: 1.7 }}>
              {report}
            </pre>
          ) : null}
        </div>
      ) : null}

      {localError ? <div className="error">{localError}</div> : null}
    </div>
  );
}
