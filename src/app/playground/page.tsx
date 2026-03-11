'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const SCENARIOS = [
  { value: 'finance', label: 'Financial Research Agent' },
  { value: 'legal', label: 'Legal Research' },
  { value: 'healthcare', label: 'Healthcare Assistant' },
  { value: 'ecommerce', label: 'E-commerce Agent' },
  { value: 'devtools', label: 'Code Assistant' },
  { value: 'education', label: 'Education' },
  { value: 'news', label: 'News & Media' },
  { value: 'science', label: 'Science Research' },
  { value: 'general', label: 'General Purpose' },
];

const TOOLS = [
  { slug: 'tavily', name: 'Tavily', cost: '$0.001/call' },
  { slug: 'exa-search', name: 'Exa', cost: '$0.002/call' },
  { slug: 'serper-api', name: 'Serper', cost: '$0.0005/call' },
  { slug: 'brave-search', name: 'Brave Search', cost: 'Free tier' },
  { slug: 'jina-reader', name: 'Jina Reader', cost: 'Free tier' },
  { slug: 'firecrawl-api', name: 'Firecrawl', cost: '$0.003/call' },
];

const VOLUMES = [
  { value: 100, label: '~100 calls/day' },
  { value: 1000, label: '~1,000 calls/day' },
  { value: 10000, label: '~10,000 calls/day' },
  { value: 100000, label: '~100,000 calls/day' },
];

function PlaygroundInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const preselectedTools = searchParams.get('tools')?.split(',') ?? [];

  const [domain, setDomain] = useState('general');
  const [queries, setQueries] = useState(['', '', '']);
  const [selectedTools, setSelectedTools] = useState<string[]>(
    preselectedTools.length > 0 ? preselectedTools : ['tavily', 'exa-search', 'serper-api'],
  );
  const [priorities, setPriorities] = useState<string[]>(['relevance', 'freshness']);
  const [volume, setVolume] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nonEmptyQueries = queries.filter((q) => q.trim().length > 0);

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

  const addQuery = () => {
    if (queries.length < 5) setQueries([...queries, '']);
  };

  const updateQuery = (idx: number, value: string) => {
    const updated = [...queries];
    updated[idx] = value;
    setQueries(updated);
  };

  const runBenchmark = async () => {
    if (nonEmptyQueries.length === 0) {
      setError('Please enter at least one query.');
      return;
    }
    if (selectedTools.length === 0) {
      setError('Please select at least one tool.');
      return;
    }

    setIsRunning(true);
    setError(null);

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
        setIsRunning(false);
        return;
      }

      router.push(`/playground/${data.session_id}`);
    } catch {
      setError('Failed to connect. Please try again.');
      setIsRunning(false);
    }
  };

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

      <main className="mx-auto max-w-[640px] px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          Test API Tools
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Compare search and crawling tools with your own queries. Results are scored by AI and contribute to rankings.
        </p>

        {/* Step 1: Scenario */}
        <div className="mt-8">
          <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
            1. What are you building?
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm text-text-primary focus:border-button-primary-bg focus:outline-none"
          >
            {SCENARIOS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Step 2: Queries */}
        <div className="mt-8">
          <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
            2. Your typical queries (3-5 for best results)
          </label>
          <div className="space-y-2">
            {queries.map((q, i) => (
              <input
                key={i}
                type="text"
                value={q}
                onChange={(e) => updateQuery(i, e.target.value)}
                placeholder={`Query ${i + 1}...`}
                className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-sm text-text-primary placeholder-text-dim focus:border-button-primary-bg focus:outline-none"
              />
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
            {VOLUMES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Step 3: Tools */}
        <div className="mt-8">
          <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
            3. Compare these tools
          </label>
          <div className="space-y-2">
            {TOOLS.map((tool) => (
              <button
                key={tool.slug}
                onClick={() => toggleTool(tool.slug)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                  selectedTools.includes(tool.slug)
                    ? 'border-button-primary-bg bg-button-primary-bg/5'
                    : 'border-border-default bg-white hover:border-border-hover'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                      selectedTools.includes(tool.slug)
                        ? 'border-button-primary-bg bg-button-primary-bg text-white'
                        : 'border-border-default text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                  <span className="text-sm font-medium text-text-primary">{tool.name}</span>
                </div>
                <span className="font-mono text-[11px] text-text-dim">{tool.cost}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Run button */}
        <button
          onClick={runBenchmark}
          disabled={isRunning || nonEmptyQueries.length === 0 || selectedTools.length === 0}
          className="mt-8 w-full rounded-xl bg-button-primary-bg py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {isRunning ? 'Running benchmark...' : 'Run Benchmark →'}
        </button>

        <p className="mt-3 text-center font-mono text-[10px] text-text-dim">
          2 free sessions per day · Results are public and contribute to rankings
        </p>
      </main>

      <footer className="border-t border-border-default py-6">
        <p className="text-center font-mono text-xs text-text-dim">
          agentpick.dev — ranked by machines, built for builders
        </p>
      </footer>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense>
      <PlaygroundInner />
    </Suspense>
  );
}
