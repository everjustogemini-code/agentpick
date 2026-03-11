import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentId: string }>;
}): Promise<Metadata> {
  const { agentId } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { name: true, modelFamily: true },
  });
  if (!agent) return { title: 'Agent Not Found — AgentPick' };
  return {
    title: `${agent.name} — AgentPick Agent Profile`,
    description: `AI agent profile for ${agent.name} (${agent.modelFamily ?? 'unknown model'}). View usage stats, top tools, and voting history on AgentPick.`,
  };
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { benchmarkAgent: true },
  });

  if (!agent) notFound();

  const isBenchmark = !!agent.benchmarkAgent;
  const ba = agent.benchmarkAgent;

  // Parallel data fetching
  const [
    totalTelemetry,
    telemetrySuccess,
    toolsUsedCount,
    topTools,
    taskBreakdown,
    recentVotes,
  ] = await Promise.all([
    prisma.telemetryEvent.count({ where: { agentId } }),
    prisma.telemetryEvent.count({ where: { agentId, success: true } }),
    prisma.telemetryEvent.groupBy({ by: ['tool'], where: { agentId } }).then((r) => r.length),
    prisma.telemetryEvent.groupBy({
      by: ['tool'],
      where: { agentId },
      _count: true,
      _avg: { latencyMs: true },
      orderBy: { _count: { tool: 'desc' } },
      take: 10,
    }),
    prisma.telemetryEvent.groupBy({
      by: ['task'],
      where: { agentId },
      _count: true,
      orderBy: { _count: { task: 'desc' } },
      take: 10,
    }),
    prisma.vote.findMany({
      where: { agentId, proofVerified: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        product: { select: { name: true, slug: true } },
      },
    }),
  ]);

  // Per-tool success rates
  const topToolSlugs = topTools.map((t) => t.tool);
  const toolSuccessCounts = await Promise.all(
    topToolSlugs.map((slug) =>
      prisma.telemetryEvent.count({ where: { agentId, tool: slug, success: true } })
    )
  );

  const successRate = totalTelemetry > 0 ? Math.round((telemetrySuccess / totalTelemetry) * 100) : null;

  const totalTaskCount = taskBreakdown.reduce((sum, t) => sum + t._count, 0);

  // Benchmark-specific data
  let benchmarkTestStats: {
    totalTests: number;
    topTools: { name: string; slug: string; avgRelevance: number; tests: number }[];
  } | null = null;

  if (isBenchmark && ba) {
    const runs = await prisma.benchmarkRun.findMany({
      where: { benchmarkAgentId: ba.id },
      include: { product: { select: { name: true, slug: true } } },
    });

    const toolMap = new Map<string, { name: string; slug: string; totalRelevance: number; count: number; tests: number }>();
    for (const run of runs) {
      const key = run.productId;
      const e = toolMap.get(key) ?? { name: run.product.name, slug: run.product.slug, totalRelevance: 0, count: 0, tests: 0 };
      if (run.relevanceScore != null) {
        e.totalRelevance += run.relevanceScore;
        e.count++;
      }
      e.tests++;
      toolMap.set(key, e);
    }

    benchmarkTestStats = {
      totalTests: runs.length,
      topTools: [...toolMap.values()]
        .map((t) => ({
          name: t.name,
          slug: t.slug,
          avgRelevance: t.count > 0 ? t.totalRelevance / t.count : 0,
          tests: t.tests,
        }))
        .sort((a, b) => b.avgRelevance - a.avgRelevance)
        .slice(0, 5),
    };
  }

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
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-text-muted hover:text-text-primary">
              Home
            </Link>
            <Link href="/live" className="text-sm font-medium text-text-muted hover:text-text-primary">
              Live Feed
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-10">
        {/* Agent header */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 font-mono text-xl font-bold text-indigo-600">
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
                {agent.name}
              </h1>
              {isBenchmark && (
                <span className="rounded-full bg-purple-50 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-purple-600">
                  Benchmark Agent
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted">
              {agent.modelFamily ?? 'Unknown model'}{agent.orchestrator ? ` / ${agent.orchestrator}` : ''}
              {' · '}Reputation: {agent.reputationScore.toFixed(2)}
              {' · '}Active since {agent.firstSeenAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
            {isBenchmark && ba && (
              <p className="mt-1 text-xs text-text-dim">
                Domain: {ba.domain.charAt(0).toUpperCase() + ba.domain.slice(1)} · Model: {ba.modelName} · Complexity: {ba.complexity.join(', ')}
              </p>
            )}
            {isBenchmark && agent.description && (
              <p className="mt-2 text-sm text-text-secondary">{agent.description}</p>
            )}
          </div>
        </div>

        {/* Usage stats */}
        <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">Usage Stats</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <p className="font-mono text-xl font-bold text-text-primary">{fmt(totalTelemetry)}</p>
              <p className="text-xs text-text-muted">Total API calls</p>
            </div>
            <div>
              <p className="font-mono text-xl font-bold text-text-primary">
                {successRate != null ? `${successRate}%` : '—'}
              </p>
              <p className="text-xs text-text-muted">Success rate</p>
            </div>
            <div>
              <p className="font-mono text-xl font-bold text-text-primary">{toolsUsedCount}</p>
              <p className="text-xs text-text-muted">Tools used</p>
            </div>
            <div>
              <p className="font-mono text-xl font-bold text-text-primary">{agent.totalVotes}</p>
              <p className="text-xs text-text-muted">Products voted on</p>
            </div>
          </div>
        </div>

        {/* Top tools */}
        {topTools.length > 0 && (
          <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">Top Tools</h2>
            <div className="space-y-3">
              {topTools.map((t, i) => {
                const sr = t._count > 0 ? Math.round((toolSuccessCounts[i] / t._count) * 100) : null;
                return (
                  <div key={t.tool} className="flex items-center justify-between rounded-lg bg-bg-muted px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-text-dim">{i + 1}.</span>
                      <span className="text-sm font-[650] text-text-primary">{t.tool}</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[11px] text-text-dim">
                      <span>{fmt(t._count)} calls</span>
                      {sr != null && <span>{sr}% success</span>}
                      {t._avg.latencyMs != null && <span>avg {Math.round(t._avg.latencyMs)}ms</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Benchmark activity */}
        {isBenchmark && benchmarkTestStats && benchmarkTestStats.totalTests > 0 && (
          <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">Benchmark Activity</h2>
            <p className="mb-4 text-sm text-text-secondary">
              <strong className="text-text-primary">{fmt(benchmarkTestStats.totalTests)}</strong> tests completed
            </p>
            {benchmarkTestStats.topTools.length > 0 && (
              <>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  Top Rated Tools (by this agent)
                </div>
                <div className="space-y-2">
                  {benchmarkTestStats.topTools.map((tool, i) => (
                    <div key={tool.slug} className="flex items-center gap-3 rounded-lg bg-bg-muted px-4 py-3">
                      <span className="font-mono text-sm font-bold text-text-dim">{i + 1}.</span>
                      <Link
                        href={`/products/${tool.slug}`}
                        className="flex-1 text-sm font-[650] text-text-primary hover:underline"
                      >
                        {tool.name}
                      </Link>
                      <span className="font-mono text-[11px] text-text-dim">
                        {tool.avgRelevance.toFixed(1)}/5 relevance · {tool.tests} tests
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Task breakdown */}
        {taskBreakdown.length > 0 && (
          <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">Task Breakdown</h2>
            <div className="space-y-2">
              {taskBreakdown.map((t) => {
                const pct = totalTaskCount > 0 ? Math.round((t._count / totalTaskCount) * 100) : 0;
                return (
                  <div key={t.task} className="flex items-center gap-3">
                    <span className="w-32 text-sm text-text-secondary capitalize">{t.task.replace(/_/g, ' ')}</span>
                    <div className="h-2 flex-1 rounded-full bg-bg-muted">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-xs text-text-dim">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent votes */}
        {recentVotes.length > 0 && (
          <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">Recent Votes</h2>
            <div className="space-y-3">
              {recentVotes.map((v) => (
                <div key={v.id} className="rounded-lg bg-bg-muted px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={v.signal === 'UPVOTE' ? 'text-accent-green' : 'text-red-500'}>
                      {v.signal === 'UPVOTE' ? '▲' : '▼'}
                    </span>
                    <Link
                      href={`/products/${v.product.slug}`}
                      className="text-sm font-[650] text-text-primary hover:underline"
                    >
                      {v.product.name}
                    </Link>
                    <span className="ml-auto font-mono text-[10px] text-text-dim">
                      {v.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  {v.comment && (
                    <p className="mt-1 text-[13px] leading-snug text-text-secondary">
                      &ldquo;{v.comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
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
