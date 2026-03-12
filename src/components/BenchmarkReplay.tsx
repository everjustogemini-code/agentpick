'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AgentWorkspace } from '@/components/workspace';
import ApiCallCard from '@/components/workspace/cards/ApiCallCard';
import ResponseCard from '@/components/workspace/cards/ResponseCard';
import EvaluationCard from '@/components/workspace/cards/EvaluationCard';
import ScoreCard from '@/components/workspace/cards/ScoreCard';
import type { WorkspaceStep, StepStatus } from '@/types/workspace';

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

interface ReplayScene {
  timestamp: number;
  taskStatuses?: StepStatus[];
  workspaceView?: WorkspaceView;
  workspaceContent?: Record<string, unknown>;
}

interface TaskStep {
  label: string;
  detail?: string;
}

function buildScenes(run: ReplayData): { scenes: ReplayScene[]; tasks: TaskStep[] } {
  const tasks: TaskStep[] = [
    { label: 'Agent initialized', detail: `${run.agentName} \u00B7 ${run.domain} \u00B7 ${run.complexity}` },
    { label: 'Query loaded', detail: `"${run.query}"` },
    { label: 'API called', detail: `${run.tool} /search` },
    { label: 'Evaluating relevance' },
    { label: 'Scoring & recording vote' },
  ];

  const scenes: ReplayScene[] = [
    { timestamp: 0, taskStatuses: ['active', 'pending', 'pending', 'pending', 'pending'], workspaceView: 'empty' },
    { timestamp: 600, taskStatuses: ['complete', 'active', 'pending', 'pending', 'pending'] },
    {
      timestamp: 1200,
      taskStatuses: ['complete', 'complete', 'active', 'pending', 'pending'],
      workspaceView: 'api_call',
      workspaceContent: {
        method: 'POST',
        url: `api.${run.tool}.com/search`,
        body: { query: run.query, search_depth: run.config?.depth || 'basic', max_results: run.config?.maxResults || 10 },
      },
    },
    {
      timestamp: 1200 + run.latencyMs,
      taskStatuses: ['complete', 'complete', 'complete', 'active', 'pending'],
      workspaceView: 'response',
      workspaceContent: {
        latencyMs: run.latencyMs, statusCode: run.statusCode,
        resultCount: run.resultCount, results: run.results, success: run.success,
      },
    },
    {
      timestamp: 2500 + run.latencyMs,
      workspaceView: 'evaluation',
      workspaceContent: { evaluator: run.evaluatedBy, reasoning: run.evaluationReason },
    },
    {
      timestamp: 5000 + run.latencyMs,
      taskStatuses: ['complete', 'complete', 'complete', 'complete', 'active'],
      workspaceView: 'scores',
      workspaceContent: {
        relevance: run.relevanceScore, freshness: run.freshnessScore,
        completeness: run.completenessScore, latencyMs: run.latencyMs, costUsd: run.costUsd,
      },
    },
    { timestamp: 6500 + run.latencyMs, taskStatuses: ['complete', 'complete', 'complete', 'complete', 'complete'] },
  ];

  return { scenes, tasks };
}

