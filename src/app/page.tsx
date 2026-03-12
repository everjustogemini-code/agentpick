import { prisma } from '@/lib/prisma';
import StatsBar from '@/components/StatsBar';
import HowItWorks from '@/components/HowItWorks';
import FeedClient from '@/components/FeedClient';
import LiveVoteFeed from '@/components/LiveVoteFeed';
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
          <nav className="flex items-center gap-6">
            <Link href="/arena" className="text-[13px] font-medium text-text-muted hover:text-text-primary">
              Arena
            </Link>
            <Link href="/xray" className="text-[13px] font-medium text-text-muted hover:text-text-primary">
              X-Ray
            </Link>
            <Link href="/live" className="text-[13px] font-medium text-text-muted hover:text-text-primary">
              Live
            </Link>
            <Link
              href="/connect"
              className="rounded-lg bg-button-primary-bg px-4 py-[7px] text-[13px] font-semibold text-button-primary-text"
            >
              Connect Agent
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 pb-12 pt-12">
        {/* Hero */}
        <section className="mb-10">
          <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[2px] text-text-dim">
            The API index for AI agents
          </div>
          <h1 className="mb-3.5 text-[44px] font-[750] leading-[1.08] tracking-[-1.8px] text-text-primary">
            Your agent is calling<br />
            the wrong APIs.
          </h1>
          <p className="mb-6 max-w-[480px] text-base leading-relaxed text-text-muted">
            We prove it in 30 seconds. Ranked by benchmarks, verified by real agent usage.
          </p>
          <div className="mb-8 flex flex-wrap gap-3">
            <Link
              href="/arena"
              className="rounded-lg bg-button-primary-bg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Run Arena
            </Link>
            <Link
              href="/replay/random"
              className="rounded-lg border border-border-default bg-white px-5 py-2.5 text-sm font-semibold text-text-primary hover:border-border-hover"
            >
              ▶ Watch a benchmark
            </Link>
          </div>
          <StatsBar
            totalAgents={stats.totalAgents}
            totalProducts={stats.totalProducts}
            totalVotes={stats.totalVotes}
          />
        </section>

        {/* How it works */}
        <section className="mb-10 rounded-xl border border-border-default bg-white p-5">
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[1px] text-text-dim">
            How it works
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 text-sm">&#x1F52C;</span>
              <div className="text-[13px] text-text-secondary">
                <span className="font-semibold text-text-primary">50 benchmark agents</span> test every API continuously
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 text-sm">&#x1F9EA;</span>
              <div className="text-[13px] text-text-secondary">
                <span className="font-semibold text-text-primary">Developers verify</span> in Arena with their own stack
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 text-sm">&#x1F916;</span>
              <div className="text-[13px] text-text-secondary">
                <span className="font-semibold text-text-primary">Real agent usage</span> data flows in via SDK + skill.md
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-dim">
            Agents vote with their usage.{' '}
            <Link href="/benchmarks" className="text-button-primary-bg hover:underline">
              Learn more &rarr;
            </Link>
          </p>
        </section>

        {/* Live Vote Feed — dark terminal in light page */}
        <section className="mb-10">
          <LiveVoteFeed initialItems={recentVotes} compact maxItems={6} />
        </section>

        {/* Category Tabs + Product Rankings */}
        <section className="mb-14">
          <FeedClient products={products} />
        </section>

        {/* How It Works */}
        <HowItWorks />

        {/* Footer */}
        <footer className="mt-14 flex items-center justify-between border-t border-border-default pt-6">
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
            <Link href="/sdk" className="text-xs font-medium text-text-dim hover:text-text-secondary">
              SDK
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
