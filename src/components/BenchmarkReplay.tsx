'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ReplayResult {
  title: string;
  url: string;
}

export interface ReplayData {
  id: string;
  agentName: string;
  domain: string;
  complexity: string;
  tool: string;
  query: string;
  config: { depth?: string; maxResults?: number };
  latencyMs: number;
  statusCode: number;
  resultCount: number;
  results: ReplayResult[];
  relevanceScore: number | null;
  freshnessScore: number | null;
  completenessScore: number | null;
  evaluatedBy: string | null;
  evaluationReason: string | null;
  costUsd: number | null;
  success: boolean;
}

// --- Scene system for Manus-style replay ---

type WorkspaceView = 'empty' | 'api_call' | 'response' | 'evaluation' | 'scores';
type TaskStatus = 'pending' | 'active' | 'complete';

interface ReplayScene {
  timestamp: number;
  taskStatuses?: TaskStatus[];
  workspaceView?: WorkspaceView;
  workspaceContent?: Record<string, unknown>;
  animation?: 'slide_in' | 'typewriter' | 'progress_bar';
}

interface TaskStep {
  label: string;
  detail?: string;
}

function buildScenes(run: ReplayData): { scenes: ReplayScene[]; tasks: TaskStep[] } {
  const tasks: TaskStep[] = [
    { label: 'Agent initialized', detail: `${run.agentName} · ${run.domain} · ${run.complexity}` },
    { label: 'Query loaded', detail: `"${run.query}"` },
    { label: 'API called', detail: `${run.tool} /search` },
    { label: 'Evaluating relevance' },
    { label: 'Scoring & recording vote' },
  ];

  const scenes: ReplayScene[] = [
    // Agent init
    {
      timestamp: 0,
      taskStatuses: ['active', 'pending', 'pending', 'pending', 'pending'],
      workspaceView: 'empty',
    },
    {
      timestamp: 600,
      taskStatuses: ['complete', 'active', 'pending', 'pending', 'pending'],
    },
    // Query loaded
    {
      timestamp: 1200,
      taskStatuses: ['complete', 'complete', 'active', 'pending', 'pending'],
      workspaceView: 'api_call',
      workspaceContent: {
        method: 'POST',
        url: `api.${run.tool}.com/search`,
        body: {
          query: run.query,
          search_depth: run.config?.depth || 'basic',
          max_results: run.config?.maxResults || 10,
        },
      },
      animation: 'slide_in',
    },
    // Response arrives
    {
      timestamp: 1200 + run.latencyMs,
      taskStatuses: ['complete', 'complete', 'complete', 'active', 'pending'],
      workspaceView: 'response',
      workspaceContent: {
        latencyMs: run.latencyMs,
        statusCode: run.statusCode,
        resultCount: run.resultCount,
        results: run.results,
        success: run.success,
      },
      animation: 'slide_in',
    },
    // Evaluation
    {
      timestamp: 2500 + run.latencyMs,
      workspaceView: 'evaluation',
      workspaceContent: {
        evaluator: run.evaluatedBy,
        reasoning: run.evaluationReason,
      },
      animation: 'typewriter',
    },
    // Scores
    {
      timestamp: 5000 + run.latencyMs,
      taskStatuses: ['complete', 'complete', 'complete', 'complete', 'active'],
      workspaceView: 'scores',
      workspaceContent: {
        relevance: run.relevanceScore,
        freshness: run.freshnessScore,
        completeness: run.completenessScore,
        latencyMs: run.latencyMs,
        costUsd: run.costUsd,
      },
      animation: 'progress_bar',
    },
    // Done
    {
      timestamp: 6500 + run.latencyMs,
      taskStatuses: ['complete', 'complete', 'complete', 'complete', 'complete'],
    },
  ];

  return { scenes, tasks };
}

function getStateAtTime(scenes: ReplayScene[], time: number) {
  let taskStatuses: TaskStatus[] = ['pending', 'pending', 'pending', 'pending', 'pending'];
  let workspaceView: WorkspaceView = 'empty';
  let workspaceContent: Record<string, unknown> = {};
  let animation: string | undefined;

  for (const scene of scenes) {
    if (scene.timestamp > time) break;
    if (scene.taskStatuses) taskStatuses = scene.taskStatuses;
    if (scene.workspaceView) workspaceView = scene.workspaceView;
    if (scene.workspaceContent) workspaceContent = scene.workspaceContent;
    if (scene.animation) animation = scene.animation;
  }

  return { taskStatuses, workspaceView, workspaceContent, animation };
}

// --- Score bar component ---
function ScoreBar({ label, value, animate }: { label: string; value: number | null; animate?: boolean }) {
  if (value == null) return null;
  const pct = (value / 5) * 100;
  const color = value >= 4 ? '#22C55E' : value >= 3 ? '#F59E0B' : '#EF4444';

  return (
    <div className="mb-2.5">
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="font-medium text-text-secondary">{label}</span>
        <span className="font-mono font-semibold" style={{ color }}>{value.toFixed(1)}/5</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full"
          style={{
            width: animate ? `${pct}%` : '0%',
            backgroundColor: color,
            transition: animate ? 'width 1s ease-out' : 'none',
          }}
        />
      </div>
    </div>
  );
}

