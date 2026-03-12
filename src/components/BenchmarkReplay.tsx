'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ReplayStep {
  timestamp: number;
  type: 'text' | 'response' | 'evaluation' | 'score';
  content: string;
  style: 'command' | 'output' | 'success' | 'info' | 'error';
}

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

function buildSteps(run: ReplayData): ReplayStep[] {
  const steps: ReplayStep[] = [
    { timestamp: 0, type: 'text', content: '$ agent: Preparing search query...', style: 'command' },
    { timestamp: 400, type: 'text', content: `$ agent: Domain context loaded [${run.domain}/${run.complexity}]`, style: 'info' },
    { timestamp: 1000, type: 'text', content: `$ query: "${run.query}"`, style: 'command' },
    { timestamp: 1800, type: 'text', content: `$ calling ${run.tool}.search({`, style: 'command' },
    { timestamp: 2000, type: 'text', content: `    query: "${run.query}",`, style: 'command' },
    { timestamp: 2200, type: 'text', content: `    search_depth: "${run.config?.depth || 'basic'}",`, style: 'command' },
    { timestamp: 2400, type: 'text', content: `    max_results: ${run.config?.maxResults || 10}`, style: 'command' },
    { timestamp: 2600, type: 'text', content: '  })', style: 'command' },
  ];

  const responseT = 2600 + run.latencyMs;
  const statusStyle = run.success ? 'success' : 'error';

  steps.push({
    timestamp: responseT,
    type: 'response',
    content: `── Response ── ${run.latencyMs}ms ── ${run.statusCode} ${run.success ? 'OK' : 'ERR'} ──`,
    style: statusStyle,
  });

  steps.push({
    timestamp: responseT + 400,
    type: 'text',
    content: `  ${run.resultCount ?? 0} results returned`,
    style: 'output',
  });

  // Top 3 results
  const topResults = run.results.slice(0, 3);
  topResults.forEach((r, i) => {
    steps.push({
      timestamp: responseT + 800 + i * 500,
      type: 'text',
      content: `  ${i + 1}. "${r.title}"`,
      style: 'output',
    });
    steps.push({
      timestamp: responseT + 1000 + i * 500,
      type: 'text',
      content: `     ${r.url}`,
      style: 'info',
    });
  });

  if (run.resultCount && run.resultCount > 3) {
    steps.push({
      timestamp: responseT + 800 + topResults.length * 500,
      type: 'text',
      content: `  ... +${run.resultCount - 3} more results`,
      style: 'info',
    });
  }

  const evalT = responseT + 2500;
  steps.push({ timestamp: evalT, type: 'text', content: '$ evaluating relevance...', style: 'command' });

  if (run.evaluatedBy) {
    steps.push({
      timestamp: evalT + 1000,
      type: 'evaluation',
      content: `$ evaluator (${run.evaluatedBy}):`,
      style: 'command',
    });
  }
  if (run.evaluationReason) {
    steps.push({
      timestamp: evalT + 1400,
      type: 'text',
      content: `  "${run.evaluationReason}"`,
      style: 'output',
    });
  }

  // Scores
  steps.push({ timestamp: evalT + 2500, type: 'score', content: 'scores', style: 'success' });

  const voteSymbol = run.relevanceScore && run.relevanceScore >= 3.0 ? '▲' : '▼';
  steps.push({
    timestamp: evalT + 3500,
    type: 'text',
    content: `$ benchmark complete. Vote registered: ${voteSymbol}`,
    style: 'success',
  });

  return steps;
}

const STYLE_COLORS: Record<string, string> = {
  command: '#E2E8F0',
  output: '#CBD5E1',
  success: '#34D399',
  info: '#64748B',
  error: '#F87171',
};

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  const blocks = Math.round(value);
  const filled = '█'.repeat(blocks);
  const empty = '░'.repeat(5 - blocks);
  return (
    <div className="flex items-center gap-2 font-mono text-[12px]">
      <span className="w-32 text-[#94A3B8]">{label}:</span>
      <span className="text-[#34D399]">{filled}</span>
      <span className="text-[#334155]">{empty}</span>
      <span className="text-[#E2E8F0]">{value.toFixed(1)}/5</span>
    </div>
  );
}

export default function BenchmarkReplay({ data }: { data: ReplayData }) {
  const steps = buildSteps(data);
  const totalDuration = steps[steps.length - 1].timestamp + 1000;

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);
  const offsetRef = useRef(0);
  const terminalRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [currentTime]);

  const visibleSteps = steps.filter((s) => s.timestamp <= currentTime);
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

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0C0F1A] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E293B] px-5 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white">⬡ AgentPick Benchmark Replay</span>
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-[#64748B]">
            {data.agentName} testing {data.tool} · {data.domain} · {data.complexity}
          </div>
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={terminalRef}
        className="h-[380px] overflow-y-auto px-5 py-4 font-mono text-[13px] leading-relaxed"
      >
        {visibleSteps.map((step, i) => {
          if (step.type === 'score') {
            return (
              <div key={i} className="my-3 rounded border border-[#1E293B] bg-[#0F172A] p-3">
                <ScoreBar label="Relevance" value={data.relevanceScore} />
                <ScoreBar label="Freshness" value={data.freshnessScore} />
                <ScoreBar label="Completeness" value={data.completenessScore} />
                <div className="mt-2 flex items-center gap-4 font-mono text-[12px] text-[#94A3B8]">
                  <span>Latency: {data.latencyMs}ms</span>
                  {data.costUsd != null && <span>Cost: ${data.costUsd.toFixed(4)}</span>}
                </div>
              </div>
            );
          }

          if (step.type === 'response') {
            return (
              <div
                key={i}
                className="my-2 rounded border border-[#1E293B] bg-[#0F172A] px-3 py-1.5"
                style={{ color: STYLE_COLORS[step.style] }}
              >
                {step.content}
              </div>
            );
          }

          return (
            <div key={i} style={{ color: STYLE_COLORS[step.style] }}>
              {step.content}
            </div>
          );
        })}
        {playing && (
          <span className="inline-block h-4 w-2 animate-pulse bg-[#E2E8F0]" />
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-[#1E293B] px-5 py-3">
        {/* Timeline */}
        <div
          className="mb-3 h-1.5 cursor-pointer rounded-full bg-[#1E293B]"
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full bg-[#F97316] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E293B] text-white hover:bg-[#334155]"
            >
              {playing ? '⏸' : '▶'}
            </button>
            <span className="font-mono text-[11px] text-[#64748B]">
              {elapsed}s / {total}s
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`rounded px-2 py-0.5 font-mono text-[10px] ${
                  speed === s
                    ? 'bg-[#F97316] text-white'
                    : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155]'
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
