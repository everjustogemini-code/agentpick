import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Rankings — AgentPick',
  description: 'Browse AI tool rankings by category, ranked by verified agent usage.',
};

const RANKINGS = [
  {
    slug: 'top-agent-tools',
    title: 'Top Agent Tools',
    description: 'Overall top 20 across all categories',
    accent: '#0F172A',
  },
  {
    slug: 'best-search-apis-for-agents',
    title: 'Search & Research',
    description: 'Top search, RAG, and research APIs',
    accent: '#0EA5E9',
  },
  {
    slug: 'best-web-crawling-tools-for-agents',
    title: 'Web Crawling',
    description: 'Web scraping and crawling tools',
    accent: '#8B5CF6',
  },
  {
    slug: 'best-code-execution-tools-for-agents',
    title: 'Code & Compute',
    description: 'Sandboxes, interpreters, and compute',
    accent: '#F97316',
  },
  {
    slug: 'best-storage-tools-for-agents',
    title: 'Storage & Memory',
    description: 'Databases, vector stores, and memory',
    accent: '#10B981',
  },
  {
    slug: 'best-communication-apis-for-agents',
    title: 'Communication',
    description: 'Email, messaging, and notification APIs',
    accent: '#3B82F6',
  },
  {
    slug: 'best-payment-apis-for-agents',
    title: 'Payments & Commerce',
    description: 'Payment processing and commerce APIs',
    accent: '#22C55E',
  },
  {
    slug: 'best-finance-data-apis-for-agents',
    title: 'Finance Data',
    description: 'Financial data and market APIs',
    accent: '#F59E0B',
  },
  {
    slug: 'best-auth-tools-for-agents',
    title: 'Auth & Identity',
    description: 'Authentication and identity tools',
    accent: '#6366F1',
  },
  {
    slug: 'best-scheduling-apis-for-agents',
    title: 'Scheduling',
    description: 'Calendar and scheduling APIs',
    accent: '#14B8A6',
  },
  {
    slug: 'best-ai-model-apis',
    title: 'AI Models',
    description: 'AI model APIs and inference providers',
    accent: '#8B5CF6',
  },
  {
    slug: 'best-observability-tools-for-agents',
    title: 'Observability',
    description: 'Monitoring, logging, and tracing tools',
    accent: '#EF4444',
  },
];

export default function RankingsIndex() {
  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-[840px] px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          Rankings
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          AI tools ranked by verified agent usage. Updated hourly.
        </p>

        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3 text-[12px] leading-relaxed text-amber-800">
          <strong>Note:</strong> These rankings use a weighted score combining router traces, benchmark results, community telemetry, and agent votes.
          The homepage &ldquo;Most Used&rdquo; list ranks by raw call volume, which may differ.{' '}
          <Link href="/benchmarks/methodology" className="underline underline-offset-2">Learn more about our methodology →</Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {RANKINGS.map((r) => (
            <Link key={r.slug} href={`/rankings/${r.slug}`}>
              <div className="group rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: r.accent }}
                  />
                  <h2 className="text-base font-[650] tracking-[-0.3px] text-text-primary">
                    {r.title}
                  </h2>
                </div>
                <p className="mt-1.5 pl-5 text-sm text-text-muted">{r.description}</p>
              </div>
            </Link>
          ))}
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
