'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

/* ── Types ─────────────────────────────────────────── */

interface Scenario {
  value: string;
  label: string;
  emoji: string;
}

interface Tool {
  slug: string;
  name: string;
}

interface RunResult {
  phase: string;
  tool: string;
  toolName: string;
  query: string;
  queryIndex: number;
  latencyMs: number;
  resultCount: number;
  relevance: number | null;
  success: boolean;
  costUsd?: number;
  fromCache?: boolean;
}

interface Summary {
  avgLatency: number;
  avgRelevance: number;
  avgCost: number;
  successRate: number;
  tests: number;
}

interface ArenaComplete {
  session_id: string;
  url: string;
  userSummary: Summary;
  optimalSummary: Summary;
  delta: {
    latencyDelta: string; qualityDelta: string; costDelta: string;
    latencyPct?: number | null; qualityPct?: number | null; costPct?: number | null;
  };
  optimalTools: { slug: string; name: string }[];
}

type TaskStatus = 'pending' | 'active' | 'complete';

interface TaskStep {
  label: string;
  status: TaskStatus;
  detail?: string;
}

type Phase = 'input' | 'running' | 'results';

interface ArenaClientProps {
  scenarios: Scenario[];
  availableTools: Tool[];
  initialTools?: string[];
  initialScenario?: string;
}

/* ── Component ─────────────────────────────────────── */

