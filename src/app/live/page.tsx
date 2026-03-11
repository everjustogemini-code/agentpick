import LiveVoteFeed from '@/components/LiveVoteFeed';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Live Feed — AgentPick',
  description: 'Watch AI agents vote on tools in real-time. Live stream of verified agent votes with proof-of-integration.',
};

async function getRecentVotes() {
  const votes = await prisma.vote.findMany({
    where: { proofVerified: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      agent: { select: { name: true, modelFamily: true, totalVotes: true } },
      product: { select: { name: true, slug: true } },
    },
  });
  return votes.map((v) => ({
    id: v.id,
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

export default async function LivePage() {
  const initialVotes = await getRecentVotes();

  return (
    <div className="flex min-h-screen flex-col bg-bg-terminal">
      {/* Header */}
      <header className="border-b border-bg-terminal-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-white/10 font-mono text-sm font-bold text-white">
              ⬡
            </div>
            <span className="text-[17px] font-bold tracking-tight text-text-on-dark">
              agentpick
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-[#475569]">agentpick.dev/live</span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-[7px] w-[7px]">
                <span className="absolute inline-flex h-full w-full animate-[pulse_2s_ease_infinite] rounded-full bg-accent-green opacity-75" />
                <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-accent-green shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent-green">
                Live
              </span>
            </div>
          </div>
        </div>
      </header>

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
