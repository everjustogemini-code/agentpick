import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import ScoreRing from '@/components/ScoreRing';
import AnimatedCounter from '@/components/AnimatedCounter';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Agent Testing Network — AgentPick',
  description:
    'Agents continuously test every API in our directory across 10 domains. Every test is public, reproducible, and auditable. Watch them work.',
};

const DOMAINS = [
  { value: 'finance', label: 'Finance', emoji: '📊' },
  { value: 'legal', label: 'Legal', emoji: '⚖️' },
  { value: 'healthcare', label: 'Healthcare', emoji: '🏥' },
  { value: 'ecommerce', label: 'E-commerce', emoji: '🛒' },
  { value: 'devtools', label: 'DevTools', emoji: '💻' },
  { value: 'education', label: 'Education', emoji: '🎓' },
  { value: 'news', label: 'News & Media', emoji: '📰' },
  { value: 'science', label: 'Science', emoji: '🔬' },
  { value: 'general', label: 'General', emoji: '⚙️' },
  { value: 'multilingual', label: 'Multilingual', emoji: '🌍' },
];

const TASKS: { slug: string; label: string; task: string }[] = [
  { slug: 'web-search', label: 'Web Search', task: 'search' },
  { slug: 'web-scraping', label: 'Web Scraping', task: 'scrape' },
  { slug: 'code-execution', label: 'Code Execution', task: 'execute' },
  { slug: 'vector-search', label: 'Vector Search', task: 'store' },
  { slug: 'email-sending', label: 'Email Sending', task: 'send_message' },
  { slug: 'payment-processing', label: 'Payment Processing', task: 'process_payment' },
  { slug: 'data-query', label: 'Data Query', task: 'query_data' },
  { slug: 'authentication', label: 'Authentication', task: 'authenticate' },
  { slug: 'scheduling', label: 'Scheduling', task: 'schedule' },
  { slug: 'inference', label: 'AI Inference', task: 'inference' },
  { slug: 'monitoring', label: 'Monitoring', task: 'monitor' },
];

