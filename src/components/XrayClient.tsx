'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AgentWorkspace } from '@/components/workspace';
import type { WorkspaceStep } from '@/types/workspace';

interface DetectedTool {
  name: string;
  slug: string | null;
  category: string | null;
  rank: number | null;
  score: number | null;
  successRate: number | null;
  avgLatencyMs: number | null;
}

interface Issue {
  severity: 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  impact: string;
}

interface Recommendation {
  from: string;
  to: string | null;
  toSlug: string | null;
  improvement: string;
}

interface XrayResult {
  report_id: string;
  url: string;
  health_score: number;
  detected_tools: DetectedTool[];
  framework: string | null;
  inferred_domain: string | null;
  issues: Issue[];
  recommendations: Recommendation[];
}

type Phase = 'input' | 'analyzing' | 'results';
type AnalysisStep = 'parsing' | 'detecting' | 'checking' | 'gaps' | 'savings' | 'report' | 'done';

const ANALYSIS_STEPS: { key: AnalysisStep; label: string }[] = [
  { key: 'parsing', label: 'Parsing code' },
  { key: 'detecting', label: 'Detecting tools' },
  { key: 'checking', label: 'Checking rankings' },
  { key: 'gaps', label: 'Finding gaps' },
  { key: 'savings', label: 'Calculating savings' },
  { key: 'report', label: 'Generating report' },
];

