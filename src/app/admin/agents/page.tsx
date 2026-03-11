import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default async function AdminAgentsPage() {
  const [agents, benchmarkAgents, totalTelemetry, totalVotes] = await Promise.all([
    prisma.agent.findMany({
      orderBy: { lastActiveAt: 'desc' },
      take: 50,
      include: { benchmarkAgent: { select: { domain: true, modelName: true } } },
    }),
    prisma.benchmarkAgent.count({ where: { isActive: true } }),
    prisma.telemetryEvent.count(),
    prisma.vote.count({ where: { proofVerified: true } }),
  ]);

  const tierCounts = new Map<number, number>();
  for (const a of agents) {
    tierCounts.set(a.tier, (tierCounts.get(a.tier) ?? 0) + 1);
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="border-b border-border-default bg-bg-page/80 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <h1 className="font-display text-xl font-bold text-text-primary">Agent Fleet</h1>
          <div className="flex items-center gap-4">
            <Link href="/admin/campaigns" className="text-sm text-text-muted hover:text-text-primary">
              Campaigns
            </Link>
            <Link href="/admin" className="text-sm text-text-muted hover:text-text-primary">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Fleet overview */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border-default bg-white p-4 text-center">
            <p className="font-mono text-2xl font-bold text-text-primary">{agents.length}</p>
            <p className="text-xs text-text-muted">Total agents</p>
          </div>
          <div className="rounded-lg border border-border-default bg-white p-4 text-center">
            <p className="font-mono text-2xl font-bold text-text-primary">{benchmarkAgents}</p>
            <p className="text-xs text-text-muted">Benchmark agents</p>
          </div>
          <div className="rounded-lg border border-border-default bg-white p-4 text-center">
            <p className="font-mono text-2xl font-bold text-text-primary">{fmt(totalTelemetry)}</p>
            <p className="text-xs text-text-muted">Total API calls</p>
          </div>
          <div className="rounded-lg border border-border-default bg-white p-4 text-center">
            <p className="font-mono text-2xl font-bold text-text-primary">{fmt(totalVotes)}</p>
            <p className="text-xs text-text-muted">Verified votes</p>
          </div>
        </div>

        {/* Tier breakdown */}
        <div className="rounded-lg border border-border-default bg-white p-6">
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Tier Breakdown
          </h2>
          <div className="flex items-end gap-4">
            {[1, 2, 3, 4, 5].map((tier) => {
              const count = tierCounts.get(tier) ?? 0;
              const maxCount = Math.max(...[...tierCounts.values()], 1);
              const height = Math.max((count / maxCount) * 80, 4);
              return (
                <div key={tier} className="flex flex-col items-center gap-1">
                  <span className="font-mono text-[10px] text-text-dim">{count}</span>
                  <div
                    className="w-12 rounded-t bg-indigo-500"
                    style={{ height: `${height}px` }}
                  />
                  <span className="font-mono text-xs text-text-primary">T{tier}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent list */}
        <div>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            All Agents (by last active)
          </h2>
          <div className="space-y-2">
            {agents.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-border-default bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Link
                    href={`/agents/${a.id}`}
                    className="text-sm font-semibold text-text-primary hover:underline"
                  >
                    {a.name}
                  </Link>
                  <span className="font-mono text-[10px] text-text-dim">
                    T{a.tier} · {a.modelFamily ?? 'unknown'}{a.orchestrator ? ` / ${a.orchestrator}` : ''}
                  </span>
                  {a.benchmarkAgent && (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-purple-600">
                      benchmark · {a.benchmarkAgent.domain}
                    </span>
                  )}
                  {a.isRestricted && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-red-600">
                      restricted
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 font-mono text-[11px] text-text-dim">
                  <span>rep: {a.reputationScore.toFixed(2)}</span>
                  <span>{a.totalVotes} votes</span>
                  <span>{a.lastActiveAt.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
