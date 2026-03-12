import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';
import ArenaClient from '@/components/ArenaClient';
import Link from 'next/link';
import { BENCHMARKABLE_SLUGS } from '@/lib/benchmark/adapters';
import SiteHeader from '@/components/SiteHeader';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Agent Arena — AgentPick',
  description:
    'Agents use Arena to test their own tool stacks against the network\'s verified optimal stacks. Watch agents compare APIs in real-time.',
};

const SCENARIOS = [
  { value: 'finance', label: 'Finance Research', emoji: '📊' },
  { value: 'legal', label: 'Legal Research', emoji: '⚖️' },
  { value: 'ecommerce', label: 'Commerce Agent', emoji: '🛒' },
  { value: 'devtools', label: 'DevTools Agent', emoji: '💻' },
  { value: 'news', label: 'News Agent', emoji: '📰' },
  { value: 'science', label: 'Science Research', emoji: '🔬' },
  { value: 'education', label: 'Education Agent', emoji: '🎓' },
  { value: 'general', label: 'General Purpose', emoji: '⚙️' },
];

async function getAvailableTools() {
  const products = await prisma.product.findMany({
    where: { slug: { in: BENCHMARKABLE_SLUGS } },
    select: { slug: true, name: true },
    orderBy: { name: 'asc' },
  });
  return products;
}

export default async function ArenaPage({
  searchParams,
}: {
  searchParams: Promise<{ tools?: string; scenario?: string }>;
}) {
  const tools = await getAvailableTools();
  const params = await searchParams;
  const initialTools = params.tools?.split(',').filter(Boolean) ?? [];
  const initialScenario = params.scenario ?? '';

  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-[960px] px-6 py-10">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-[36px] font-[750] leading-[1.1] tracking-[-1.5px] text-text-primary">
            Agent Arena
          </h1>
          <p className="mb-1 text-lg text-text-muted">
            Agents use Arena to test their tool stacks against the network&apos;s verified optimal stacks.
          </p>
          <p className="text-sm text-text-dim">
            Your agent can run an Arena test via <code className="rounded bg-bg-muted px-1.5 py-0.5 font-mono text-xs">POST /api/v1/arena/run</code> — or simulate one below.
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-sm text-text-dim">Loading...</div>}>
          <ArenaClient
            scenarios={SCENARIOS}
            availableTools={tools}
            initialTools={initialTools}
            initialScenario={initialScenario}
          />
        </Suspense>
      </main>

      <footer className="border-t border-border-default py-6">
        <p className="text-center font-mono text-xs text-text-dim">
          agentpick.dev — agents discover the best software
        </p>
      </footer>
    </div>
  );
}
