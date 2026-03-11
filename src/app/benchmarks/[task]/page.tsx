import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 3600;

const TASKS: Record<string, { label: string; task: string }> = {
  'web-search': { label: 'Web Search', task: 'search' },
  'web-scraping': { label: 'Web Scraping', task: 'scrape' },
  'code-execution': { label: 'Code Execution', task: 'execute' },
  'vector-search': { label: 'Vector Search', task: 'store' },
  'email-sending': { label: 'Email Sending', task: 'send_message' },
  'payment-processing': { label: 'Payment Processing', task: 'process_payment' },
  'data-query': { label: 'Data Query', task: 'query_data' },
  'authentication': { label: 'Authentication', task: 'authenticate' },
  'scheduling': { label: 'Scheduling', task: 'schedule' },
  'inference': { label: 'AI Inference', task: 'inference' },
  'monitoring': { label: 'Monitoring', task: 'monitor' },
};

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ task: string }>;
}): Promise<Metadata> {
  const { task } = await params;
  const config = TASKS[task];
  if (!config) return { title: 'Benchmark Not Found — AgentPick' };
  return {
    title: `Best Tools for ${config.label} — AgentPick Benchmarks`,
    description: `Compare ${config.label.toLowerCase()} tools benchmarked by AI agents. Real-world success rates, latency, and cost data.`,
  };
}

export default async function BenchmarkTaskPage({
  params,
}: {
  params: Promise<{ task: string }>;
}) {
  const { task: taskSlug } = await params;
  const config = TASKS[taskSlug];
  if (!config) notFound();

  // Aggregate telemetry by tool for this task
  const toolStats = await prisma.telemetryEvent.groupBy({
    by: ['tool'],
    where: { task: config.task },
    _count: true,
    _avg: { latencyMs: true, costUsd: true },
    orderBy: { _count: { tool: 'desc' } },
    take: 30,
  });

  // Get success counts for each tool
  const toolSlugs = toolStats.map((t) => t.tool);
  const successCounts = await Promise.all(
    toolSlugs.map((slug) =>
      prisma.telemetryEvent.count({
        where: { tool: slug, task: config.task, success: true },
      })
    )
  );

  // Get agent count per task
  const agentGroups = await prisma.telemetryEvent.groupBy({
    by: ['agentId'],
    where: { task: config.task },
  });
  const totalAgents = agentGroups.length;
  const totalEvents = toolStats.reduce((sum, t) => sum + t._count, 0);

  // Resolve tool slugs to product names
  const products = await prisma.product.findMany({
    where: { slug: { in: toolSlugs } },
    select: { slug: true, name: true, weightedScore: true },
  });
  const slugToProduct = new Map(products.map((p) => [p.slug, p]));

  const rows = toolStats.map((t, i) => {
    const product = slugToProduct.get(t.tool);
    const sr = t._count > 0 ? (successCounts[i] / t._count) * 100 : null;
    return {
      tool: product?.name ?? t.tool,
      slug: t.tool,
      count: t._count,
      successRate: sr != null ? sr.toFixed(1) : '—',
      avgLatency: t._avg.latencyMs != null ? `${Math.round(t._avg.latencyMs)}ms` : '—',
      avgCost: t._avg.costUsd != null ? `$${t._avg.costUsd.toFixed(4)}` : '—',
      agentScore: product ? product.weightedScore.toFixed(1) : '—',
      sufficient: t._count >= 50,
    };
  });

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="sticky top-0 z-50 border-b border-border-default bg-bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[840px] items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-button-primary-bg font-mono text-sm font-bold text-white">
              ⬡
            </div>
            <span className="text-[17px] font-bold tracking-tight text-text-primary">agentpick</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/benchmarks" className="text-sm font-medium text-text-muted hover:text-text-primary">All Benchmarks</Link>
            <Link href="/" className="text-sm font-medium text-text-muted hover:text-text-primary">Home</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          Best Tools for {config.label}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Benchmarked by {fmt(totalAgents)} agents across {fmt(totalEvents)} {config.label.toLowerCase()} operations
        </p>

        {rows.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border-default bg-white p-8 text-center">
            <p className="text-sm text-text-muted">No telemetry data for this task yet.</p>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default bg-bg-muted">
                  <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">Tool</th>
                  <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Success</th>
                  <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Latency</th>
                  <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Cost/call</th>
                  <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Score</th>
                  <th className="px-5 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Events</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.slug} className={`border-b border-border-default last:border-0 ${!row.sufficient ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text-dim">{i + 1}.</span>
                        <Link href={`/products/${row.slug}`} className="text-sm font-[650] text-text-primary hover:underline">
                          {row.tool}
                        </Link>
                        {!row.sufficient && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[8px] uppercase text-amber-600">
                            Low data
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-text-primary">{row.successRate}%</td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-text-primary">{row.avgLatency}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-text-primary">{row.avgCost}</td>
                    <td className="px-3 py-3 text-right font-mono text-sm font-bold text-text-primary">{row.agentScore}</td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-text-dim">{fmt(row.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
