'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { AgentWorkspace } from '@/components/workspace';
import type { WorkspaceStep } from '@/types/workspace';

interface RecommendResult {
  recommended: string;
  name: string;
  score: number;
  reason: string;
  alternatives: { slug: string; name: string; score: number; reason: string }[];
}

type Phase = 'idle' | 'running' | 'done';

const EXAMPLE_QUERIES = [
  'search latest Fed decision',
  'scrape SEC filings for NVDA',
  'parse court documents',
  'monitor crypto prices',
  'research competitor APIs',
];

const CAPABILITY_KEYWORDS: Record<string, string> = {
  search: 'search', find: 'search', lookup: 'search', query: 'search',
  research: 'research', analyze: 'research', study: 'research', investigate: 'research',
  scrape: 'crawl', crawl: 'crawl', extract: 'crawl', parse: 'crawl',
  monitor: 'search', track: 'search', watch: 'search',
  code: 'code', build: 'code', develop: 'code', compute: 'compute',
};

function inferCapability(query: string): string {
  const words = query.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (CAPABILITY_KEYWORDS[word]) return CAPABILITY_KEYWORDS[word];
  }
  return 'search'; // default
}

export default function HomepageWorkspace() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [steps, setSteps] = useState<WorkspaceStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [wsContent, setWsContent] = useState<React.ReactNode>(null);

  const handleRun = useCallback(async () => {
    if (!query.trim()) return;
    setPhase('running');
    setResult(null);
    setProgress(0);

    const initialSteps: WorkspaceStep[] = [
      { label: 'Parsing query', status: 'active' },
      { label: 'Detecting scenario', status: 'pending' },
      { label: 'Querying agent voting data', status: 'pending' },
      { label: 'Fetching benchmark results', status: 'pending' },
      { label: 'Computing optimal stack', status: 'pending' },
      { label: 'Generating recommendation', status: 'pending' },
    ];
    setSteps(initialSteps);
    setStatusMsg('Analyzing your query...');
    setWsContent(
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">&#x1F50D;</div>
          <div className="text-[13px] text-text-secondary">Analyzing: &ldquo;{query}&rdquo;</div>
        </div>
      </div>,
    );

    // Simulate step progression while fetching
    const capability = inferCapability(query);

    // Step 1: Parse query
    await wait(400);
    updateSteps(0, 'complete', 1, 'active');
    setProgress(15);
    setStatusMsg(`Detected capability: ${capability}`);

    // Step 2: Detect scenario
    await wait(500);
    updateSteps(1, 'complete', 2, 'active');
    setProgress(30);
    setStatusMsg('Querying agent voting data...');

    try {
      // Step 3: Fetch recommendation data
      const res = await fetch(`/api/v1/recommend?capability=${encodeURIComponent(capability)}`);
      const data: RecommendResult = await res.json();

      updateSteps(2, 'complete', 3, 'active');
      setProgress(55);
      setStatusMsg(`Found top tool: ${data.name}`);

      // Step 4: Show voting results
      await wait(600);
      updateSteps(3, 'complete', 4, 'active');
      setProgress(75);

      const allTools = [
        { name: data.name, score: data.score },
        ...data.alternatives.slice(0, 3).map((a) => ({ name: a.name, score: a.score })),
      ];
      const maxScore = Math.max(...allTools.map((t) => t.score));

      setWsContent(
        <div className="animate-[slideUpCard_0.3s_ease-out] space-y-4">
          <div className="rounded-xl border border-border-default bg-white p-5 shadow-sm">
            <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">
              How agents voted for &ldquo;{capability}&rdquo;
            </div>
            <div className="mt-3 space-y-2.5">
              {allTools.map((tool, i) => (
                <div key={tool.name} className="flex items-center gap-3">
                  <span className="w-24 truncate text-[13px] font-medium text-text-primary">{tool.name}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-md bg-[#F1F5F9]">
                    <div
                      className="flex h-full items-center rounded-md px-2"
                      style={{
                        width: `${(tool.score / maxScore) * 100}%`,
                        background: i === 0 ? 'linear-gradient(90deg, #0F172A, #334155)' : '#94A3B8',
                        transition: 'width 1.5s ease-out',
                      }}
                    >
                      <span className="font-mono text-[11px] font-semibold text-white">
                        {tool.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
      );
      setStatusMsg('Computing optimal stack...');

      // Step 5: Compute optimal
      await wait(800);
      updateSteps(4, 'complete', 5, 'active');
      setProgress(90);

      // Step 6: Generate recommendation
      await wait(500);
      setSteps((prev) => prev.map((s, i) => ({ ...s, status: (i <= 5 ? 'complete' : s.status) as WorkspaceStep['status'] })));
      setProgress(100);
      setResult(data);
      setStatusMsg('Recommendation ready');

      // Show final recommendation content
      setWsContent(
        <div className="animate-[viewFadeSlide_0.3s_ease-out] space-y-4">
          <div className="rounded-xl border-2 border-green-200 bg-green-50/50 p-5">
            <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-green-700">
              Recommendation
            </div>
            <div className="mb-3 text-[13px] text-text-secondary">
              For &ldquo;{query}&rdquo;:
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px]">&#x1F3C6;</span>
                <span className="text-[13px] font-semibold text-text-primary">Best overall: {data.name}</span>
                <span className="rounded bg-green-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-green-700">
                  {data.score.toFixed(1)}/10
                </span>
              </div>
              {data.alternatives.slice(0, 2).map((alt, i) => (
                <div key={alt.slug} className="flex items-center gap-2 pl-6">
                  <span className="text-[12px]">{i === 0 ? '\u{1F948}' : '\u{1F949}'}</span>
                  <span className="text-[12px] text-text-secondary">{alt.name}</span>
                  <span className="font-mono text-[10px] text-text-dim">{alt.reason}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/arena"
              className="rounded-lg bg-button-primary-bg px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              &#x2694;&#xFE0F; Run Arena with your stack
            </Link>
            <Link
              href="/xray"
              className="rounded-lg border border-border-default bg-white px-4 py-2 text-xs font-semibold text-text-primary hover:border-border-hover"
            >
              &#x1F50D; X-Ray your agent code
            </Link>
            <Link
              href={`/products/${data.recommended}`}
              className="rounded-lg border border-border-default bg-white px-4 py-2 text-xs font-semibold text-text-primary hover:border-border-hover"
            >
              &#x1F4CA; Compare tools in detail
            </Link>
          </div>
        </div>,
      );

      setPhase('done');
    } catch {
      setStatusMsg('Failed to fetch recommendations. Try again.');
      setPhase('idle');
    }
  }, [query]);

  function updateSteps(completeIdx: number, completeStatus: 'complete', activeIdx: number, activeStatus: 'active') {
    setSteps((prev) =>
      prev.map((s, i) => ({
        ...s,
        status: i === completeIdx ? completeStatus : i === activeIdx ? activeStatus : s.status,
      })),
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.status === 'active');

  return (
    <div>
      {/* Query input */}
      <div className="mb-8 rounded-xl border border-border-default bg-white p-6 shadow-sm">
        <div className="mb-3 text-[15px] font-semibold text-text-primary">
          What does your agent need to do?
        </div>
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            placeholder="research NVDA earnings 2025"
            className="flex-1 rounded-lg border border-border-default bg-bg-page px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:border-indigo-400 focus:outline-none"
          />
          <button
            onClick={handleRun}
            disabled={phase === 'running' || !query.trim()}
            className="rounded-lg bg-button-primary-bg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            {phase === 'running' ? 'Running...' : 'Run'}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-[11px] text-text-dim">Try:</span>
          {EXAMPLE_QUERIES.map((eq) => (
            <button
              key={eq}
              onClick={() => setQuery(eq)}
              className="text-[11px] text-text-muted hover:text-text-primary hover:underline"
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      {/* Workspace (shown after Run) */}
      {(phase === 'running' || phase === 'done') && (
        <div className="mb-8 animate-[slideUpCard_0.3s_ease-out]">
          <AgentWorkspace
            steps={steps}
            currentStepIndex={currentStepIndex}
            workspaceContent={wsContent}
            progress={progress}
            controls="arena"
            title="AgentPick"
            subtitle="Finding the best tools for your query"
            statusMessage={statusMsg}
          />
        </div>
      )}
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
