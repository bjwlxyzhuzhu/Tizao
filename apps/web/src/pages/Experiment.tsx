import { useEffect, useMemo, useState } from 'react';
import { getStep, STEPS, type StepDefinition } from '@tizao/shared';
import { StepRenderer } from '../components/StepRenderer';
import { useSessionStore } from '../stores/session';

function defaultsFor(step: StepDefinition): Record<string, number | string> {
  const values: Record<string, number | string> = {};
  for (const field of step.fields) {
    values[field.key] = field.default ?? (field.kind === 'number' ? 0 : '');
  }
  return values;
}

function summarize(result: Record<string, unknown>): Array<[string, string]> {
  return Object.entries(result).map(([key, value]) => {
    if (Array.isArray(value)) return [key, `数组（${value.length} 点）`];
    if (value && typeof value === 'object') return [key, Object.entries(value as Record<string, unknown>).map(([k, v]) => `${k}: ${String(v)}`).join('，')];
    return [key, String(value)];
  });
}

export function Experiment() {
  const user = useSessionStore((state) => state.user);
  const session = useSessionStore((state) => state.session);
  const lastResult = useSessionStore((state) => state.lastResult);
  const loading = useSessionStore((state) => state.loading);
  const error = useSessionStore((state) => state.error);
  const start = useSessionStore((state) => state.start);
  const submit = useSessionStore((state) => state.submit);
  const reset = useSessionStore((state) => state.reset);
  const logout = useSessionStore((state) => state.logout);
  const clearError = useSessionStore((state) => state.clearError);

  const [input, setInput] = useState<Record<string, number | string>>({});
  const step = session ? getStep(session.currentStepId) : undefined;

  useEffect(() => {
    if (!session) void start();
  }, [session, start]);

  useEffect(() => {
    if (step) setInput(defaultsFor(step));
  }, [step?.id]);

  const done = useMemo(
    () => new Set(session?.stepRecords.map((record) => record.stepId) ?? []),
    [session]
  );

  const onChange = (key: string, value: number | string) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = () => {
    if (!step || loading) return;
    void submit(step.id, input);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>钛境智造</strong>
          <span>钛合金构件智能制造与人机协同虚拟仿真实验</span>
        </div>
        <div className="topbar-right">
          <span className="badge">{user?.role ?? 'student'}</span>
          <span>{user?.username ?? '-'}</span>
          <span className="score-pill">{(session?.totalScore ?? 0).toFixed(1)} / 100</span>
          <button className="ghost" onClick={() => void reset()} disabled={loading}>重置</button>
          <button className="ghost" onClick={logout}>退出</button>
        </div>
      </header>

      <main className="lab">
        <aside className="panel">
          <div className="panel-title">实验步骤 · 24</div>
          <div className="step-list">
            {STEPS.map((item) => {
              const isActive = item.id === session?.currentStepId;
              const isDone = done.has(item.id);
              return (
                <div key={item.id} className={`step-item${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
                  <span className="step-seq">{String(item.seq).padStart(2, '0')}</span>
                  <span>{item.name}</span>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="panel stage">
          <div className="stage-head">
            <h2>{step ? `${step.seq}. ${step.name}` : '加载中…'}</h2>
            <p>{step?.description ?? '正在准备实验环境'}</p>
          </div>

          <div className="stage-body">
            {step ? (
              <StepRenderer
                step={step}
                input={input}
                onChange={onChange}
                sessionId={session?.sessionId}
                result={lastResult && lastResult.stepId === step.id ? lastResult : null}
              />
            ) : (
              <div className="empty">正在创建实验会话…</div>
            )}
          </div>

          <div className="stage-foot">
            <span className="badge">步骤满分 {step?.maxScore ?? 0}</span>
            <button className="primary" style={{ width: 'auto' }} onClick={onSubmit} disabled={loading || !step}>
              {loading ? '提交中…' : '提交本步并继续'}
            </button>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-title">结果与反馈</div>
          {error ? (
            <div className="result-box">
              <div className="error">{error}</div>
              <button className="ghost" onClick={clearError} style={{ marginTop: 12 }}>知道了</button>
            </div>
          ) : null}

          {lastResult ? (
            <div className="result-box">
              <h3>{lastResult.stepId} · {lastResult.score} / {lastResult.maxScore}</h3>
              <div className="kv">
                {summarize(lastResult.result).map(([key, value]) => (
                  <span key={key} style={{ display: 'contents' }}>
                    <span>{key}</span>
                    <span>{value}</span>
                  </span>
                ))}
              </div>
              <div className="feedback">{lastResult.feedback}</div>
            </div>
          ) : (
            <div className="result-box">
              <div className="empty">提交后在这里查看仿真结果与得分。</div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
