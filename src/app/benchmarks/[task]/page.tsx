import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

/* ── Task-based config ────────────────────────────── */

const TASKS: Record<string, { label: string; task: string }> = {
  'web-search': { label: 'Web Search', task: 'search' },
  'web-scraping': { label: 'Web Scraping', task: 'scrape' },
  'code-execution': { label: 'Code Execution', task: 'execute' },
  'vector-search': { label: 'Vector Search', task: 'store' },
  'email-sending': { label: 'Email Sending', task: 'send_message' },
  'payment-processing': { label: 'Payment Processing', task: 'process_payment' },
  'data-query': { label: 'Data Query', task: 'query_data' },
  authentication: { label: 'Authentication', task: 'authenticate' },
  scheduling: { label: 'Scheduling', task: 'schedule' },
  inference: { label: 'AI Inference', task: 'inference' },
  monitoring: { label: 'Monitoring', task: 'monitor' },
};

/* ── Domain-based config ──────────────────────────── */

const DOMAINS: Record<string, { label: string; emoji: string }> = {
  finance: { label: 'Finance Research', emoji: '📊' },
  legal: { label: 'Legal Research', emoji: '⚖️' },
  healthcare: { label: 'Healthcare', emoji: '🏥' },
  ecommerce: { label: 'E-commerce', emoji: '🛒' },
  devtools: { label: 'DevTools', emoji: '💻' },
  education: { label: 'Education', emoji: '🎓' },
  news: { label: 'News & Media', emoji: '📰' },
  science: { label: 'Science', emoji: '🔬' },
  general: { label: 'General Purpose', emoji: '⚙️' },
  multilingual: { label: 'Multilingual', emoji: '🌍' },
};

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

/* ── Metadata ─────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ task: string }>;
}): Promise<Metadata> {
  const { task } = await params;

  if (DOMAINS[task]) {
    const d = DOMAINS[task];
    return {
      title: `Best APIs for ${d.label} Agents — AgentPick Benchmarks`,
      description: `Compare search and data APIs for ${d.label.toLowerCase()} agents. Benchmarked by AI agents with real queries.`,
    };
  }

  const config = TASKS[task];
  if (!config) return { title: 'Benchmark Not Found — AgentPick' };
  return {
    title: `Best Tools for ${config.label} — AgentPick Benchmarks`,
    description: `Compare ${config.label.toLowerCase()} tools benchmarked by AI agents. Real-world success rates, latency, and cost data.`,
  };
}

/* ── Page ─────────────────────────────────────────── */

export default async function BenchmarkPage({
  params,
}: {
  params: Promise<{ task: string }>;
}) {
  const { task: slug } = await params;

  // Domain-based benchmark page
  if (DOMAINS[slug]) {
    return <DomainBenchmarkPage domain={slug} config={DOMAINS[slug]} />;
  }

  // Task-based benchmark page
  const config = TASKS[slug];
  if (!config) notFound();
  return <TaskBenchmarkPage taskSlug={slug} config={config} />;
}

/* ════════════════════════════════════════════════════
   Domain benchmark page
   ════════════════════════════════════════════════════ */

