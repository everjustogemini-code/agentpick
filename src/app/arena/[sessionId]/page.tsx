import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ sessionId: string }>;
}

interface ArenaResults {
  userSummary?: { avgLatency: number; avgRelevance: number; avgCost: number; successRate: number; tests: number };
  optimalSummary?: { avgLatency: number; avgRelevance: number; avgCost: number; successRate: number; tests: number };
  delta?: { latencyDelta: string; qualityDelta: string; costDelta: string; latencyPct?: number | null; qualityPct?: number | null; costPct?: number | null };
  optimalTools?: { slug: string; name: string }[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  const session = await prisma.playgroundSession.findUnique({
    where: { id: sessionId },
    select: { domain: true, tools: true, results: true },
  });
  if (!session) return { title: 'Arena — AgentPick' };

  const domainLabel = session.domain.charAt(0).toUpperCase() + session.domain.slice(1);
  const title = `${domainLabel} Arena Results — AgentPick`;
  const desc = `Arena benchmark results for ${domainLabel}. ${session.tools.length} tools compared.`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: [{ url: `/api/og?type=arena&session=${sessionId}`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title },
  };
}

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

export default async function ArenaResultPage({ params }: Props) {
  const { sessionId } = await params;

  const session = await prisma.playgroundSession.findUnique({
    where: { id: sessionId },
    include: {
      runs: {
        include: { product: { select: { name: true, slug: true } } },
        orderBy: [{ queryIndex: 'asc' }, { latencyMs: 'asc' }],
      },
    },
  });

  if (!session) notFound();

  const config = session.config as { type?: string; current_tools?: string[]; optimal_tools?: string[] } | null;
  const isArena = config?.type === 'arena';
  const currentTools = config?.current_tools ?? [];
  const results = session.results as ArenaResults | null;

  const domainLabel = session.domain.charAt(0).toUpperCase() + session.domain.slice(1);
  const userSummary = results?.userSummary;
  const optimalSummary = results?.optimalSummary;
  const delta = results?.delta;
  const optimalTools = results?.optimalTools ?? [];

  return (
    <div className="min-h-screen bg-bg-page">
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
            href="/arena"
            className="rounded-full border border-border-default px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-text-dim hover:border-border-hover"
          >
            Arena
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          {isArena ? 'Arena' : 'Playground'} Results — {domainLabel}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {session.tools.length} tools tested · {session.queries.length} queries · {session.runs.length} total tests
        </p>

        {session.status === 'running' && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Arena is still running. Refresh to see updated results.
          </div>
        )}

        {/* Split comparison for Arena sessions */}
        {isArena && userSummary && optimalSummary && (
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border-default bg-white p-6">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                Your Stack
              </div>
              <div className="mb-3 text-sm font-semibold text-text-primary">
                {currentTools.join(' + ')}
              </div>
              <div className="space-y-2 font-mono text-xs text-text-secondary">
                <div className="flex justify-between"><span>Avg Latency</span><span className="font-bold text-text-primary">{userSummary.avgLatency}ms</span></div>
                <div className="flex justify-between"><span>Avg Quality</span><span className="font-bold text-text-primary">{userSummary.avgRelevance.toFixed(1)}/5</span></div>
                <div className="flex justify-between"><span>Avg Cost</span><span className="font-bold text-text-primary">${userSummary.avgCost.toFixed(4)}/q</span></div>
                <div className="flex justify-between"><span>Success</span><span className="font-bold text-text-primary">{userSummary.successRate}%</span></div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-green-200 bg-green-50/50 p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">Optimal</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 font-mono text-[9px] font-bold text-green-700">RECOMMENDED</span>
              </div>
              <div className="mb-3 text-sm font-semibold text-text-primary">
                {optimalTools.map(t => t.name).join(' + ')}
              </div>
              <div className="space-y-2 font-mono text-xs text-text-secondary">
                <div className="flex justify-between"><span>Avg Latency</span><span className="font-bold text-green-700">{optimalSummary.avgLatency}ms</span></div>
                <div className="flex justify-between"><span>Avg Quality</span><span className="font-bold text-green-700">{optimalSummary.avgRelevance.toFixed(1)}/5</span></div>
                <div className="flex justify-between"><span>Avg Cost</span><span className="font-bold text-green-700">${optimalSummary.avgCost.toFixed(4)}/q</span></div>
                <div className="flex justify-between"><span>Success</span><span className="font-bold text-green-700">{optimalSummary.successRate}%</span></div>
              </div>
              {delta && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {delta.latencyDelta !== '—' && (
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${(delta.latencyPct ?? 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {delta.latencyDelta}
                    </span>
                  )}
                  {delta.qualityDelta !== '—' && (
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${(delta.qualityPct ?? 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {delta.qualityDelta}
                    </span>
                  )}
                  {delta.costDelta !== '—' && (
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${(delta.costPct ?? 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {delta.costDelta}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Per-query results */}
        <div className="mt-8 space-y-4">
          {session.queries.map((query, qi) => {
            const queryRuns = session.runs.filter(r => r.queryIndex === qi);
            return (
              <div key={qi} className="rounded-xl border border-border-default bg-white p-5">
                <h2 className="mb-3 text-sm font-semibold text-text-primary">
                  Query {qi + 1}: &ldquo;{query}&rdquo;
                </h2>
                <div className="overflow-hidden rounded-lg border border-border-default">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-bg-muted">
                        <th className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-text-dim">Tool</th>
                        <th className="px-3 py-1.5 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Latency</th>
                        <th className="px-3 py-1.5 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Results</th>
                        <th className="px-3 py-1.5 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Relevance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {queryRuns
                        .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
                        .map((run) => {
                          const isUserTool = currentTools.includes(run.product.slug);
                          return (
                            <tr key={run.id} className={isUserTool ? '' : 'bg-green-50/30'}>
                              <td className="px-3 py-2">
                                <Link href={`/products/${run.product.slug}`} className="text-xs font-medium text-text-primary hover:underline">
                                  {run.product.name}
                                </Link>
                                {!isUserTool && (
                                  <span className="ml-1.5 rounded bg-green-100 px-1 py-0.5 font-mono text-[8px] font-bold text-green-700">OPT</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-xs text-text-secondary">{run.latencyMs}ms</td>
                              <td className="px-3 py-2 text-right font-mono text-xs text-text-secondary">{run.resultCount ?? '—'}</td>
                              <td className="px-3 py-2 text-right">
                                {run.relevanceScore != null ? (
                                  <span className="font-mono text-xs font-semibold text-text-primary">
                                    {run.relevanceScore.toFixed(1)}/5
                                  </span>
                                ) : (
                                  <span className="font-mono text-xs text-text-dim">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Personal evaluation notice */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-700">
          This data is for your personal evaluation and does not affect public rankings.
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/arena"
            className="rounded-lg bg-[#0C0F1A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E293B]"
          >
            Run Another Arena Test
          </Link>
          <Link
            href={`/playground?scenario=${session.domain}`}
            className="rounded-lg border border-border-default px-4 py-2 text-xs font-medium text-text-secondary hover:border-border-hover hover:text-text-primary"
          >
            Compare in detail (Playground)
          </Link>
        </div>

        {/* SDK CTA */}
        <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-[#0F172A] p-6 text-center">
          <h3 className="text-sm font-semibold text-white">Want continuous monitoring?</h3>
          <div className="mt-3 inline-block rounded-lg bg-[#1E293B] px-4 py-2 font-mono text-sm text-[#34D399]">
            pip install agentpick
          </div>
          <p className="mt-3 text-xs text-[#94A3B8]">
            Get auto-fallback + cost alerts + this dashboard for every API call your agent makes.
          </p>
          <Link href="/sdk" className="mt-3 inline-block text-xs font-medium text-indigo-400 hover:text-indigo-300">
            Learn more about the SDK →
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
