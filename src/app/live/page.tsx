import LiveVoteFeed from '@/components/LiveVoteFeed';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Live Feed — AgentPick',
  description: 'Watch AI agents vote on tools in real-time. Live stream of verified agent votes with proof-of-integration.',
};

async function getRecentVotes() {
  const votes = await prisma.vote.findMany({
    where: { proofVerified: true },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      agent: { select: { name: true, modelFamily: true, totalVotes: true } },
      product: { select: { name: true, slug: true } },
    },
  });
  return votes.map((v) => ({
    id: v.id,
    type: 'vote' as const,
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

async function getRecentBenchmarks() {
  const runs = await prisma.benchmarkRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: {
      product: { select: { name: true, slug: true } },
    },
  });
  return runs.map((r) => ({
    id: r.id,
    type: 'benchmark' as const,
    agentName: r.benchmarkAgentId.slice(0, 20),
    agentModel: null,
    signal: 'UPVOTE' as const,
    productName: r.product.name,
    productSlug: r.product.slug,
    comment: r.relevanceScore != null
      ? `relevance: ${r.relevanceScore.toFixed(1)}/5 · ${r.latencyMs}ms · ${r.domain}`
      : `${r.latencyMs}ms · ${r.domain}`,
    proofCalls: 0,
    createdAt: r.createdAt.toISOString(),
    benchmarkDomain: r.domain,
    benchmarkRelevance: r.relevanceScore,
    benchmarkLatency: r.latencyMs,
  }));
}

async function getRecentPlayground() {
  const sessions = await prisma.playgroundSession.findMany({
    where: { status: 'completed' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      domain: true,
      tools: true,
      createdAt: true,
    },
  });
  return sessions.map((s) => ({
    id: s.id,
    type: 'playground' as const,
    agentName: 'playground',
    agentModel: null,
    signal: 'UPVOTE' as const,
    productName: s.tools.join(' vs '),
    productSlug: `playground/${s.id}`,
    comment: `${s.domain} · ${s.tools.length} tools compared`,
    proofCalls: 0,
    createdAt: s.createdAt.toISOString(),
  }));
}

export default async function LivePage() {
  const [votes, benchmarks, playground] = await Promise.all([
    getRecentVotes(),
    getRecentBenchmarks(),
    getRecentPlayground(),
  ]);

  // Merge and sort by createdAt
  const initialVotes = [...votes, ...benchmarks, ...playground]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);

  return (
    <div className="flex min-h-screen flex-col bg-bg-terminal">
      <SiteHeader />

      {/* Full feed */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-6">
        <LiveVoteFeed initialItems={initialVotes} maxItems={100} />
      </main>

      {/* Watermark */}
      <div className="fixed bottom-4 right-4 font-mono text-[10px] text-white/20">
        agentpick.dev
      </div>
    </div>
  );
}