function getStateAtTime(scenes: ReplayScene[], time: number) {
  let taskStatuses: StepStatus[] = ['pending', 'pending', 'pending', 'pending', 'pending'];
  let workspaceView: WorkspaceView = 'empty';
  let workspaceContent: Record<string, unknown> = {};

  for (const scene of scenes) {
    if (scene.timestamp > time) break;
    if (scene.taskStatuses) taskStatuses = scene.taskStatuses;
    if (scene.workspaceView) workspaceView = scene.workspaceView;
    if (scene.workspaceContent) workspaceContent = scene.workspaceContent;
  }

  return { taskStatuses, workspaceView, workspaceContent };
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

  function handleSeek(fraction: number) {
    const newTime = fraction * totalDuration;
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

  const elapsedSec = Math.floor(currentTime / 1000);
  const totalSec = Math.floor(totalDuration / 1000);
  const elapsedStr = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`;
  const totalStr = `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`;

  // Typewriter effect for evaluation text
  const [typedChars, setTypedChars] = useState(0);
  useEffect(() => {
    if (state.workspaceView === 'evaluation' && state.workspaceContent?.reasoning) {
      const reasoning = state.workspaceContent.reasoning as string;
      const evalScene = scenes.find((s) => s.workspaceView === 'evaluation');
      if (evalScene) {
        const elapsedSinceEval = currentTime - evalScene.timestamp;
        const charsPerSecond = 40 * speed;
        const chars = Math.min(reasoning.length, Math.floor((elapsedSinceEval / 1000) * charsPerSecond));
        setTypedChars(chars);
      }
    }
  }, [currentTime, state.workspaceView, state.workspaceContent, scenes, speed]);

  // Map task statuses to WorkspaceStep format
  const workspaceSteps: WorkspaceStep[] = tasks.map((task, i) => ({
    label: task.label,
    status: state.taskStatuses[i],
    detail: task.detail,
    subItems:
      i === 2 && state.taskStatuses[i] === 'complete'
        ? [{ text: `${data.latencyMs}ms \u00B7 ${data.statusCode} ${data.success ? 'OK' : 'ERR'}` }]
        : undefined,
  }));

  const currentStepIndex = state.taskStatuses.findIndex((s) => s === 'active');

  // Build workspace content based on current view
  let wsContent: React.ReactNode;

  if (state.workspaceView === 'api_call') {
    wsContent = (
      <ApiCallCard
        method={(state.workspaceContent.method as string) || 'POST'}
        url={state.workspaceContent.url as string}
        body={state.workspaceContent.body as Record<string, unknown>}
        waiting
      />
    );
  } else if (state.workspaceView === 'response') {
    wsContent = (
      <ResponseCard
        latencyMs={state.workspaceContent.latencyMs as number}
        statusCode={state.workspaceContent.statusCode as number}
        success={state.workspaceContent.success as boolean}
        resultCount={state.workspaceContent.resultCount as number}
        results={state.workspaceContent.results as { title: string; url: string }[]}
      />
    );
  } else if (state.workspaceView === 'evaluation') {
    wsContent = (
      <EvaluationCard
        evaluator={state.workspaceContent.evaluator as string | null}
        reasoning={(state.workspaceContent.reasoning as string) || ''}
        typedChars={typedChars}
      />
    );
  } else if (state.workspaceView === 'scores') {
    wsContent = (
      <ScoreCard
        scores={[
          { label: 'Relevance', value: state.workspaceContent.relevance as number | null, max: 5 },
          { label: 'Freshness', value: state.workspaceContent.freshness as number | null, max: 5 },
          { label: 'Completeness', value: state.workspaceContent.completeness as number | null, max: 5 },
        ]}
        animate
        latencyMs={state.workspaceContent.latencyMs as number}
        costUsd={state.workspaceContent.costUsd as number | null}
        voteSignal={data.relevanceScore != null ? (data.relevanceScore >= 3.0 ? 'up' : 'down') : null}
      />
    );
  } else {
    wsContent = (
      <div className="flex h-[340px] items-center justify-center text-[13px] text-text-dim">
        Agent initializing...
      </div>
    );
  }

  return (
    <AgentWorkspace
      steps={workspaceSteps}
      currentStepIndex={currentStepIndex}
      workspaceContent={wsContent}
      progress={progress}
      elapsed={elapsedStr}
      total={totalStr}
      controls="replay"
      speed={speed}
      playing={playing}
      onSpeedChange={setSpeed}
      onSeek={handleSeek}
      onPlayPause={togglePlay}
      title="AgentPick Replay"
      subtitle={`${data.agentName} testing ${data.tool} \u00B7 ${data.domain} \u00B7 ${data.complexity}`}
    />
  );
}
