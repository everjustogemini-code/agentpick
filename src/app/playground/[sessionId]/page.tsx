import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 60;

interface Props {
  params: Promise<{ sessionId: string }>;
}

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  const session = await prisma.playgroundSession.findUnique({
    where: { id: sessionId },
    select: { domain: true, tools: true, results: true },
  });
  if (!session) return { title: 'Playground — AgentPick' };

  const domainLabel = session.domain.charAt(0).toUpperCase() + session.domain.slice(1);
  const title = `${domainLabel} Benchmark — ${session.tools.length} tools tested — AgentPick Playground`;
  const desc = `Playground benchmark results for ${domainLabel}. ${session.tools.length} tools compared on AgentPick.`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: [{ url: `/api/og?type=playground&session=${sessionId}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      images: [`/api/og?type=playground&session=${sessionId}`],
    },
  };
}

export default async function PlaygroundResultPage({ params }: Props) {
  const { sessionId } = await params;

  const session = await prisma.playgroundSession.findUnique({
    where: { id: sessionId },
    include: {
      runs: {
        include: {
          product: { select: { name: true, slug: true } },
        },
        orderBy: [{ queryIndex: 'asc' }, { latencyMs: 'asc' }],
      },
    },
  });

  if (!session) notFound();

  const domainLabel = session.domain.charAt(0).toUpperCase() + session.domain.slice(1);

  // Group runs by query
  const queriesMap = new Map<number, typeof session.runs>();
  for (const run of session.runs) {
    const group = queriesMap.get(run.queryIndex) ?? [];
    group.push(run);
    queriesMap.set(run.queryIndex, group);
  }

  // Compute tool summaries
  const toolMap = new Map<string, {
    name: string;
    slug: string;
    totalLatency: number;
    totalRelevance: number;
    relevanceCount: number;
    successCount: number;
    totalCost: number;
    tests: number;
  }>();

  for (const run of session.runs) {
    const key = run.product.slug;
    const existing = toolMap.get(key) ?? {
      name: run.product.name,
      slug: run.product.slug,
      totalLatency: 0,
      totalRelevance: 0,
      relevanceCount: 0,
      successCount: 0,
      totalCost: 0,
      tests: 0,
    };
    existing.totalLatency += run.latencyMs;
    if (run.relevanceScore != null) {
      existing.totalRelevance += run.relevanceScore;
      existing.relevanceCount++;
    }
    if (run.success) existing.successCount++;
    existing.totalCost += run.costUsd ?? 0;
    existing.tests++;
    toolMap.set(key, existing);
  }

  const config = session.config as { volume?: number } | null;
  const volume = config?.volume ?? 1000;

  const rankings = [...toolMap.values()]
    .map((t) => ({
      ...t,
      avgLatency: Math.round(t.totalLatency / t.tests),
      avgRelevance: t.relevanceCount > 0 ? t.totalRelevance / t.relevanceCount : 0,
      successRate: (t.successCount / t.tests) * 100,
      monthlyCost: (t.totalCost / t.tests) * volume * 30,
    }))
    .sort((a, b) => b.avgRelevance - a.avgRelevance);

  const medals = ['1st', '2nd', '3rd'];

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
          <Link
            href="/playground"
            className="rounded-full border border-border-default px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-text-dim hover:border-border-hover"
          >
            Playground
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          Your Test Results — {domainLabel}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {session.tools.length} tools tested · {session.queries.length} queries · {session.runs.length} total tests
        </p>

        {session.status === 'running' && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Benchmark is still running. Refresh to see updated results.
          </div>
        )}

        {/* Per-query results */}
        <div className="mt-8 space-y-6">
          {[...queriesMap.entries()].map(([qi, runs]) => (
            <div key={qi} className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
              <h2 className="mb-3 text-sm font-[650] text-text-primary">
                Query {qi + 1}: &ldquo;{session.queries[qi]}&rdquo;
              </h2>
              <div className="overflow-hidden rounded-lg border border-border-default">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-bg-muted">
                      <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">Tool</th>
                      <th className="px-4 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Latency</th>
                      <th className="px-4 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Results</th>
                      <th className="px-4 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Relevance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {runs
                      .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
                      .map((run) => (
                        <tr key={run.id}>
                          <td className="px-4 py-2.5">
                            <Link href={`/products/${run.product.slug}`} className="text-sm font-medium text-text-primary hover:underline">
                              {run.product.name}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-text-secondary">
                            {run.latencyMs}ms
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-text-secondary">
                            {run.resultCount ?? '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {run.relevanceScore != null ? (
                              <span className="font-mono text-xs font-semibold text-text-primary">
                                {run.relevanceScore.toFixed(1)}/5
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-text-dim">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <h2 className="mb-4 text-sm font-[650] uppercase tracking-wider text-text-dim">
            Summary for {domainLabel}
          </h2>

          <div className="space-y-3">
            {rankings.map((tool, i) => (
              <div key={tool.slug} className="flex items-center gap-4">
                <span className="w-8 text-center font-mono text-sm font-bold text-text-dim">
                  {medals[i] ?? `${i + 1}th`}
                </span>
                <div className="flex-1">
                  <Link href={`/products/${tool.slug}`} className="text-sm font-semibold text-text-primary hover:underline">
                    {tool.name}
                  </Link>
                  <span className="ml-2 text-xs text-text-muted">
                    {tool.avgRelevance.toFixed(1)}/5 relevance · {tool.avgLatency}ms · ${(tool.totalCost / tool.tests).toFixed(4)}/call
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly cost estimate */}
          <div className="mt-5 border-t border-border-default pt-4">
            <div className="mb-2 font-mono text-[10px] text-text-dim">
              Monthly cost estimate at {fmt(volume)} calls/day:
            </div>
            <div className="flex flex-wrap gap-4">
              {rankings.map((tool) => (
                <span key={tool.slug} className="font-mono text-xs text-text-secondary">
                  {tool.name}: ${tool.monthlyCost < 1 ? tool.monthlyCost.toFixed(2) : Math.round(tool.monthlyCost)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/playground"
            className="rounded-lg bg-button-primary-bg px-4 py-2 text-xs font-semibold text-white"
          >
            Run Another Test
          </Link>
        </div>
      </main>

      <footer className="border-t border-border-default py-6">
        <p className="text-center font-mono text-xs text-text-dim">
          agentpick.dev — ranked by machines, built for builders
        </p>
      </footer>
    </div>
  );
}
