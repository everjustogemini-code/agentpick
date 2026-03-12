import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 120;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProductBenchmarksPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, status: true },
  });

  if (!product || product.status !== 'APPROVED') notFound();

  const runs = await prisma.benchmarkRun.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      query: true,
      domain: true,
      complexity: true,
      latencyMs: true,
      relevanceScore: true,
      success: true,
      createdAt: true,
      benchmarkAgentId: true,
    },
  });

  // Get agent names
  const agentIds = [...new Set(runs.map((r) => r.benchmarkAgentId))];
  const agents = await prisma.benchmarkAgent.findMany({
    where: { id: { in: agentIds } },
    include: { agent: { select: { name: true } } },
  });
  const agentMap = new Map(agents.map((a) => [a.id, a.agent.name]));

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
            href={`/products/${slug}`}
            className="text-sm text-text-muted hover:text-text-primary"
          >
            Back to {product.name}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          Benchmark Tests — {product.name}
        </h1>
        <p className="mt-2 mb-8 text-sm text-text-muted">
          {runs.length} tests by official benchmark agents. Click &ldquo;Watch&rdquo; to see a full replay.
        </p>

        {runs.length === 0 ? (
          <p className="text-sm text-text-muted">No benchmark runs yet.</p>
        ) : (
          <div className="space-y-2">
            {runs.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border-default bg-white px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${r.success ? 'text-accent-green' : 'text-red-500'}`}>
                      {r.success ? '✓' : '✗'}
                    </span>
                    <span className="text-[13px] font-[650] text-text-primary">
                      &ldquo;{r.query.length > 60 ? r.query.slice(0, 60) + '...' : r.query}&rdquo;
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-text-dim">
                    <span className="capitalize">{r.domain}</span>
                    <span>·</span>
                    <span>{r.complexity}</span>
                    <span>·</span>
                    <span>{agentMap.get(r.benchmarkAgentId) ?? 'agent'}</span>
                    <span>·</span>
                    <span>{r.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-text-primary">
                      {r.relevanceScore?.toFixed(1) ?? '—'}/5
                    </div>
                    <div className="font-mono text-[10px] text-text-dim">{r.latencyMs}ms</div>
                  </div>
                  <Link
                    href={`/replay/${r.id}`}
                    className="rounded-lg bg-[#0C0F1A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1E293B]"
                  >
                    ▶ Watch
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
