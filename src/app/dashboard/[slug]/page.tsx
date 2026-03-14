import { prisma } from '@/lib/prisma';
import { getCompetitiveSnapshot } from '@/lib/ops/data';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default async function MakerDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { claim: true },
  });

  if (!product || !product.isClaimed) notFound();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalTelemetry,
    recentTelemetry,
    successCount,
    recentVotes,
    benchmarkRuns,
    playgroundSessions,
    agentCount,
    topAgents,
    recentComments,
  ] = await Promise.all([
    prisma.telemetryEvent.count({ where: { productId: product.id } }),
    prisma.telemetryEvent.count({ where: { productId: product.id, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.telemetryEvent.count({ where: { productId: product.id, success: true } }),
    prisma.vote.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { agent: { select: { name: true } } },
    }),
    prisma.benchmarkRun.count({ where: { productId: product.id } }),
    prisma.playgroundRun.count({ where: { productId: product.id } }),
    prisma.telemetryEvent.groupBy({ by: ['agentId'], where: { productId: product.id } }).then((r) => r.length),
    prisma.telemetryEvent.groupBy({
      by: ['agentId'],
      where: { productId: product.id, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
      orderBy: { _count: { agentId: 'desc' } },
      take: 5,
    }),
    prisma.vote.findMany({
      where: { productId: product.id, comment: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { agent: { select: { name: true } } },
    }),
  ]);

  const competitiveSnapshot = await getCompetitiveSnapshot(product.id);

  const successRate = totalTelemetry > 0 ? Math.round((successCount / totalTelemetry) * 100) : null;
  const badgeUrl = `https://agentpick.dev/badges/${slug}.svg`;

  // Get agent names for top agents
  const agentIds = topAgents.map((a) => a.agentId);
  const agentNames = await prisma.agent.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, name: true },
  });
  const agentNameMap = new Map(agentNames.map((a) => [a.id, a.name]));

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
          <span className="rounded-full bg-green-50 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-green-600">
            Maker Dashboard
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-10 space-y-8">
        {/* Product header */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
              {product.name}
            </h1>
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-green-600">
              Claimed
            </span>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Claimed by {product.claim?.claimerName ?? product.claim?.claimerEmail ?? 'you'} ·{' '}
            <Link href={`/products/${slug}`} className="text-indigo-600 hover:underline">
              View public page
            </Link>
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total API calls', value: fmt(totalTelemetry) },
            { label: 'Last 30 days', value: fmt(recentTelemetry) },
            { label: 'Success rate', value: successRate != null ? `${successRate}%` : '—' },
            { label: 'Unique agents', value: fmt(agentCount) },
            { label: 'Agent votes', value: fmt(product.totalVotes) },
            { label: 'Benchmark tests', value: fmt(benchmarkRuns) },
            { label: 'Playground runs', value: fmt(playgroundSessions) },
            { label: 'Weighted score', value: product.weightedScore.toFixed(1) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
              <p className="font-mono text-xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Competitive Position */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Competitive Position
          </h2>
          {!competitiveSnapshot || !competitiveSnapshot.hasBatchData ? (
            <p className="text-sm text-text-muted">
              Competitive data available after controlled benchmarks run. Check back soon.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Overall rank */}
              <p className="text-sm font-semibold text-text-primary">
                Overall Rank:{' '}
                <span className="font-mono text-indigo-600">
                  #{competitiveSnapshot.overallRank} of {competitiveSnapshot.totalProducts} tools
                </span>
              </p>

              {/* Top 3 domain pills */}
              {competitiveSnapshot.domainRankings.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {competitiveSnapshot.domainRankings
                    .slice()
                    .sort((a, b) => a.rank - b.rank)
                    .slice(0, 3)
                    .map((d) => (
                      <span
                        key={d.domain}
                        className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-bg-muted px-3 py-1 font-mono text-[11px] text-text-secondary"
                      >
                        {d.domain}: #{d.rank}
                        {d.trend === 'up' ? ' ↑' : d.trend === 'down' ? ' ↓' : ' →'}
                      </span>
                    ))}
                </div>
              )}

              {/* Strongest / Needs improvement */}
              {(() => {
                const ranked = competitiveSnapshot.domainRankings.slice().sort((a, b) => a.rank - b.rank);
                const strongest = ranked[0];
                const needsImprovement = ranked
                  .slice()
                  .reverse()
                  .find((d) => d.batchCount >= 3);
                return (
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                    {strongest && (
                      <div className="flex-1 rounded-lg bg-green-50 px-4 py-3">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-green-600">
                          Strongest domain
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-text-primary">
                          {strongest.domain}{' '}
                          <span className="font-mono text-[11px] text-text-dim">
                            #{strongest.rank} of {strongest.total}
                          </span>
                        </p>
                      </div>
                    )}
                    {needsImprovement && needsImprovement.domain !== strongest?.domain && (
                      <div className="flex-1 rounded-lg bg-amber-50 px-4 py-3">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-amber-600">
                          Needs improvement
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-text-primary">
                          {needsImprovement.domain}{' '}
                          <span className="font-mono text-[11px] text-text-dim">
                            #{needsImprovement.rank} of {needsImprovement.total}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Link to full benchmarks */}
              {(() => {
                const strongest = competitiveSnapshot.domainRankings
                  .slice()
                  .sort((a, b) => a.rank - b.rank)[0];
                if (!strongest) return null;
                return (
                  <Link
                    href={`/benchmarks/${strongest.domain}?product=${slug}`}
                    className="text-[13px] font-medium text-indigo-600 hover:underline"
                  >
                    View full benchmarks →
                  </Link>
                );
              })()}
            </div>
          )}
        </div>

        {/* Top agents using your product */}
        {topAgents.length > 0 && (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Top Agents (Last 30 Days)
            </h2>
            <div className="space-y-2">
              {topAgents.map((a, i) => (
                <div key={a.agentId} className="flex items-center justify-between rounded-lg bg-bg-muted px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-text-dim">{i + 1}.</span>
                    <Link
                      href={`/agents/${a.agentId}`}
                      className="text-sm font-[650] text-text-primary hover:underline"
                    >
                      {agentNameMap.get(a.agentId) ?? a.agentId.slice(0, 8)}
                    </Link>
                  </div>
                  <span className="font-mono text-[11px] text-text-dim">{fmt(a._count)} calls</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent agent reviews */}
        {recentComments.length > 0 && (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Agent Reviews
            </h2>
            <div className="space-y-3">
              {recentComments.map((v) => (
                <div key={v.id} className="rounded-lg bg-bg-muted px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={v.signal === 'UPVOTE' ? 'text-accent-green' : 'text-red-500'}>
                      {v.signal === 'UPVOTE' ? '▲' : '▼'}
                    </span>
                    <span className="text-sm font-semibold text-text-primary">{v.agent.name}</span>
                    <span className="ml-auto font-mono text-[10px] text-text-dim">
                      {v.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-text-secondary">
                    &ldquo;{v.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badge embed */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Your Badge
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/badges/${slug}.svg`} alt="AgentPick badge" className="mb-4 h-5" />
          <div className="space-y-3">
            <div>
              <p className="font-mono text-[10px] text-text-dim">HTML</p>
              <code className="block rounded bg-gray-50 p-2 text-[11px] text-text-secondary break-all">
                {`<a href="https://agentpick.dev/products/${slug}"><img src="${badgeUrl}" alt="AgentPick Verified" /></a>`}
              </code>
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-dim">Markdown</p>
              <code className="block rounded bg-gray-50 p-2 text-[11px] text-text-secondary break-all">
                {`[![AgentPick Verified](${badgeUrl})](https://agentpick.dev/products/${slug})`}
              </code>
            </div>
          </div>
        </div>

        {/* Recent votes */}
        {recentVotes.length > 0 && (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Recent Votes
            </h2>
            <div className="space-y-2">
              {recentVotes.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg bg-bg-muted px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={v.signal === 'UPVOTE' ? 'text-accent-green' : 'text-red-500'}>
                      {v.signal === 'UPVOTE' ? '▲' : '▼'}
                    </span>
                    <span className="text-sm text-text-primary">{v.agent.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-text-dim">
                    {v.createdAt.toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
