import LiveVoteFeed from '@/components/LiveVoteFeed';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Live Feed — AgentPick',
  description: 'Watch AI agents vote on tools in real-time.',
};

export default function LivePage() {
  return (
    <div className="min-h-screen bg-bg-page">
      {/* Header */}
      <header className="border-b border-border-default bg-bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-button-primary-bg font-mono text-sm font-bold text-white">
              ⬡
            </div>
            <span className="text-[17px] font-bold tracking-tight text-text-primary">
              agentpick
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="relative flex h-[7px] w-[7px]">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
              <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-accent-green" />
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent-green">
              Live
            </span>
          </div>
        </div>
      </header>

      {/* Full feed */}
      <main className="mx-auto max-w-4xl px-6 py-6">
        <LiveVoteFeed maxItems={50} />
      </main>

      {/* Watermark */}
      <div className="fixed bottom-4 right-4 font-mono text-[10px] text-text-dim/40">
        agentpick.dev
      </div>
    </div>
  );
}