async function DomainBenchmarkPage({
  domain,
  config,
}: {
  domain: string;
  config: { label: string; emoji: string };
}) {
  // Get benchmark runs for this domain, grouped by product
  const runs = await prisma.benchmarkRun.findMany({
    where: { domain, success: true },
    select: {
      productId: true,
      relevanceScore: true,
      freshnessScore: true,
      completenessScore: true,
      latencyMs: true,
      costUsd: true,
      product: { select: { name: true, slug: true } },
    },
  });

  // Get agents for this domain
  const agents = await prisma.benchmarkAgent.findMany({
    where: { domain },
    include: { agent: { select: { name: true } } },
  });

  // Get queries for this domain
  const queries = await prisma.benchmarkQuery.findMany({
    where: { domain, isActive: true },
    orderBy: { complexity: 'asc' },
    take: 10,
  });

  // Recent runs for replay links
  const recentRuns = await prisma.benchmarkRun.findMany({
    where: { domain, success: true, relevanceScore: { gte: 2.0 } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { product: { select: { name: true, slug: true } } },
  });

  // Batch runs for controlled comparisons
  const batchRunsRaw = await prisma.benchmarkRun.findMany({
    where: { batchId: { not: null }, domain },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      batchId: true,
      query: true,
      latencyMs: true,
      resultCount: true,
      relevanceScore: true,
      freshnessScore: true,
      completenessScore: true,
      createdAt: true,
      product: { select: { name: true, slug: true } },
    },
  });

  // Group by batchId in JS
  type BatchRun = (typeof batchRunsRaw)[number];
  const batchMap = new Map<string, BatchRun[]>();
  for (const run of batchRunsRaw) {
    const bid = run.batchId!;
    if (!batchMap.has(bid)) batchMap.set(bid, []);
    batchMap.get(bid)!.push(run);
  }
  const controlledBatches = [...batchMap.entries()].map(([batchId, bRuns]) => ({
    batchId,
    query: bRuns[0].query,
    createdAt: bRuns[0].createdAt,
    runs: [...bRuns].sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)),
  }));

  // Aggregate by product
  const productMap = new Map<
    string,
    {
      name: string;
      slug: string;
      totalRelevance: number;
      totalFreshness: number;
      totalCompleteness: number;
      totalLatency: number;
      totalCost: number;
      count: number;
    }
  >();

  for (const run of runs) {
    const key = run.productId;
    const existing = productMap.get(key) ?? {
      name: run.product.name,
      slug: run.product.slug,
      totalRelevance: 0,
      totalFreshness: 0,
      totalCompleteness: 0,
      totalLatency: 0,
      totalCost: 0,
      count: 0,
    };
    existing.totalRelevance += run.relevanceScore ?? 0;
    existing.totalFreshness += run.freshnessScore ?? 0;
    existing.totalCompleteness += run.completenessScore ?? 0;
    existing.totalLatency += run.latencyMs;
    existing.totalCost += run.costUsd ?? 0;
    existing.count++;
    productMap.set(key, existing);
  }

  const rankings = [...productMap.values()]
    .map((p) => ({
      ...p,
      avgRelevance: p.count > 0 ? p.totalRelevance / p.count : 0,
      avgFreshness: p.count > 0 ? p.totalFreshness / p.count : 0,
      avgCompleteness: p.count > 0 ? p.totalCompleteness / p.count : 0,
      avgLatency: p.count > 0 ? Math.round(p.totalLatency / p.count) : 0,
      avgCost: p.count > 0 ? p.totalCost / p.count : 0,
    }))
    .sort((a, b) => b.avgRelevance - a.avgRelevance);

  const modelFamilies = new Set(agents.map((a) => a.modelProvider));

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
          <nav className="flex items-center gap-4">
            <Link
              href="/benchmarks"
              className="text-sm font-medium text-text-muted hover:text-text-primary"
            >
              All Benchmarks
            </Link>
            <Link
              href={`/playground?domain=${domain}`}
              className="rounded-lg bg-button-primary-bg px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              Test {config.label}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          {config.emoji} Best APIs for {config.label} Agents
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Tested by {agents.length} benchmark agents · {modelFamilies.size} model families ·{' '}
          {runs.length.toLocaleString()} tests
        </p>

        {/* Controlled Comparisons (batch data) */}
        {controlledBatches.length > 0 && (
          <section className="mt-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[1px] text-text-dim">
              Controlled Comparisons
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Same query, all tools tested simultaneously for a fair comparison.
            </p>
            <div className="mt-3 space-y-3">
              {controlledBatches.map((batch) => (
                <details
                  key={batch.batchId}
                  className="rounded-xl border border-[#E2E8F0] bg-white"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-bg-muted">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-text-dim">
                        {batch.batchId.slice(0, 8)}…
                      </span>
                      <span className="max-w-[340px] truncate text-sm text-text-primary">
                        &ldquo;{batch.query}&rdquo;
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[11px] text-text-dim">
                        {batch.runs.length} tools
                      </span>
                      <span className="font-mono text-[11px] text-text-dim">
                        {new Date(batch.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-xs text-text-dim">▼</span>
                    </div>
                  </summary>
                  <div className="border-t border-border-default overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-bg-muted">
                          <th className="px-4 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">
                            Tool
                          </th>
                          <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                            Relevance
                          </th>
                          <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                            Freshness
                          </th>
                          <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                            Completeness
                          </th>
                          <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                            Latency
                          </th>
                          <th className="px-4 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                            Results
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {batch.runs.map((run) => (
                          <tr
                            key={run.id}
                            className="border-t border-border-default"
                          >
                            <td className="px-4 py-2">
                              <Link
                                href={`/products/${run.product.slug}`}
                                className="text-sm font-[650] text-text-primary hover:underline"
                              >
                                {run.product.name}
                              </Link>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-sm font-semibold text-text-primary">
                              {run.relevanceScore != null ? `${run.relevanceScore.toFixed(1)}/5` : '—'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-sm text-text-primary">
                              {run.freshnessScore != null ? `${run.freshnessScore.toFixed(1)}/5` : '—'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-sm text-text-primary">
                              {run.completenessScore != null ? `${run.completenessScore.toFixed(1)}/5` : '—'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-sm text-text-primary">
                              {run.latencyMs}ms
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-sm text-text-dim">
                              {run.resultCount ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Rankings table */}
        {rankings.length > 0 ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default bg-bg-muted">
                  <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    Tool
                  </th>
                  <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    Relevance
                  </th>
                  <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    Freshness
                  </th>
                  <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    Speed
                  </th>
                  <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    Cost
                  </th>
                  <th className="px-5 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    Tests
                  </th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r, i) => (
                  <tr
                    key={r.slug}
                    className="border-b border-border-default last:border-0"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text-dim">{i + 1}.</span>
                        <Link
                          href={`/products/${r.slug}`}
                          className="text-sm font-[650] text-text-primary hover:underline"
                        >
                          {r.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm font-semibold text-text-primary">
                      {r.avgRelevance.toFixed(1)}/5
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-text-primary">
                      {r.avgFreshness.toFixed(1)}/5
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-text-primary">
                      {r.avgLatency}ms
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-text-primary">
                      ${r.avgCost.toFixed(4)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-text-dim">
                      {fmt(r.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-border-default bg-white p-8 text-center">
            <p className="text-sm text-text-muted">
              No benchmark data for {config.label} yet. Benchmarks run every 2 hours.
            </p>
          </div>
        )}

        {/* Quick insights */}
        {rankings.length >= 2 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-3">
              <div className="font-mono text-[10px] uppercase text-text-dim">Best for accuracy</div>
              <div className="mt-1 text-sm font-semibold text-text-primary">
                {rankings[0].name}
              </div>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-3">
              <div className="font-mono text-[10px] uppercase text-text-dim">Best for speed</div>
              <div className="mt-1 text-sm font-semibold text-text-primary">
                {[...rankings].sort((a, b) => a.avgLatency - b.avgLatency)[0].name}
              </div>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-3">
              <div className="font-mono text-[10px] uppercase text-text-dim">Best value</div>
              <div className="mt-1 text-sm font-semibold text-text-primary">
                {[...rankings].sort((a, b) => a.avgCost - b.avgCost)[0].name}
              </div>
            </div>
          </div>
        )}

        {/* Sample queries */}
        {queries.length > 0 && (
          <section className="mt-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[1px] text-text-dim">
              Sample Queries ({queries.length})
            </h2>
            <div className="mt-3 space-y-1.5">
              {queries.slice(0, 6).map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between rounded-lg bg-white px-4 py-2 text-sm"
                >
                  <span className="text-text-primary">&ldquo;{q.query}&rdquo;</span>
                  <span className="rounded bg-bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-dim">
                    {q.complexity}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent replay links */}
        {recentRuns.length > 0 && (
          <section className="mt-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[1px] text-text-dim">
              Recent Tests — Watch Replay
            </h2>
            <div className="mt-3 space-y-2">
              {recentRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/replay/${run.id}`}
                  className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs">🔬</span>
                    <span className="text-sm font-medium text-text-primary">
                      {run.product.name}
                    </span>
                    <span className="max-w-[200px] truncate font-mono text-[11px] text-text-dim">
                      {run.query}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {run.relevanceScore != null && (
                      <span className="font-mono text-[11px] font-semibold text-text-primary">
                        {run.relevanceScore.toFixed(1)}/5
                      </span>
                    )}
                    <span className="text-xs text-button-primary-bg">▶ Watch</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/playground?domain=${domain}`}
            className="rounded-lg bg-button-primary-bg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            🧪 Run your own {config.label} test
          </Link>
          <Link
            href="/benchmarks"
            className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-text-secondary hover:border-border-hover hover:text-text-primary"
          >
            View all benchmarks
          </Link>
        </div>
      </main>

      <footer className="border-t border-border-default py-6">
        <p className="text-center font-mono text-xs text-text-dim">
          agentpick.dev — ranked by machines, built for builders
        </p>
      </footer>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Task benchmark page (original)
   ════════════════════════════════════════════════════ */

async function TaskBenchmarkPage({
  taskSlug,
  config,
}: {
  taskSlug: string;
  config: { label: string; task: string };
}) {
  const toolStats = await prisma.telemetryEvent.groupBy({
    by: ['tool'],
    where: { task: config.task },
    _count: true,
    _avg: { latencyMs: true, costUsd: true },
    orderBy: { _count: { tool: 'desc' } },
    take: 30,
  });

  const toolSlugs = toolStats.map((t) => t.tool);
  const successCounts = await Promise.all(
    toolSlugs.map((slug) =>
      prisma.telemetryEvent.count({
        where: { tool: slug, task: config.task, success: true },
      }),
    ),
  );

  const agentGroups = await prisma.telemetryEvent.groupBy({
    by: ['agentId'],
    where: { task: config.task },
  });
  const totalAgents = agentGroups.length;
  const totalEvents = toolStats.reduce((sum, t) => sum + t._count, 0);

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
      avgLatency:
        t._avg.latencyMs != null ? `${Math.round(t._avg.latencyMs)}ms` : '—',
      avgCost:
        t._avg.costUsd != null ? `$${t._avg.costUsd.toFixed(4)}` : '—',
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
            <span className="text-[17px] font-bold tracking-tight text-text-primary">
              agentpick
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/benchmarks"
              className="text-sm font-medium text-text-muted hover:text-text-primary"
            >
              All Benchmarks
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-text-muted hover:text-text-primary"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          Best Tools for {config.label}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Benchmarked by {fmt(totalAgents)} agents across{' '}
          {fmt(totalEvents)} {config.label.toLowerCase()} operations
        </p>

        {rows.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border-default bg-white p-8 text-center">
            <p className="text-sm text-text-muted">
              No telemetry data for this task yet.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default bg-bg-muted">
                  <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    Tool
                  </th>
                  <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    Success
                  </th>
                  <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    Latency
                  </th>
                  <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    Cost/call
                  </th>
                  <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    Score
                  </th>
                  <th className="px-5 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">
                    Events
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.slug}
                    className={`border-b border-border-default last:border-0 ${!row.sufficient ? 'opacity-60' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text-dim">
                          {i + 1}.
                        </span>
                        <Link
                          href={`/products/${row.slug}`}
                          className="text-sm font-[650] text-text-primary hover:underline"
                        >
                          {row.tool}
                        </Link>
                        {!row.sufficient && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[8px] uppercase text-amber-600">
                            Low data
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-text-primary">
                      {row.successRate}%
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-text-primary">
                      {row.avgLatency}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-text-primary">
                      {row.avgCost}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm font-bold text-text-primary">
                      {row.agentScore}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-text-dim">
                      {fmt(row.count)}
                    </td>
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