export default function XrayClient() {
  const [phase, setPhase] = useState<Phase>('input');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<XrayResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisDetail, setAnalysisDetail] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Simulate analysis progress while waiting for API
  useEffect(() => {
    if (phase !== 'analyzing') return;

    let step = 0;
    timerRef.current = setInterval(() => {
      step++;
      if (step <= ANALYSIS_STEPS.length) {
        setCurrentStep(step);
        setAnalysisDetail(ANALYSIS_STEPS[Math.min(step - 1, ANALYSIS_STEPS.length - 1)].label + '...');
      }
    }, 400);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  async function handleAnalyze() {
    if (!code.trim()) return;
    setError(null);
    setPhase('analyzing');
    setCurrentStep(0);

    try {
      const resp = await fetch('/api/v1/xray/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, format: detectFormat(code) }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || 'Analysis failed');
        setPhase('input');
        return;
      }

      // Complete all steps
      setCurrentStep(ANALYSIS_STEPS.length + 1);
      if (timerRef.current) clearInterval(timerRef.current);

      setTimeout(() => {
        setResult(data);
        setPhase('results');
      }, 500);
    } catch {
      setError('Network error. Please try again.');
      setPhase('input');
    }
  }

  function detectFormat(input: string): string {
    if (/^import |^from |def |class /m.test(input)) return 'python';
    if (/^\{[\s\S]*\}$/m.test(input.trim())) return 'json';
    if (/^[a-z_]+:\s/m.test(input)) return 'yaml';
    return 'text';
  }

  // --- INPUT PHASE ---
  if (phase === 'input') {
    return (
      <div className="mx-auto max-w-[680px]">
        <div className="mb-8 text-center">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[2px] text-text-dim">
            Agent X-Ray
          </div>
          <h1 className="mb-3 text-[36px] font-[750] leading-tight tracking-[-1.2px] text-text-primary">
            Your agent can diagnose itself
          </h1>
          <p className="text-base text-text-muted">
            Agents use X-Ray via <code className="rounded bg-bg-muted px-1.5 py-0.5 font-mono text-xs">GET /api/v1/xray/self</code> — or paste your config to preview what it would find.
          </p>
        </div>

        <div className="rounded-xl border border-border-default bg-white p-5 shadow-sm">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`from langchain.tools import (
    TavilySearchResults,
    WikipediaQueryRun
)

tools = [
    TavilySearchResults(k=5),
    WikipediaQueryRun()
]`}
            className="h-[240px] w-full resize-none rounded-lg border border-border-default bg-[#F8FAFC] p-4 font-mono text-[13px] text-text-primary placeholder:text-text-dim focus:border-button-primary-bg focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-text-dim">
              Accepts: Python, JSON config, YAML, requirements.txt, or tool names
            </span>
            <button
              onClick={handleAnalyze}
              disabled={!code.trim()}
              className="rounded-lg bg-button-primary-bg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              Analyze
            </button>
          </div>
          {error && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- ANALYZING PHASE (Manus-style) ---
  if (phase === 'analyzing') {
    const workspaceSteps: WorkspaceStep[] = ANALYSIS_STEPS.map((step, i) => ({
      label: step.label,
      status: (i < currentStep ? 'complete' : i === currentStep ? 'active' : 'pending') as WorkspaceStep['status'],
    }));

    const wsContent = (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-2 border-button-primary-bg border-t-transparent" />
          <div className="text-[13px] text-text-secondary">{analysisDetail}</div>
        </div>
      </div>
    );

    const progressPct = Math.round((currentStep / ANALYSIS_STEPS.length) * 100);

    return (
      <div className="mx-auto max-w-[880px]">
        <AgentWorkspace
          steps={workspaceSteps}
          currentStepIndex={currentStep}
          workspaceContent={wsContent}
          progress={progressPct}
          controls="arena"
          title="Agent X-Ray"
          subtitle="Analyzing your agent stack..."
        />
      </div>
    );
  }

  // --- RESULTS PHASE ---
  if (!result) return null;

  const scoreColor = result.health_score >= 7 ? '#22C55E' : result.health_score >= 4 ? '#F59E0B' : '#EF4444';

  return (
    <div className="mx-auto max-w-[880px]">
      <div className="overflow-hidden rounded-2xl border border-border-default bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-border-default bg-bg-page px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-button-primary-bg text-[10px] font-bold text-white">
                  &#x2B21;
                </div>
                <span className="text-[13px] font-bold text-text-primary">X-Ray Report</span>
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-text-dim">
                {result.detected_tools.length} tools detected &middot; {result.framework ?? 'No framework'} &middot; {result.inferred_domain}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[28px] font-bold leading-none" style={{ color: scoreColor }}>
                {result.health_score.toFixed(1)}
              </div>
              <div className="font-mono text-[10px] text-text-dim">/ 10 health</div>
            </div>
          </div>
        </div>

        {/* Split view */}
        <div className="flex min-h-[400px]">
          {/* Left: Detected tools */}
          <div className="w-[280px] shrink-0 border-r border-border-default bg-bg-page p-4">
            <div className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-[1.5px] text-text-dim">
              Detected Tools
            </div>
            <div className="space-y-3">
              {result.detected_tools.map((tool, i) => (
                <div key={i} className="rounded-lg bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-green-600">&#x2713;</span>
                    <span className="text-[13px] font-semibold text-text-primary">{tool.name}</span>
                  </div>
                  {tool.category && (
                    <div className="mt-1 font-mono text-[10px] text-text-dim">
                      {tool.category.replace('_', ' ')}
                    </div>
                  )}
                  {tool.rank !== null && (
                    <div className="mt-0.5 font-mono text-[10px] text-text-dim">
                      Rank: #{tool.rank} &middot; Score: {tool.score?.toFixed(1)}/10
                    </div>
                  )}
                  {tool.rank === null && tool.slug === null && (
                    <div className="mt-0.5 font-mono text-[10px] text-text-dim">
                      Not ranked (not API-first)
                    </div>
                  )}
                </div>
              ))}
            </div>

            {result.framework && (
              <div className="mt-4 rounded-lg bg-white p-3 shadow-sm">
                <div className="font-mono text-[10px] text-text-dim">Framework</div>
                <div className="text-[13px] font-medium text-text-primary">{result.framework}</div>
                <div className="font-mono text-[10px] text-text-dim">(not scored)</div>
              </div>
            )}
          </div>

          {/* Right: Issues & Recommendations */}
          <div className="flex-1 bg-[#F8FAFC] p-5">
            {/* Issues */}
            {result.issues.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-[1.5px] text-text-dim">
                  Issues
                </div>
                <div className="space-y-2">
                  {result.issues.map((issue, i) => (
                    <div key={i} className="rounded-lg border border-border-default bg-white p-3 shadow-sm">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 text-[13px]">
                          {issue.severity === 'high' ? '\u{1F534}' : issue.severity === 'medium' ? '\u26A0\uFE0F' : '\u{1F4A1}'}
                        </span>
                        <div>
                          <div className="text-[13px] font-medium text-text-primary">{issue.title}</div>
                          <div className="mt-0.5 text-[12px] text-text-secondary">{issue.description}</div>
                          <div className="mt-1 font-mono text-[10px] text-text-dim">Impact: {issue.impact}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-[1.5px] text-text-dim">
                  Recommendations
                </div>
                <div className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border-default bg-white p-3 shadow-sm">
                      <span className="font-mono text-[13px] font-bold text-text-dim">{i + 1}.</span>
                      <div className="flex-1">
                        <div className="text-[13px] text-text-primary">
                          <span className="text-text-dim">{rec.from}</span>
                          {rec.to && (
                            <>
                              <span className="mx-1.5 text-text-dim">&rarr;</span>
                              {rec.toSlug ? (
                                <Link href={`/products/${rec.toSlug}`} className="font-semibold text-button-primary-bg hover:underline">
                                  {rec.to}
                                </Link>
                              ) : (
                                <span className="font-semibold">{rec.to}</span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-green-600">{rec.improvement}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.issues.length === 0 && result.recommendations.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-2 text-[24px]">&#x2705;</div>
                  <div className="text-[15px] font-semibold text-text-primary">Your stack looks solid!</div>
                  <div className="mt-1 text-[13px] text-text-muted">No major issues detected.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-center gap-3 border-t border-border-default bg-bg-page px-5 py-4">
          <Link
            href={`/arena?tools=${result.detected_tools.filter(t => t.slug).map(t => t.slug).join(',')}&scenario=${result.inferred_domain}`}
            className="rounded-lg bg-button-primary-bg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Verify in Arena
          </Link>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin + result.url);
            }}
            className="rounded-lg border border-border-default bg-white px-5 py-2.5 text-sm font-semibold text-text-primary hover:border-border-hover"
          >
            Share Report
          </button>
          <button
            onClick={() => {
              setPhase('input');
              setResult(null);
              setCode('');
            }}
            className="rounded-lg border border-border-default bg-white px-5 py-2.5 text-sm font-semibold text-text-primary hover:border-border-hover"
          >
            New Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