// --- Task step icon ---
function TaskIcon({ status }: { status: TaskStatus }) {
  if (status === 'complete') return <span className="text-[14px]">&#x2705;</span>;
  if (status === 'active') return <span className="inline-block h-3.5 w-3.5 animate-pulse rounded-full bg-amber-400" />;
  return <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-gray-300" />;
}

// --- Main component ---
export default function BenchmarkReplay({ data }: { data: ReplayData }) {
  const { scenes, tasks } = buildScenes(data);
  const totalDuration = scenes[scenes.length - 1].timestamp + 1000;

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);
  const offsetRef = useRef(0);

  const tick = useCallback(() => {
    const elapsed = (performance.now() - startRef.current) * speed;
    const t = offsetRef.current + elapsed;
    if (t >= totalDuration) {
      setCurrentTime(totalDuration);
      setPlaying(false);
      return;
    }
    setCurrentTime(t);
    rafRef.current = requestAnimationFrame(tick);
  }, [speed, totalDuration]);

  useEffect(() => {
    if (playing) {
      startRef.current = performance.now();
      offsetRef.current = currentTime;
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, tick]);

  const state = getStateAtTime(scenes, currentTime);
  const progress = Math.min(100, (currentTime / totalDuration) * 100);

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const newTime = pct * totalDuration;
    setCurrentTime(newTime);
    offsetRef.current = newTime;
    startRef.current = performance.now();
  }

  function togglePlay() {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      offsetRef.current = 0;
      startRef.current = performance.now();
    }
    setPlaying(!playing);
  }

  const elapsed = Math.floor(currentTime / 1000);
  const total = Math.floor(totalDuration / 1000);
  const elapsedStr = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  const totalStr = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;

  // Typewriter effect for evaluation text
  const [typedChars, setTypedChars] = useState(0);
  useEffect(() => {
    if (state.workspaceView === 'evaluation' && state.workspaceContent?.reasoning) {
      const reasoning = state.workspaceContent.reasoning as string;
      // Find the scene that starts evaluation
      const evalScene = scenes.find(s => s.workspaceView === 'evaluation');
      if (evalScene) {
        const elapsedSinceEval = currentTime - evalScene.timestamp;
        const charsPerSecond = 40 * speed;
        const chars = Math.min(reasoning.length, Math.floor((elapsedSinceEval / 1000) * charsPerSecond));
        setTypedChars(chars);
      }
    }
  }, [currentTime, state.workspaceView, state.workspaceContent, scenes, speed]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border-default bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default bg-bg-page px-5 py-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-button-primary-bg text-[10px] font-bold text-white">
              &#x2B21;
            </div>
            <span className="text-[13px] font-bold text-text-primary">AgentPick Replay</span>
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-text-dim">
            {data.agentName} testing {data.tool} &middot; {data.domain} &middot; {data.complexity}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded px-2 py-0.5 font-mono text-[10px] font-medium transition-colors ${
                speed === s
                  ? 'bg-button-primary-bg text-white'
                  : 'bg-bg-muted text-text-dim hover:bg-gray-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Split workspace */}
      <div className="flex min-h-[420px]">
        {/* Left: Task Progress */}
        <div className="w-[260px] shrink-0 border-r border-border-default bg-bg-page p-4">
          <div className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-[1.5px] text-text-dim">
            Task Progress
          </div>
          <div className="space-y-3">
            {tasks.map((task, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  <TaskIcon status={state.taskStatuses[i]} />
                </div>
                <div className="min-w-0">
                  <div className={`text-[13px] font-medium ${
                    state.taskStatuses[i] === 'complete' ? 'text-text-primary' :
                    state.taskStatuses[i] === 'active' ? 'text-text-primary' :
                    'text-text-dim'
                  }`}>
                    {task.label}
                  </div>
                  {task.detail && state.taskStatuses[i] !== 'pending' && (
                    <div className="mt-0.5 truncate font-mono text-[11px] text-text-dim">
                      {task.detail}
                    </div>
                  )}
                  {/* Show latency inline for API call step */}
                  {i === 2 && state.taskStatuses[i] === 'complete' && (
                    <div className="mt-0.5 font-mono text-[11px] text-text-dim">
                      {data.latencyMs}ms &middot; {data.statusCode} {data.success ? 'OK' : 'ERR'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Agent Workspace */}
        <div className="flex-1 bg-[#F8FAFC] p-5">
          <div className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[1.5px] text-text-dim">
            Agent Workspace
          </div>

          {state.workspaceView === 'empty' && (
            <div className="flex h-[340px] items-center justify-center text-[13px] text-text-dim">
              Agent initializing...
            </div>
          )}

          {state.workspaceView === 'api_call' && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-lg border border-border-default bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-700">
                    {(state.workspaceContent.method as string) || 'POST'}
                  </span>
                  <span className="font-mono text-[12px] text-text-secondary">
                    {state.workspaceContent.url as string}
                  </span>
                </div>
                <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">
                  Request Body
                </div>
                <pre className="overflow-x-auto rounded-md bg-[#F1F5F9] p-3 font-mono text-[12px] leading-relaxed text-text-secondary">
                  {JSON.stringify(state.workspaceContent.body, null, 2)}
                </pre>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                  <span className="text-[12px] text-text-dim">Waiting for response...</span>
                </div>
              </div>
            </div>
          )}

          {state.workspaceView === 'response' && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-lg border border-border-default bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <span className="font-mono text-[12px] text-text-secondary">
                    Response: {state.workspaceContent.latencyMs as number}ms
                  </span>
                  <span className={`rounded px-2 py-0.5 font-mono text-[11px] font-semibold ${
                    state.workspaceContent.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {state.workspaceContent.statusCode as number} {state.workspaceContent.success ? 'OK' : 'ERR'}
                  </span>
                </div>

                <div className="rounded-md border border-border-default bg-[#F8FAFC] p-3">
                  <div className="mb-2 font-mono text-[11px] font-semibold text-text-secondary">
                    {state.workspaceContent.resultCount as number} results
                  </div>
                  <div className="space-y-2">
                    {((state.workspaceContent.results as ReplayResult[]) || []).slice(0, 5).map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 font-mono text-[11px] text-text-dim">{i + 1}.</span>
                        <div className="min-w-0">
                          <div className="truncate text-[12px] font-medium text-text-primary">{r.title}</div>
                          <div className="truncate font-mono text-[10px] text-blue-500">{r.url}</div>
                        </div>
                      </div>
                    ))}
                    {(state.workspaceContent.resultCount as number) > 5 && (
                      <div className="font-mono text-[11px] text-text-dim">
                        +{(state.workspaceContent.resultCount as number) - 5} more results
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.workspaceView === 'evaluation' && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-lg border border-border-default bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[14px]">&#x1F916;</span>
                  <span className="text-[12px] font-semibold text-text-primary">
                    Agent is evaluating result quality
                  </span>
                </div>
                {Boolean(state.workspaceContent.evaluator) && (
                  <div className="mb-2 font-mono text-[11px] text-text-dim">
                    Judge: {String(state.workspaceContent.evaluator)}
                  </div>
                )}
                {Boolean(state.workspaceContent.reasoning) && (
                  <div className="rounded-md bg-[#F8FAFC] p-3 text-[13px] leading-relaxed text-text-secondary">
                    {(state.workspaceContent.reasoning as string).slice(0, typedChars)}
                    {typedChars < (state.workspaceContent.reasoning as string).length && (
                      <span className="inline-block h-4 w-0.5 animate-pulse bg-text-primary" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {state.workspaceView === 'scores' && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-lg border border-border-default bg-white p-4 shadow-sm">
                <div className="mb-4 text-[12px] font-semibold text-text-primary">Benchmark Scores</div>
                <ScoreBar label="Relevance" value={state.workspaceContent.relevance as number | null} animate />
                <ScoreBar label="Freshness" value={state.workspaceContent.freshness as number | null} animate />
                <ScoreBar label="Completeness" value={state.workspaceContent.completeness as number | null} animate />

                <div className="mt-4 flex items-center gap-4 rounded-md bg-[#F8FAFC] p-3 font-mono text-[12px] text-text-secondary">
                  <span>Latency: {state.workspaceContent.latencyMs as number}ms</span>
                  {(state.workspaceContent.costUsd as number | null) != null && (
                    <span>Cost: ${(state.workspaceContent.costUsd as number).toFixed(4)}</span>
                  )}
                </div>

                {data.relevanceScore != null && (
                  <div className="mt-3 flex items-center gap-2 text-[13px]">
                    <span className={data.relevanceScore >= 3.0 ? 'text-green-600' : 'text-red-500'}>
                      {data.relevanceScore >= 3.0 ? '&#x25B2;' : '&#x25BC;'}
                    </span>
                    <span className="font-medium text-text-primary">
                      Vote registered: {data.relevanceScore >= 3.0 ? 'Upvote' : 'Downvote'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls bar */}
      <div className="border-t border-border-default bg-bg-page px-5 py-3">
        {/* Timeline scrubber */}
        <div
          className="mb-3 h-1.5 cursor-pointer rounded-full bg-gray-200"
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full bg-button-primary-bg transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-button-primary-bg text-white hover:opacity-90"
            >
              {playing ? '&#x23F8;' : '&#x25B6;'}
            </button>
            <span className="font-mono text-[11px] text-text-dim">
              {elapsedStr} / {totalStr}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`rounded px-2 py-0.5 font-mono text-[10px] font-medium transition-colors ${
                  speed === s
                    ? 'bg-button-primary-bg text-white'
                    : 'bg-bg-muted text-text-dim hover:bg-gray-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
