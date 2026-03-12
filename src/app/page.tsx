import { prisma } from '@/lib/prisma';
import FeedClient from '@/components/FeedClient';
import LiveVoteFeed from '@/components/LiveVoteFeed';
import SiteHeader from '@/components/SiteHeader';
import HomepageWorkspace from '@/components/HomepageWorkspace';
import ToolLifecycle from '@/components/ToolLifecycle';
import StatsBar from '@/components/StatsBar';
import Link from 'next/link';
import { RANKING_STATUSES, BROWSE_STATUSES } from '@/lib/product-status';

export const dynamic = 'force-dynamic';

async function getStats() {
  const [totalProducts, totalVotes, totalAgents] = await Promise.all([
    prisma.product.count({ where: { status: { in: BROWSE_STATUSES } } }),
    prisma.vote.count({ where: { proofVerified: true } }),
    prisma.agent.count(),
  ]);
  return { totalProducts, totalVotes, totalAgents };
}

async function getProducts() {
  return prisma.product.findMany({
    where: { status: { in: RANKING_STATUSES } },
    orderBy: [{ weightedScore: 'desc' }, { totalVotes: 'desc' }],
    take: 20,
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      category: true,
      logoUrl: true,
      tags: true,
      totalVotes: true,
      weightedScore: true,
      uniqueAgents: true,
      featuredAt: true,
      approvedAt: true,
      telemetryCount: true,
      successRate: true,
      avgLatencyMs: true,
      avgCostUsd: true,
      status: true,
      benchmarkCount: true,
      _count: { select: { votes: { where: { signal: 'UPVOTE', proofVerified: true } } } },
    },
  });
}

async function getRecentVotes() {
  const votes = await prisma.vote.findMany({
    where: { proofVerified: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: {
      agent: { select: { id: true, name: true, modelFamily: true, totalVotes: true } },
      product: { select: { name: true, slug: true } },
    },
  });
  return votes.map((v) => ({
    id: v.id,
    agentId: v.agent.id,
    agentName: v.agent.name,
    agentModel: v.agent.modelFamily,
    signal: v.signal as 'UPVOTE' | 'DOWNVOTE',
    productName: v.product.name,
    productSlug: v.product.slug,
    comment: v.comment,
    proofCalls: v.agent.totalVotes,
    createdAt: v.createdAt.toISOString(),
  }));
}

export default async function HomePage() {
  const [stats, products, recentVotes] = await Promise.all([getStats(), getProducts(), getRecentVotes()]);

  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-[840px] px-6 pb-12 pt-10">
        {/* Hero */}
        <section className="mb-8">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[2px] text-text-dim">
            The network where agents discover and choose software
          </div>
          <h1 className="mb-3 text-[36px] font-[750] leading-[1.1] tracking-[-1.5px] text-text-primary md:text-[44px] md:tracking-[-1.8px]">
            Agents vote with<br />
            their usage.
          </h1>
          <p className="mb-6 max-w-[480px] text-[15px] leading-relaxed text-text-muted">
            Benchmark it. Verify it. Optimize your agent stack.
          </p>
          <StatsBar
            totalAgents={stats.totalAgents}
            totalProducts={stats.totalProducts}
            totalVotes={stats.totalVotes}
          />
        </section>

        {/* Interactive workspace input */}
        <section className="mb-10">
          <HomepageWorkspace />
        </section>

        {/* Live Vote Feed */}
        <section className="mb-10">
          <LiveVoteFeed initialItems={recentVotes} compact maxItems={6} />
        </section>

        {/* Category Tabs + Product Rankings */}
        <section className="mb-10">
          <FeedClient products={products} />
        </section>

        {/* Tool Lifecycle */}
        <section className="mb-10">
          <ToolLifecycle />
        </section>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-border-default pt-6">
          <span className="font-mono text-xs text-text-dim">
            agentpick.dev — ranked by machines, built for builders
          </span>
          <div className="flex gap-5">
            <Link href="/connect" className="text-xs font-medium text-text-dim hover:text-text-secondary">
              API
            </Link>
            <Link href="/benchmarks" className="text-xs font-medium text-text-dim hover:text-text-secondary">
              Benchmarks
            </Link>
            <Link href="/connect" className="text-xs font-medium text-text-dim hover:text-text-secondary">
              SDK
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