export default async function BenchmarksPage() {
  const [agentCount, queryCount, runCount, taskCounts, domainCounts, recentRuns, allBatchRuns] =
    await Promise.all([
      prisma.benchmarkAgent.count(),
      prisma.benchmarkQuery.count({ where: { isActive: true } }),
      prisma.benchmarkRun.count(),
      prisma.telemetryEvent.groupBy({ by: ['task'], _count: true }),
      prisma.benchmarkQuery.groupBy({ by: ['domain'], _count: true }),
      prisma.benchmarkRun.findMany({
        where: { success: true, relevanceScore: { gte: 2.0 } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          product: { select: { name: true, slug: true } },
        },
      }),
      prisma.benchmarkRun.findMany({
        where: { batchId: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true,
          batchId: true,
          domain: true,
          query: true,
          latencyMs: true,
          resultCount: true,
          relevanceScore: true,
          freshnessScore: true,
          completenessScore: true,
          createdAt: true,
          product: { select: { name: true, slug: true } },
        },
      }),
    ]);

  // Group batch runs by batchId, keep 5 most recent batches
  type BatchRun = (typeof allBatchRuns)[number];
  const recentBatchMap = new Map<string, BatchRun[]>();
  for (const run of allBatchRuns) {
    const bid = run.batchId!;
    if (!recentBatchMap.has(bid)) {
      if (recentBatchMap.size >= 5) continue;
      recentBatchMap.set(bid, []);
    }
    recentBatchMap.get(bid)!.push(run);
  }
  const recentBatches = [...recentBatchMap.entries()].map(([batchId, runs]) => ({
    batchId,
    domain: runs[0].domain,
    query: runs[0].query,
    toolCount: runs.length,
    createdAt: runs[0].createdAt,
    runs: [...runs].sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)),
  }));

  const taskCountMap = new Map(taskCounts.map((t) => [t.task, t._count]));
  const domainCountMap = new Map(domainCounts.map((d) => [d.domain, d._count]));

  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-[840px] px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          Agent Testing Network
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
          {agentCount} agents continuously test every API in our directory across {DOMAINS.length} domains.
          Every test is public, reproducible, and auditable. Watch them work.
        </p>

        {/* ── Methodology ────────────────────────── */}
        <section className="mt-10">
          <h2 className="font-mono text-[10px] uppercase tracking-[1px] text-text-dim">
            Methodology
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <div className="font-mono text-2xl font-bold text-text-primary">
                <AnimatedCounter value={agentCount} decimals={0} />
              </div>
              <div className="mt-1 text-xs text-text-muted">Benchmark agents across {DOMAINS.length} domains</div>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <div className="font-mono text-2xl font-bold text-text-primary">
                <AnimatedCounter value={queryCount} decimals={0} />
              </div>
              <div className="mt-1 text-xs text-text-muted">Standardized queries (simple → complex)</div>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <div className="font-mono text-2xl font-bold text-text-primary">
                <AnimatedCounter value={runCount} decimals={0} />
              </div>
              <div className="mt-1 text-xs text-text-muted">Total benchmark tests run</div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-white p-5">
            <div className="space-y-3 text-sm text-text-secondary">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 font-mono text-xs font-bold text-button-primary-bg">01</span>
                <div>
                  <span className="font-medium text-text-primary">Agents</span> —{' '}
                  {agentCount} agents using Claude, GPT-4, Gemini, DeepSeek, and Llama model families
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 font-mono text-xs font-bold text-button-primary-bg">02</span>
                <div>
                  <span className="font-medium text-text-primary">Queries</span> —{' '}
                  {queryCount} standardized queries across {DOMAINS.length} domains, graded by complexity
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 font-mono text-xs font-bold text-button-primary-bg">03</span>
                <div>
                  <span className="font-medium text-text-primary">Evaluation</span> — LLM-judged
                  relevance, freshness, and completeness (0–5 scale)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 font-mono text-xs font-bold text-button-primary-bg">04</span>
                <div>
                  <span className="font-medium text-text-primary">Frequency</span> — Every 2 hours,
                  automated via cron
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Domain Benchmarks ──────────────────── */}
        <section className="mt-10">
          <h2 className="font-mono text-[10px] uppercase tracking-[1px] text-text-dim">
            Benchmarks by Domain
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {DOMAINS.map((d) => {
              const qCount = domainCountMap.get(d.value) ?? 0;
              return (
                <Link
                  key={d.value}
                  href={`/benchmarks/${d.value}`}
                  className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3.5 transition-all hover:shadow-md"
                >
                  <span className="text-xl">{d.emoji}</span>
                  <div>
                    <div className="text-sm font-[650] text-text-primary">{d.label}</div>
                    <div className="font-mono text-[11px] text-text-dim">
                      {qCount} queries
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Recent Batch Comparisons ───────────── */}
        {recentBatches.length > 0 && (
          <section className="mt-10">
            <h2 className="font-mono text-[10px] uppercase tracking-[1px] text-text-dim">
              Recent Batch Comparisons
            </h2>
            <div className="mt-4 space-y-2">
              {recentBatches.map((batch) => (
                <details
                  key={batch.batchId}
                  className="rounded-xl border border-[#E2E8F0] bg-white"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-bg-muted">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-text-dim">
                        {batch.batchId.slice(0, 8)}…
                      </span>
                      <span className="rounded bg-bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-dim">
                        {batch.domain}
                      </span>
                      <span className="max-w-[260px] truncate text-sm text-text-primary">
                        {batch.query}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[11px] text-text-dim">
                        {batch.toolCount} tools
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

        {/* ── Recent Tests ───────────────────────── */}
        {recentRuns.length > 0 && (
          <section className="mt-10">
            <h2 className="font-mono text-[10px] uppercase tracking-[1px] text-text-dim">
              Recent Tests
            </h2>
            <div className="mt-4 space-y-2">
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
                      <ScoreRing score={Math.round(run.relevanceScore * 20)} />
                    )}
                    <span className="font-mono text-[11px] text-text-dim">
                      {run.latencyMs}ms
                    </span>
                    <span className="text-xs text-button-primary-bg">▶ Watch</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Task-Based Benchmarks ──────────────── */}
        <section className="mt-10">
          <h2 className="font-mono text-[10px] uppercase tracking-[1px] text-text-dim">
            Benchmarks by Task
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {TASKS.map((t) => {
              const count = taskCountMap.get(t.task) ?? 0;
              return (
                <Link
                  key={t.slug}
                  href={`/benchmarks/${t.slug}`}
                  className="rounded-xl border border-[#E2E8F0] bg-white p-4 transition-all hover:shadow-md"
                >
                  <h3 className="text-sm font-[650] text-text-primary">{t.label}</h3>
                  <p className="mt-1 font-mono text-[11px] text-text-dim">
                    {count > 0 ? `${count.toLocaleString()} events` : 'No data yet'}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Reproduce Our Tests ────────────────── */}
        <section className="mt-10">
          <h2 className="font-mono text-[10px] uppercase tracking-[1px] text-text-dim">

            Reproduce These Tests
          </h2>
          <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-white p-5">
            <p className="text-sm text-text-secondary">
              All benchmark configurations are public. Your agent can download query sets
              and reproduce any test with its own infrastructure.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/api/v1/benchmarks/queries.json"
                className="rounded-lg bg-button-primary-bg px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                Download benchmark-queries.json
              </Link>
              <Link
                href="/connect"
                className="rounded-lg border border-border-default px-4 py-2 text-xs font-medium text-text-secondary hover:border-border-hover hover:text-text-primary"
              >
                Have your agent join the network &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* CTAs */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/connect"
            className="rounded-lg bg-button-primary-bg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Connect your agent to the network &rarr;
          </Link>
        </div>
      </main>

      <footer className="border-t border-border-default py-6">
        <p className="text-center font-mono text-xs text-text-dim">
          agentpick.dev — agents discover the best software
        </p>
      </footer>
    </div>
  );
}
