import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'AI Agent API Benchmark Report — Week of March 28, 2026 — AgentPick',
  description:
    'Weekly AI agent API benchmark results: 608 runs. Perplexity #1 (7.0), Haystack #2 (6.9), Exa #3 (6.4). Brave Search enters at #5 (5.8). 297 active agents routing through AgentPick.',
  openGraph: {
    title: 'AI Agent API Benchmark Report — March 28, 2026',
    description:
      '608 benchmark runs. 297 active agents. Brave Search enters at #5 (5.8, $0.0008/call, 2.1h news freshness advantage). Weekly rankings for AI agent developers.',
    url: 'https://agentpick.dev/reports/weekly/2026-03-28',
    images: [{ url: '/api/og?type=benchmark&cap=search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Agent API Benchmark — Week of March 28, 2026',
    description: 'Perplexity #1 (7.0), Haystack #2 (6.9), Exa #3 (6.4), Brave new #5 (5.8). 608 runs.',
    images: ['/api/og?type=benchmark&cap=search'],
  },
};

export default function WeeklyReport() {
  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-[700px] px-6 py-12">
        <nav className="mb-6 font-mono text-xs text-text-dim">
          <Link href="/" className="hover:text-text-secondary">AgentPick</Link>
          <span className="mx-2">/</span>
          <span className="hover:text-text-secondary">Reports</span>
          <span className="mx-2">/</span>
          <span>Weekly 2026-03-28</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-green-700">
              Weekly Report
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 28, 2026</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            AI Agent API Benchmark Report
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            608 benchmark runs across search, crawl, and retrieval APIs. 297 active agents routing
            through AgentPick. Updated weekly from live production data and standardized benchmark queries.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">This Week at a Glance — March 22–28, 2026</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-mono text-[22px] font-bold text-text-primary">608</div>
                  <div className="text-text-dim">Benchmark runs</div>
                </div>
                <div>
                  <div className="font-mono text-[22px] font-bold text-text-primary">2,710</div>
                  <div className="text-text-dim">Production calls</div>
                </div>
                <div>
                  <div className="font-mono text-[22px] font-bold text-text-primary">297</div>
                  <div className="text-text-dim">Active agents</div>
                </div>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Search API Rankings</h2>
            <p>
              Scores are composite quality metrics: relevance, latency, uptime, answer quality. Data
              combines router traces (40%), benchmark runs (25%), telemetry (20%), agent votes (15%).
              90-day rolling window.
            </p>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Search Rankings — Updated March 28, 2026</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Rank</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Score</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    <tr className="bg-[#F0FFF4]">
                      <td className="px-5 py-3 font-mono text-green-700">#1</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Perplexity API</td>
                      <td className="px-5 py-3 font-mono font-bold text-green-600">7.0</td>
                      <td className="px-5 py-3 font-mono text-text-dim">— stable</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#2</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Haystack</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">6.9</td>
                      <td className="px-5 py-3 font-mono text-text-dim">— stable</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#3</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Exa Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">6.4</td>
                      <td className="px-5 py-3 font-mono text-text-dim">— stable</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#4</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Tavily</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#F59E0B]">6.1</td>
                      <td className="px-5 py-3 font-mono text-text-dim">— stable</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#5</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Brave Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#F97316]">5.8</td>
                      <td className="px-5 py-3 font-mono text-green-600">▲ new entry</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">This Week: Brave Search Enters Dedicated Tracking</h2>
            <p>
              Brave Search API now has a dedicated benchmark track at AgentPick. Score: 5.8 / 10 —
              ranked 5th overall. Key finding: Brave is the cheapest search API at $0.0008/call
              (7.5x cheaper than Perplexity) and leads on news freshness with a 2.1-hour advantage
              over Tavily.
            </p>
            <p>
              Brave&apos;s independent index (not a Google/Bing reseller) gives it unique coverage
              characteristics. AgentPick now routes to Brave automatically when query intent is
              news-focused or when the <code className="rounded bg-bg-muted px-1.5 py-0.5 font-mono text-[13px]">cheapest</code> strategy is active.
            </p>
            <p>
              Full Brave benchmark analysis: <Link href="/blog/brave-search-api-for-ai-agents" className="text-[#0EA5E9] hover:underline">Brave Search API for AI Agents →</Link>
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Router Stats</h2>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="divide-y divide-[#F5F5F5]">
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-dim">Production calls (cumulative)</span>
                  <span className="font-mono font-bold text-text-primary">2,710</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-dim">Daily average</span>
                  <span className="font-mono font-bold text-text-primary">337</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-dim">Active agents</span>
                  <span className="font-mono font-bold text-text-primary">297</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-dim">Top strategy</span>
                  <span className="font-mono font-bold text-text-primary">auto</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <Link
                href="/reports/weekly/2026-03-21"
                className="font-mono text-sm text-[#0EA5E9] hover:underline"
              >
                ← March 21, 2026
              </Link>
              <Link
                href="/reports/weekly"
                className="font-mono text-sm text-text-dim hover:text-text-secondary"
              >
                All reports
              </Link>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-2 text-base font-[650] text-text-primary">Use these rankings in your agent</h3>
              <p className="mb-4 text-sm text-text-secondary">
                AgentPick routes to the highest-ranked API automatically. Free tier: 500 calls/month.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/connect"
                  className="rounded-lg bg-[#0EA5E9] px-5 py-2.5 font-mono text-sm font-semibold text-white hover:bg-[#0284C7]"
                >
                  Get API Key →
                </Link>
                <Link
                  href="/rankings/best-search-apis-for-agents"
                  className="rounded-lg border border-[#E2E8F0] px-5 py-2.5 font-mono text-sm font-semibold text-text-secondary hover:border-[#CBD5E1]"
                >
                  Full Rankings
                </Link>
              </div>
            </div>

          </div>
        </article>
      </main>
    </div>
  );
}
