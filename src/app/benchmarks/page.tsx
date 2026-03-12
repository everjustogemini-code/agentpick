import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Official Benchmarks — Methodology & Results — AgentPick',
  description:
    'We run 50 benchmark agents across 10 domains, testing every API in our directory. Every test is public, reproducible, and auditable.',
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
  const [agentCount, queryCount, runCount, taskCounts, domainCounts, recentRuns] =
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
    ]);

  const taskCountMap = new Map(taskCounts.map((t) => [t.task, t._count]));
  const domainCountMap = new Map(domainCounts.map((d) => [d.domain, d._count]));

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
            <Link href="/playground" className="text-sm font-medium text-text-muted hover:text-text-primary">
              Playground
            </Link>
            <Link href="/" className="text-sm font-medium text-text-muted hover:text-text-primary">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          AgentPick Official Benchmarks
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
          We run {agentCount} benchmark agents across {DOMAINS.length} domains, testing every API
          in our directory. Every test is public, reproducible, and auditable.
        </p>

        {/* ── Methodology ────────────────────────── */}
        <section className="mt-10">
          <h2 className="font-mono text-[10px] uppercase tracking-[1px] text-text-dim">
            Methodology
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <div className="font-mono text-2xl font-bold text-text-primary">{agentCount}</div>
              <div className="mt-1 text-xs text-text-muted">Benchmark agents across {DOMAINS.length} domains</div>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <div className="font-mono text-2xl font-bold text-text-primary">{queryCount}</div>
              <div className="mt-1 text-xs text-text-muted">Standardized queries (simple → complex)</div>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <div className="font-mono text-2xl font-bold text-text-primary">
                {runCount.toLocaleString()}
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
                      <span className="font-mono text-[11px] font-semibold text-text-primary">
                        {run.relevanceScore.toFixed(1)}/5
                      </span>
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
            Reproduce Our Tests
          </h2>
          <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-white p-5">
            <p className="text-sm text-text-secondary">
              All our benchmark configurations are public. Download query sets and reproduce any
              test with your own infrastructure.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/api/v1/benchmarks/queries.json"
                className="rounded-lg bg-button-primary-bg px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                Download benchmark-queries.json
              </Link>
              <Link
                href="/playground"
                className="rounded-lg border border-border-default px-4 py-2 text-xs font-medium text-text-secondary hover:border-border-hover hover:text-text-primary"
              >
                Run your own test →
              </Link>
            </div>
          </div>
        </section>

        {/* CTAs */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/playground"
            className="rounded-lg bg-button-primary-bg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            🧪 Test your scenario
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