export default function ArenaClient({ scenarios, availableTools, initialTools = [], initialScenario = '' }: ArenaClientProps) {
  const [phase, setPhase] = useState<Phase>('input');
  const [scenario, setScenario] = useState(initialScenario);
  const [selectedTools, setSelectedTools] = useState<string[]>(initialTools);
  const [queries, setQueries] = useState<string[]>(['']);
  const [error, setError] = useState('');

  // Running state
  const [tasks, setTasks] = useState<TaskStep[]>([]);
  const [workspaceContent, setWorkspaceContent] = useState<RunResult | null>(null);
  const [workspaceMessage, setWorkspaceMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [userResults, setUserResults] = useState<RunResult[]>([]);
  const [optimalResults, setOptimalResults] = useState<RunResult[]>([]);
  const [elapsed, setElapsed] = useState(0);

  // Results state
  const [completionData, setCompletionData] = useState<ArenaComplete | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const toggleTool = (slug: string) => {
    setSelectedTools((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug].slice(0, 4),
    );
  };

  const updateQuery = (index: number, value: string) => {
    setQueries((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addQuery = () => {
    if (queries.length < 5) setQueries((prev) => [...prev, '']);
  };

  const removeQuery = (index: number) => {
    if (queries.length > 1) setQueries((prev) => prev.filter((_, i) => i !== index));
  };

  const startArena = useCallback(async () => {
    const cleanQueries = queries.filter((q) => q.trim());
    if (!scenario || selectedTools.length === 0 || cleanQueries.length === 0) {
      setError('Please select a scenario, at least one tool, and enter at least one query.');
      return;
    }

    setError('');
    setPhase('running');
    setElapsed(0);
    setUserResults([]);
    setOptimalResults([]);
    setProgress(0);
    setWorkspaceContent(null);
    setWorkspaceMessage('Initializing arena...');

    // Initial task list
    setTasks([
      { label: 'Preparing queries', status: 'active' },
      { label: `Loading domain context [${scenario}]`, status: 'pending' },
      { label: `Testing YOUR stack (${selectedTools.join(', ')})`, status: 'pending' },
      { label: 'Testing OPTIMAL stack', status: 'pending' },
      { label: 'Evaluating relevance', status: 'pending' },
      { label: 'Computing savings', status: 'pending' },
      { label: 'Generating report', status: 'pending' },
    ]);

    // Start timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      const resp = await fetch('/api/v1/arena/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          current_tools: selectedTools,
          queries: cleanQueries,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        setError(err.error || 'Arena failed');
        setPhase('input');
        clearInterval(timerRef.current);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.slice(6));
              handleSSEEvent(eventType, data);
            } catch { /* skip malformed */ }
            eventType = '';
          }
        }
      }
    } catch {
      setError('Connection lost. Please try again.');
      setPhase('input');
    } finally {
      clearInterval(timerRef.current);
    }
  }, [scenario, selectedTools, queries]);

  const handleSSEEvent = (event: string, data: Record<string, unknown>) => {
    if (event === 'step') {
      const step = data.step as string;
      const status = data.status as string;

      if (step === 'preparing' && status === 'complete') {
        updateTask(0, 'complete');
        updateTask(1, 'active');
        setProgress(10);
        setWorkspaceMessage('Loading domain context...');
      } else if (step === 'loading_context' && status === 'complete') {
        updateTask(1, 'complete');
        setProgress(15);
      } else if (step === 'testing_user_stack') {
        if (status === 'started') {
          updateTask(2, 'active');
          setProgress(20);
          setWorkspaceMessage('Testing your current stack...');
        } else if (status === 'complete') {
          updateTask(2, 'complete');
          setProgress(50);
        }
      } else if (step === 'testing_optimal') {
        if (status === 'started') {
          updateTask(3, 'active');
          setProgress(55);
          setWorkspaceMessage('Testing optimal alternative stack...');
        } else if (status === 'complete') {
          updateTask(3, 'complete');
          setProgress(75);
        }
      } else if (step === 'evaluating' && status === 'complete') {
        updateTask(4, 'complete');
        setProgress(85);
      } else if (step === 'computing_savings' && status === 'complete') {
        updateTask(5, 'complete');
        setProgress(92);
      } else if (step === 'generating_report' && status === 'complete') {
        updateTask(6, 'complete');
        setProgress(100);
      }
    } else if (event === 'result') {
      const result = data as unknown as RunResult;
      setWorkspaceContent(result);

      if (result.phase === 'user_stack') {
        setUserResults((prev) => [...prev, result]);
        setWorkspaceMessage(`Your stack: ${result.toolName} → ${result.latencyMs}ms, ${result.relevance != null ? result.relevance.toFixed(1) + '/5' : 'scoring...'}`);
      } else {
        setOptimalResults((prev) => [...prev, result]);
        setWorkspaceMessage(`Optimal: ${result.toolName} → ${result.latencyMs}ms, ${result.relevance != null ? result.relevance.toFixed(1) + '/5' : 'scoring...'} ${result.fromCache ? '(cached)' : ''}`);
      }
    } else if (event === 'complete') {
      const complete = data as unknown as ArenaComplete;
      setCompletionData(complete);
      setPhase('results');
      clearInterval(timerRef.current);
    } else if (event === 'error') {
      setError((data.message as string) || 'Arena error');
      setPhase('input');
      clearInterval(timerRef.current);
    }
  };

  const updateTask = (index: number, status: TaskStatus) => {
    setTasks((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], status };
      return next;
    });
  };

  /* ── Render ── */

  if (phase === 'input') return renderInput();
  if (phase === 'running') return renderWorkspace();
  if (phase === 'results' && completionData) return renderResults();
  return null;

  /* ── Input Phase ── */

  function renderInput() {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-border-default bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <h2 className="mb-6 text-xl font-bold text-text-primary">
            What&apos;s your agent doing?
          </h2>

          {/* Scenario selection */}
          <div className="mb-6 grid grid-cols-4 gap-2">
            {scenarios.map((s) => (
              <button
                key={s.value}
                onClick={() => setScenario(s.value)}
                className={`rounded-lg border p-3 text-center text-sm transition-all ${
                  scenario === s.value
                    ? 'border-indigo-400 bg-indigo-50 font-semibold text-indigo-700'
                    : 'border-border-default text-text-secondary hover:border-border-hover'
                }`}
              >
                <span className="block text-lg">{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Tool selection */}
          <h3 className="mb-3 text-sm font-semibold text-text-primary">
            What are you currently using?
          </h3>
          <div className="mb-6 flex flex-wrap gap-2">
            {availableTools.map((tool) => (
              <button
                key={tool.slug}
                onClick={() => toggleTool(tool.slug)}
                className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-all ${
                  selectedTools.includes(tool.slug)
                    ? 'border-indigo-400 bg-indigo-50 font-semibold text-indigo-700'
                    : 'border-border-default text-text-secondary hover:border-border-hover'
                }`}
              >
                {selectedTools.includes(tool.slug) ? '✓ ' : ''}{tool.name}
              </button>
            ))}
          </div>

          {/* Queries */}
          <h3 className="mb-3 text-sm font-semibold text-text-primary">
            Your queries (we test both stacks on these):
          </h3>
          <div className="mb-4 space-y-2">
            {queries.map((q, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={q}
                  onChange={(e) => updateQuery(i, e.target.value)}
                  placeholder={`Query ${i + 1}...`}
                  className="flex-1 rounded-lg border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-indigo-400 focus:outline-none"
                />
                {queries.length > 1 && (
                  <button
                    onClick={() => removeQuery(i)}
                    className="px-2 text-text-dim hover:text-text-primary"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {queries.length < 5 && (
              <button
                onClick={addQuery}
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                + Add query
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={startArena}
            className="w-full rounded-lg bg-[#0C0F1A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1E293B]"
          >
            Run Arena — 30 seconds
          </button>
        </div>
      </div>
    );
  }

  /* ── Workspace Phase (Manus-style split view) ── */

  function renderWorkspace() {
    const statusIcon = (s: TaskStatus) => {
      if (s === 'complete') return '✅';
      if (s === 'active') return '⏳';
      return '○';
    };

    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">
            Arena: Your Stack vs AgentPick Optimal
          </h2>
          <span className="font-mono text-xs text-text-dim">
            {elapsed}s elapsed
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="grid grid-cols-[280px_1fr] min-h-[500px]">
            {/* Left panel — Task Progress */}
            <div className="border-r border-border-default bg-[#F8FAFC] p-5">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Task Progress
              </div>
              <div className="space-y-3">
                {tasks.map((task, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`mt-0.5 text-sm ${task.status === 'active' ? 'animate-pulse' : ''}`}>
                      {statusIcon(task.status)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className={`text-[13px] ${task.status === 'complete' ? 'text-text-secondary' : task.status === 'active' ? 'font-medium text-text-primary' : 'text-text-dim'}`}>
                        {task.label}
                      </span>
                      {/* Show sub-results for user/optimal testing */}
                      {i === 2 && userResults.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {userResults.slice(-3).map((r, ri) => (
                            <div key={ri} className="font-mono text-[10px] text-text-dim">
                              · {r.toolName}: {r.latencyMs}ms, {r.resultCount} results{r.relevance != null ? `, ${r.relevance.toFixed(1)}/5` : ''}
                            </div>
                          ))}
                        </div>
                      )}
                      {i === 3 && optimalResults.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {optimalResults.slice(-3).map((r, ri) => (
                            <div key={ri} className="font-mono text-[10px] text-text-dim">
                              · {r.toolName}: {r.latencyMs}ms{r.relevance != null ? `, ${r.relevance.toFixed(1)}/5` : ''}{r.fromCache ? ' (cached)' : ''}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress indicator */}
              <div className="mt-6">
                <div className="mb-1 font-mono text-[10px] text-text-dim">
                  {tasks.filter(t => t.status === 'complete').length} / {tasks.length} steps
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-bg-muted">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right panel — Agent Workspace */}
            <div className="flex flex-col p-5">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Agent Workspace
              </div>

              <div className="flex-1">
                {workspaceContent ? (
                  <div className="rounded-xl border border-border-default bg-[#F8FAFC] p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded bg-bg-muted px-2 py-1 font-mono text-[11px] font-semibold text-text-primary">
                        {workspaceContent.phase === 'user_stack' ? 'Your Stack' : 'Optimal Stack'}: {workspaceContent.toolName}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                        workspaceContent.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {workspaceContent.success ? '200 OK' : 'Failed'}
                      </span>
                    </div>

                    <div className="mb-3 rounded-lg border border-border-default bg-white p-3">
                      <div className="mb-1 font-mono text-[10px] text-text-dim">Query:</div>
                      <div className="font-mono text-xs text-text-primary">&ldquo;{workspaceContent.query}&rdquo;</div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-white p-3 text-center">
                        <div className="font-mono text-lg font-bold text-text-primary">{workspaceContent.latencyMs}ms</div>
                        <div className="text-[10px] text-text-dim">Latency</div>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center">
                        <div className="font-mono text-lg font-bold text-text-primary">{workspaceContent.resultCount}</div>
                        <div className="text-[10px] text-text-dim">Results</div>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center">
                        <div className="font-mono text-lg font-bold text-text-primary">
                          {workspaceContent.relevance != null ? `${workspaceContent.relevance.toFixed(1)}/5` : '...'}
                        </div>
                        <div className="text-[10px] text-text-dim">Relevance</div>
                      </div>
                    </div>

                    {workspaceContent.relevance != null && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[10px] text-text-dim">Relevance:</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-muted">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                            style={{ width: `${(workspaceContent.relevance / 5) * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-text-primary">
                          {workspaceContent.relevance.toFixed(1)}/5
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border-default bg-[#F8FAFC]">
                    <div className="text-center">
                      <div className="mb-2 text-2xl">🤖</div>
                      <div className="text-sm text-text-dim">Agent is initializing...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Workspace message */}
              <div className="mt-4 rounded-lg bg-[#F8FAFC] px-3 py-2">
                <span className="font-mono text-[11px] text-text-secondary">
                  {workspaceMessage}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom bar — progress */}
          <div className="border-t border-border-default bg-[#F8FAFC] px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-muted">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-mono text-xs text-text-dim">
                {progress}% · 0:{elapsed.toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Results Phase (Split View) ── */

  function renderResults() {
    if (!completionData) return null;
    const { userSummary, optimalSummary, delta, optimalTools, session_id } = completionData;
    const scenarioLabel = scenarios.find(s => s.value === scenario)?.label ?? scenario;

    return (
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-6 text-center text-xl font-bold text-text-primary">
          Arena Results — {scenarioLabel}
        </h2>

        {/* Split comparison */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          {/* Your Stack */}
          <div className="rounded-2xl border border-border-default bg-white p-6">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Your Stack
            </div>
            <div className="mb-4 text-sm font-semibold text-text-primary">
              {selectedTools.join(' + ')}
            </div>
            <div className="space-y-3">
              <Stat label="Avg Latency" value={`${userSummary.avgLatency}ms`} />
              <Stat label="Avg Quality" value={`${userSummary.avgRelevance.toFixed(1)}/5`} bar={userSummary.avgRelevance / 5} />
              <Stat label="Avg Cost" value={`$${userSummary.avgCost.toFixed(4)}/query`} />
              <Stat label="Success" value={`${userSummary.successRate}%`} />
            </div>
          </div>

          {/* Optimal Stack */}
          <div className="rounded-2xl border-2 border-green-200 bg-green-50/50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                AgentPick Optimal
              </span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 font-mono text-[9px] font-bold text-green-700">
                RECOMMENDED
              </span>
            </div>
            <div className="mb-4 text-sm font-semibold text-text-primary">
              {optimalTools.map(t => t.name).join(' + ')}
            </div>
            <div className="space-y-3">
              <Stat label="Avg Latency" value={`${optimalSummary.avgLatency}ms`} highlight />
              <Stat label="Avg Quality" value={`${optimalSummary.avgRelevance.toFixed(1)}/5`} bar={optimalSummary.avgRelevance / 5} highlight />
              <Stat label="Avg Cost" value={`$${optimalSummary.avgCost.toFixed(4)}/query`} highlight />
              <Stat label="Success" value={`${optimalSummary.successRate}%`} highlight />
            </div>

            {/* Delta badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {delta.latencyDelta !== '—' && (
                <span className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold ${
                  (delta.latencyPct ?? 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
                }`}>
                  {delta.latencyDelta}
                </span>
              )}
              {delta.qualityDelta !== '—' && (
                <span className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold ${
                  (delta.qualityPct ?? 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
                }`}>
                  {delta.qualityDelta}
                </span>
              )}
              {delta.costDelta !== '—' && (
                <span className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold ${
                  (delta.costPct ?? 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
                }`}>
                  {delta.costDelta}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Monthly projection */}
        <div className="mb-8 rounded-xl border border-border-default bg-white p-5 text-center">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Monthly projection at 1,000 queries/day
          </div>
          <div className="flex items-center justify-center gap-8">
            <div>
              <div className="font-mono text-lg font-bold text-text-primary">
                ${Math.round(userSummary.avgCost * 1000 * 30)}/mo
              </div>
              <div className="text-xs text-text-dim">Your stack</div>
            </div>
            <span className="text-text-dim">→</span>
            <div>
              <div className="font-mono text-lg font-bold text-green-600">
                ${Math.round(optimalSummary.avgCost * 1000 * 30)}/mo
              </div>
              <div className="text-xs text-text-dim">Optimal stack</div>
            </div>
          </div>
        </div>

        {/* Per-query breakdown */}
        <div className="mb-8">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Per-Query Results</h3>
          {queries.filter(q => q.trim()).map((query, qi) => {
            const uResults = userResults.filter(r => r.queryIndex === qi);
            const oResults = optimalResults.filter(r => r.queryIndex === qi);
            return (
              <div key={qi} className="mb-4 rounded-xl border border-border-default bg-white p-4">
                <div className="mb-3 font-mono text-xs text-text-secondary">
                  Query {qi + 1}: &ldquo;{query}&rdquo;
                </div>
                <div className="overflow-hidden rounded-lg border border-border-default">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-bg-muted">
                        <th className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-text-dim">Stack</th>
                        <th className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-text-dim">Tool</th>
                        <th className="px-3 py-1.5 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Latency</th>
                        <th className="px-3 py-1.5 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Results</th>
                        <th className="px-3 py-1.5 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Relevance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {uResults.map((r, i) => (
                        <tr key={`u-${i}`}>
                          <td className="px-3 py-1.5 text-xs text-text-dim">Yours</td>
                          <td className="px-3 py-1.5 text-xs font-medium text-text-primary">{r.toolName}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-xs text-text-secondary">{r.latencyMs}ms</td>
                          <td className="px-3 py-1.5 text-right font-mono text-xs text-text-secondary">{r.resultCount}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-xs font-semibold text-text-primary">
                            {r.relevance != null ? `${r.relevance.toFixed(1)}/5` : '—'}
                          </td>
                        </tr>
                      ))}
                      {oResults.map((r, i) => (
                        <tr key={`o-${i}`} className="bg-green-50/30">
                          <td className="px-3 py-1.5 text-xs text-green-600">Optimal</td>
                          <td className="px-3 py-1.5 text-xs font-medium text-text-primary">{r.toolName}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-xs text-text-secondary">{r.latencyMs}ms</td>
                          <td className="px-3 py-1.5 text-right font-mono text-xs text-text-secondary">{r.resultCount}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-xs font-semibold text-green-700">
                            {r.relevance != null ? `${r.relevance.toFixed(1)}/5` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Personal evaluation notice */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-700">
          This data is for your personal evaluation and does not affect public rankings.
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/arena/${session_id}`}
            className="rounded-lg border border-border-default px-4 py-2 text-xs font-medium text-text-secondary hover:border-border-hover hover:text-text-primary"
          >
            Share Results
          </Link>
          <button
            onClick={() => { setPhase('input'); setCompletionData(null); }}
            className="rounded-lg bg-[#0C0F1A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E293B]"
          >
            Run Another Test
          </button>
          <Link
            href="/sdk"
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
          >
            Install SDK for continuous monitoring
          </Link>
        </div>
      </div>
    );
  }
}

/* ── Stat helper ── */

function Stat({
  label,
  value,
  bar,
  highlight,
}: {
  label: string;
  value: string;
  bar?: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-dim">{label}</span>
        <span className={`font-mono text-sm font-bold ${highlight ? 'text-green-700' : 'text-text-primary'}`}>
          {value}
        </span>
      </div>
      {bar != null && (
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-700 ${highlight ? 'bg-green-500' : 'bg-indigo-500'}`}
            style={{ width: `${Math.min(100, bar * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
