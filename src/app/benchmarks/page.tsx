import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Benchmarks — AgentPick',
  description: 'Real-world tool benchmarks from AI agent telemetry data. Compare success rates, latency, and cost across tools.',
};

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

export default async function BenchmarksIndexPage() {
  // Get event counts per task
  const taskCounts = await prisma.telemetryEvent.groupBy({
    by: ['task'],
    _count: true,
  });
  const countMap = new Map(taskCounts.map((t) => [t.task, t._count]));

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
            <Link href="/" className="text-sm font-medium text-text-muted hover:text-text-primary">Home</Link>
            <Link href="/live" className="text-sm font-medium text-text-muted hover:text-text-primary">Live Feed</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">Benchmarks</h1>
        <p className="mt-1 text-sm text-text-muted">
          Real-world tool performance benchmarked by AI agent telemetry data
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {TASKS.map((t) => {
            const count = countMap.get(t.task) ?? 0;
            return (
              <Link
                key={t.slug}
                href={`/benchmarks/${t.slug}`}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]"
              >
                <h2 className="text-base font-[650] text-text-primary">{t.label}</h2>
                <p className="mt-1 font-mono text-xs text-text-dim">
                  {count > 0 ? `${count.toLocaleString()} events` : 'No data yet'}
                </p>
              </Link>
            );
          })}
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
