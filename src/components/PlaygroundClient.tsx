'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/* ── Types ─────────────────────────────────────────── */

interface Scenario {
  value: string;
  label: string;
  emoji: string;
}

interface Tool {
  slug: string;
  name: string;
  costPerCall: string;
}

interface RunResult {
  tool: string;
  toolName: string;
  query: string;
  queryIndex: number;
  latencyMs: number;
  resultCount: number;
  relevance: number | null;
  success: boolean;
}

interface Ranking {
  slug: string;
  name: string;
  avgLatency: number;
  avgRelevance: number;
  successRate: number;
  totalCost: number;
  monthlyCost: number;
  tests: number;
}

interface PlaygroundClientProps {
  scenarios: Scenario[];
  prefilledQueries: Record<string, string[]>;
  availableTools: Tool[];
}

type Phase = 'scenario' | 'config' | 'running' | 'results';

/* ── Component ─────────────────────────────────────── */

export default function PlaygroundClient({
  scenarios,
  prefilledQueries,
  availableTools,
}: PlaygroundClientProps) {
  const searchParams = useSearchParams();
  const preselectedTools = searchParams.get('tools')?.split(',') ?? [];
  const preselectedDomain = searchParams.get('domain') ?? '';

  const [phase, setPhase] = useState<Phase>(preselectedDomain ? 'config' : 'scenario');
  const [domain, setDomain] = useState(preselectedDomain || '');
  const [queries, setQueries] = useState<string[]>(['', '', '']);
  const [selectedTools, setSelectedTools] = useState<string[]>(
    preselectedTools.length > 0
      ? preselectedTools
      : availableTools.slice(0, 3).map((t) => t.slug),
  );
  const [priorities, setPriorities] = useState<string[]>(['relevance', 'freshness']);
  const [volume, setVolume] = useState(1000);
  const [error, setError] = useState<string | null>(null);

  // Running state
  const [streamedRuns, setStreamedRuns] = useState<RunResult[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [completedCalls, setCompletedCalls] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Results state
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const runningRef = useRef(false);

  // Pre-fill queries when domain is selected
  useEffect(() => {
    if (domain && prefilledQueries[domain]?.length) {
      const prefilled = prefilledQueries[domain].slice(0, 3);
      while (prefilled.length < 3) prefilled.push('');
      setQueries(prefilled);
    }
  }, [domain, prefilledQueries]);

  // If pre-selected domain, go straight to config
  useEffect(() => {
    if (preselectedDomain && !domain) {
      setDomain(preselectedDomain);
      setPhase('config');
    }
  }, [preselectedDomain, domain]);

  const selectScenario = useCallback(
    (value: string) => {
      setDomain(value);
      // Pre-fill queries from DB data
      const prefilled = prefilledQueries[value]?.slice(0, 3) ?? [];
      while (prefilled.length < 3) prefilled.push('');
      setQueries(prefilled);
      setPhase('config');
    },
    [prefilledQueries],
  );

  const toggleTool = (slug: string) => {
    setSelectedTools((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const togglePriority = (p: string) => {
    setPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const updateQuery = (idx: number, value: string) => {
    const updated = [...queries];
    updated[idx] = value;
    setQueries(updated);
  };

  const addQuery = () => {
    if (queries.length < 5) setQueries([...queries, '']);
  };

  const removeQuery = (idx: number) => {
    if (queries.length > 1) {
      setQueries(queries.filter((_, i) => i !== idx));
    }
  };

  const nonEmptyQueries = queries.filter((q) => q.trim().length > 0);

  /* ── Run benchmark with streaming ─────────────── */

  const runBenchmark = async () => {
    if (nonEmptyQueries.length === 0) {
      setError('Please enter at least one query.');
      return;
    }
    if (selectedTools.length === 0) {
      setError('Please select at least one tool.');
      return;
    }
    if (selectedTools.length > 4) {
      setError('Maximum 4 tools per session.');
      return;
    }

    setError(null);
    setPhase('running');
    setStreamedRuns([]);
    setCompletedCalls(0);
    setTotalCalls(nonEmptyQueries.length * selectedTools.length);
    runningRef.current = true;

    try {
      const res = await fetch('/api/v1/playground/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          priorities,
          queries: nonEmptyQueries,
          tools: selectedTools,
          volume,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
        setPhase('config');
        return;
      }

      // Simulate streaming by revealing runs one by one
      const allRuns: RunResult[] = data.runs ?? [];
      setSessionId(data.session_id);
      setRankings(data.rankings ?? []);

      for (let i = 0; i < allRuns.length; i++) {
        if (!runningRef.current) break;
        await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
        setStreamedRuns((prev) => [...prev, allRuns[i]]);
        setCompletedCalls(i + 1);
      }

      setPhase('results');
    } catch {
      setError('Failed to connect. Please try again.');
      setPhase('config');
    }
  };

  const domainLabel = domain
    ? domain.charAt(0).toUpperCase() + domain.slice(1)
    : '';

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-default bg-bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[840px] items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-button-primary-bg font-mono text-sm font-bold text-white">
              ⬡
            </div>
            <span className="text-[17px] font-bold tracking-tight text-text-primary">
              agentpick
            </span>
          </Link>
          <span className="rounded-full border border-border-default px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Playground
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-6 py-10">
        {/* ── Phase 1: Scenario Selection ───────────── */}
        {phase === 'scenario' && (
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
              What are you building?
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Pick a scenario — we&apos;ll pre-fill queries and recommend the best tools.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {scenarios.map((s) => (
                <button
                  key={s.value}
                  onClick={() => selectScenario(s.value)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-border-default bg-white px-4 py-5 transition-all hover:border-button-primary-bg hover:shadow-md"
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-center text-[13px] font-medium text-text-primary group-hover:text-button-primary-bg">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-6 text-center font-mono text-[10px] text-text-dim">
              Results are public and contribute to rankings · backed by verified API calls
            </p>
          </div>
        )}

        {/* ── Phase 2: Config ───────────────────────── */}
        {phase === 'config' && (
          <div>
            <button
              onClick={() => setPhase('scenario')}
              className="mb-4 text-xs text-text-muted hover:text-text-primary"
            >
              ← Change scenario
            </button>

            <h1 className="text-[24px] font-bold tracking-[-0.5px] text-text-primary">
              {scenarios.find((s) => s.value === domain)?.emoji}{' '}
              {domainLabel} Agent
            </h1>

            {/* Queries */}
            <div className="mt-6">
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
                Test queries (we pre-filled 3 — edit or add your own)
              </label>
              <div className="space-y-2">
                {queries.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => updateQuery(i, e.target.value)}
                      placeholder={`Query ${i + 1}...`}
                      className="flex-1 rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm text-text-primary placeholder-text-dim focus:border-button-primary-bg focus:outline-none"
                    />
                    {queries.length > 1 && (
                      <button
                        onClick={() => removeQuery(i)}
                        className="rounded-lg border border-border-default px-2.5 text-text-dim hover:border-red-300 hover:text-red-500"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {queries.length < 5 && (
                <button
                  onClick={addQuery}
                  className="mt-2 text-xs font-medium text-text-muted hover:text-text-primary"
                >
                  + Add another query
                </button>
              )}
            </div>

            {/* Priorities */}
            <div className="mt-6">
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
                What matters most?
              </label>
              <div className="flex flex-wrap gap-2">
                {['relevance', 'freshness', 'speed', 'low cost'].map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePriority(p)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      priorities.includes(p)
                        ? 'border-button-primary-bg bg-button-primary-bg/5 text-button-primary-bg'
                        : 'border-border-default text-text-muted hover:border-border-hover'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div className="mt-6">
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
                Tools to compare (max 4)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTools.map((tool) => (
                  <button
                    key={tool.slug}
                    onClick={() => toggleTool(tool.slug)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      selectedTools.includes(tool.slug)
                        ? 'border-button-primary-bg bg-button-primary-bg/5 text-button-primary-bg'
                        : 'border-border-default text-text-muted hover:border-border-hover'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                        selectedTools.includes(tool.slug)
                          ? 'border-button-primary-bg bg-button-primary-bg text-white'
                          : 'border-border-default text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    {tool.name}
                    <span className="font-mono text-[10px] text-text-dim">
                      {tool.costPerCall}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div className="mt-6">
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
                Expected volume
              </label>
              <select
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm text-text-primary focus:border-button-primary-bg focus:outline-none"
              >
                <option value={100}>~100 calls/day</option>
                <option value={1000}>~1,000 calls/day</option>
                <option value={10000}>~10,000 calls/day</option>
                <option value={100000}>~100,000 calls/day</option>
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Run */}
            <button
              onClick={runBenchmark}
              disabled={nonEmptyQueries.length === 0 || selectedTools.length === 0}
              className="mt-8 w-full rounded-xl bg-button-primary-bg py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              ▶ Run Benchmark — ~{nonEmptyQueries.length * selectedTools.length * 5}s
            </button>

            <p className="mt-3 text-center font-mono text-[10px] text-text-dim">
              2 free sessions per day · Results are public and contribute to rankings
            </p>
          </div>
        )}

        {/* ── Phase 3: Running (streaming results) ── */}
        {phase === 'running' && (
          <div>
            <div className="mb-6">
              <h1 className="text-[20px] font-bold tracking-[-0.5px] text-text-primary">
                Running: {domainLabel} · {nonEmptyQueries.length} queries × {selectedTools.length} tools
              </h1>

              {/* Progress bar */}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                <div
                  className="h-full rounded-full bg-button-primary-bg transition-all duration-500"
                  style={{
                    width: `${totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="mt-1 text-right font-mono text-[11px] text-text-dim">
                {completedCalls}/{totalCalls} calls completed
              </div>
            </div>

            {/* Streaming results grouped by query */}
            <div className="space-y-4">
              {nonEmptyQueries.map((query, qi) => {
                const queryRuns = streamedRuns.filter(
                  (r) => r.queryIndex === qi,
                );
                const pendingTools = selectedTools.filter(
                  (slug) => !queryRuns.some((r) => r.tool === slug),
                );

                return (
                  <div
                    key={qi}
                    className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                  >
                    <h3 className="mb-3 text-[13px] font-[650] text-text-primary">
                      Query {qi + 1}: &ldquo;{query}&rdquo;
                    </h3>
                    <div className="space-y-2">
                      {/* Completed runs */}
                      {queryRuns.map((run, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded-lg bg-bg-muted px-3 py-2 animate-in fade-in slide-in-from-bottom-1 duration-300"
                        >
                          <span className="text-sm">
                            {run.success ? '✅' : '❌'}
                          </span>
                          <span className="min-w-[80px] text-sm font-medium text-text-primary">
                            {run.toolName}
                          </span>
                          <span className="font-mono text-[11px] text-text-secondary">
                            {run.latencyMs}ms
                          </span>
                          <span className="font-mono text-[11px] text-text-secondary">
                            {run.resultCount} results
                          </span>
                          {run.relevance != null && (
                            <div className="ml-auto flex items-center gap-1.5">
                              <RelevanceBar value={run.relevance} />
                              <span className="font-mono text-[11px] font-semibold text-text-primary">
                                {run.relevance.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Pending tools */}
                      {pendingTools.map((slug) => {
                        const tool = availableTools.find(
                          (t) => t.slug === slug,
                        );
                        const isNext =
                          pendingTools[0] === slug && queryRuns.length > 0;
                        return (
                          <div
                            key={slug}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-dim"
                          >
                            <span className="text-sm">
                              {isNext ? (
                                <span className="animate-pulse">⏳</span>
                              ) : (
                                '⏳'
                              )}
                            </span>
                            <span className="min-w-[80px] text-sm font-medium">
                              {tool?.name ?? slug}
                            </span>
                            <span className="font-mono text-[11px]">
                              {isNext ? 'calling...' : 'pending'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Phase 4: Results ──────────────────────── */}
        {phase === 'results' && (
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.5px] text-text-primary">
              Results: {domainLabel} · {nonEmptyQueries.length} queries × {selectedTools.length} tools
            </h1>

            {/* Recommendation */}
            {rankings.length > 0 && (
              <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
                <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  Recommendation
                </h2>
                <div className="space-y-3">
                  {rankings.slice(0, 3).map((tool, i) => (
                    <div key={tool.slug} className="flex items-start gap-3">
                      <span className="text-lg">{medals[i]}</span>
                      <div>
                        <Link
                          href={`/products/${tool.slug}`}
                          className="text-sm font-semibold text-text-primary hover:underline"
                        >
                          {tool.name}
                        </Link>
                        {i === 0 && (
                          <span className="ml-2 text-[11px] text-button-primary-bg">
                            Best for your scenario
                          </span>
                        )}
                        <div className="mt-0.5 font-mono text-[11px] text-text-muted">
                          Relevance: {tool.avgRelevance.toFixed(1)}/5 · Latency: {tool.avgLatency}ms ·{' '}
                          ${(tool.totalCost / tool.tests).toFixed(4)}/call ·{' '}
                          ~${tool.monthlyCost < 1 ? tool.monthlyCost.toFixed(2) : Math.round(tool.monthlyCost)}/mo at {volume.toLocaleString()} calls/day
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full results per query */}
            <div className="mt-6 space-y-4">
              {nonEmptyQueries.map((query, qi) => {
                const queryRuns = streamedRuns
                  .filter((r) => r.queryIndex === qi)
                  .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));

                return (
                  <div
                    key={qi}
                    className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                  >
                    <h3 className="mb-3 text-[13px] font-[650] text-text-primary">
                      Query {qi + 1}: &ldquo;{query}&rdquo;
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-border-default">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-bg-muted">
                            <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                              Tool
                            </th>
                            <th className="px-4 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                              Latency
                            </th>
                            <th className="px-4 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                              Results
                            </th>
                            <th className="px-4 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                              Relevance
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                          {queryRuns.map((run, i) => (
                            <tr key={i}>
                              <td className="px-4 py-2.5">
                                <span className="text-sm font-medium text-text-primary">
                                  {run.success ? '✅ ' : '❌ '}
                                  {run.toolName}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-xs text-text-secondary">
                                {run.latencyMs}ms
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-xs text-text-secondary">
                                {run.resultCount}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                {run.relevance != null ? (
                                  <span className="font-mono text-xs font-semibold text-text-primary">
                                    {run.relevance.toFixed(1)}/5
                                  </span>
                                ) : (
                                  <span className="font-mono text-xs text-text-dim">
                                    —
                                  </span>
                                )}
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

            {/* Contribution message */}
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center text-sm text-green-700">
              This test contributed to AgentPick rankings. Your sandbox data is now part of the score.
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {sessionId && (
                <Link
                  href={`/playground/${sessionId}`}
                  className="rounded-lg border border-border-default px-4 py-2 text-xs font-medium text-text-secondary hover:border-border-hover hover:text-text-primary"
                >
                  📋 View Full Report
                </Link>
              )}
              <button
                onClick={() => {
                  setPhase('config');
                  setStreamedRuns([]);
                  setRankings([]);
                  setSessionId(null);
                }}
                className="rounded-lg bg-button-primary-bg px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                🔄 Run Again
              </button>
              {sessionId && (
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/playground/${sessionId}`;
                    navigator.clipboard.writeText(url);
                  }}
                  className="rounded-lg border border-border-default px-4 py-2 text-xs font-medium text-text-secondary hover:border-border-hover hover:text-text-primary"
                >
                  📣 Share Results
                </button>
              )}
            </div>

            {/* SDK CTA */}
            <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-[#0F172A] p-6 text-center">
              <h3 className="text-sm font-semibold text-white">
                Want continuous monitoring?
              </h3>
              <div className="mt-3 inline-block rounded-lg bg-[#1E293B] px-4 py-2 font-mono text-sm text-[#34D399]">
                pip install agentpick
              </div>
              <p className="mt-3 text-xs text-[#94A3B8]">
                Get auto-fallback + cost alerts + this dashboard for every API call your agent makes.
              </p>
              <Link
                href="/sdk"
                className="mt-3 inline-block text-xs font-medium text-indigo-400 hover:text-indigo-300"
              >
                Learn more about the SDK →
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border-default py-6">
        <p className="text-center font-mono text-xs text-text-dim">
          agentpick.dev — ranked by machines, built for builders
        </p>
      </footer>
    </div>
  );
}

/* ── Helper Components ─────────────────────────────── */

function RelevanceBar({ value }: { value: number }) {
  const width = (value / 5) * 100;
  return (
    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E2E8F0]">
      <div
        className="h-full rounded-full bg-button-primary-bg transition-all duration-700"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
