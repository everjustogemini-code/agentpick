import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'AI Agent API Benchmark Report — Week of May 23, 2026 — AgentPick',
  description:
    'Weekly AI agent API benchmark results: 700+ runs across search, crawl, and retrieval APIs. Perplexity #1 at 7.0, Haystack #2 at 6.9, Exa #3 at 6.4. 314 active agents routing 399 calls/day.',
  openGraph: {
    title: 'AI Agent API Benchmark Report — May 23, 2026',
    description:
      '700+ benchmark runs. 314 active agents. Perplexity API #1 (7.0), Haystack #2 (6.9), Exa #3 (6.4). Valyu and Parallel entering confirmed-score window. Weekly rankings for AI agent developers.',
    url: 'https://agentpick.dev/reports/weekly/2026-05-23',
    images: [{ url: '/api/og?type=benchmark&cap=search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Agent API Benchmark — Week of May 23, 2026',
    description: 'Perplexity #1 (7.0), Haystack #2 (6.9), Exa #3 (6.4). 700+ runs. 314 agents.',
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
          <span>Weekly 2026-05-23</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-green-700">
              Weekly Report
            </span>
            <span className="font-mono text-[11px] text-text-dim">May 23, 2026</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            AI Agent API Benchmark Report
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            700+ benchmark runs across search, crawl, and retrieval APIs. 314 active agents routing
            calls through AgentPick. Updated weekly from live production data and standardized
            benchmark queries.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            {/* Summary card */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">This Week at a Glance — May 17–23, 2026</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-mono text-[22px] font-bold text-text-primary">700+</div>
                  <div className="text-text-dim">Benchmark runs</div>
                </div>
                <div>
                  <div className="font-mono text-[22px] font-bold text-text-primary">5,250+</div>
                  <div className="text-text-dim">Production calls</div>
                </div>
                <div>
                  <div className="font-mono text-[22px] font-bold text-text-primary">314</div>
                  <div className="text-text-dim">Active agents</div>
                </div>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Search API Rankings</h2>
            <p>
              Rankings are composite quality scores weighted across relevance, latency, uptime, and
              answer quality. Data combines router traces (40%), benchmark runs (25%), telemetry (20%),
              and agent votes (15%). 90-day rolling window.
            </p>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Search Rankings — Updated May 23, 2026</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Rank</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Score</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">vs Last Week</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    <tr className="bg-[#F0FFF4]">
                      <td className="px-5 py-3 font-mono text-green-700">#1 ★</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Perplexity API</td>
                      <td className="px-5 py-3 font-mono font-bold text-green-600">7.0</td>
                      <td className="px-5 py-3 font-mono text-text-dim">— stable (wk 11)</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#2</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Haystack</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">6.9</td>
                      <td className="px-5 py-3 font-mono text-text-dim">— stable (wk 11)</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#3</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Exa Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">6.4</td>
                      <td className="px-5 py-3 font-mono text-text-dim">— stable (wk 11)</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#4</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Tavily</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#F59E0B]">6.1</td>
                      <td className="px-5 py-3 font-mono text-text-dim">— stable (wk 11)</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#5</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Brave Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#F97316]">5.8</td>
                      <td className="px-5 py-3 font-mono text-text-dim">— stable (wk 11)</td>
                    </tr>
                    <tr className="bg-[#FFFBEB]">
                      <td className="px-5 py-3 font-mono text-[#F59E0B]">–</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Valyu Search</td>
                      <td className="px-5 py-3 font-mono text-[#F59E0B]">evaluating</td>
                      <td className="px-5 py-3 font-mono text-[#F59E0B]">evaluating (wk 7)</td>
                    </tr>
                    <tr className="bg-[#F0F9FF]">
                      <td className="px-5 py-3 font-mono text-[#0EA5E9]">–</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Parallel Search</td>
                      <td className="px-5 py-3 font-mono text-[#0EA5E9]">evaluating</td>
                      <td className="px-5 py-3 font-mono text-text-dim">evaluating (wk 8)</td>
                    </tr>
                    <tr className="bg-[#FFF7F0]">
                      <td className="px-5 py-3 font-mono text-[#F97316]">–</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Firecrawl</td>
                      <td className="px-5 py-3 font-mono text-[#F97316]">evaluating</td>
                      <td className="px-5 py-3 font-mono text-[#F97316]">evaluating (wk 4)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Crawl API Rankings</h2>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Crawl Rankings — Updated May 23, 2026</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Rank</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Score</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Best for</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    <tr className="bg-[#F0FFF4]">
                      <td className="px-5 py-3 font-mono text-green-700">#1 ★</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Jina AI</td>
                      <td className="px-5 py-3 font-mono font-bold text-green-600">5.2</td>
                      <td className="px-5 py-3 text-text-dim">Crawl quality, LLM-ready output</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#2</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Unstructured</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">5.1</td>
                      <td className="px-5 py-3 text-text-dim">51% faster, document parsing</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#3</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Apify</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">5.0</td>
                      <td className="px-5 py-3 text-text-dim">52% faster, large-scale scraping</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#4</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Browserless</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#F59E0B]">4.83</td>
                      <td className="px-5 py-3 text-text-dim">58% faster, headless browser tasks</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">This Week&apos;s Highlights</h2>

            <div className="space-y-4">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-dim">Stable</span>
                </div>
                <h3 className="mb-1 text-sm font-[650] text-text-primary">Top 5 rankings stable — 11 consecutive weeks</h3>
                <p className="text-sm text-text-secondary">
                  Perplexity (7.0), Haystack (6.9), Exa (6.4), Tavily (6.1), and Brave (5.8) have held
                  positions for 11 consecutive weeks. At 700+ benchmark runs, statistical confidence is
                  high. These rankings represent the most durable signal in the market for search API
                  selection.
                </p>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#0EA5E9]">Growth</span>
                </div>
                <h3 className="mb-1 text-sm font-[650] text-text-primary">314 active agents — 5,250+ cumulative calls</h3>
                <p className="text-sm text-text-secondary">
                  Registered agents reached 314 this week. Cumulative production routing calls crossed
                  5,250. Daily throughput remains at 399 calls/day — sustained from the 27% WoW jump
                  the prior week. The combination of stable rankings and rising call volume reflects
                  growing developer trust in auto-routing.
                </p>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">Evaluation</span>
                </div>
                <h3 className="mb-1 text-sm font-[650] text-text-primary">Valyu (wk 7) and Parallel Search (wk 8) — confirmed scores imminent</h3>
                <p className="text-sm text-text-secondary">
                  Both Valyu Search (week 7) and Parallel Search (week 8) are now within the
                  confirmed-score window. The next 1–2 cycles should yield final rankings for both.
                  Valyu&apos;s structured LLM-ready output and Parallel&apos;s semantic compression
                  approach each address different use cases from the top 5.{' '}
                  <Link href="/blog/valyu-search-api-for-ai-agents" className="text-[#0EA5E9] hover:underline">
                    Read the Valyu deep-dive
                  </Link>.
                </p>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F97316]">Crawl</span>
                </div>
                <h3 className="mb-1 text-sm font-[650] text-text-primary">Firecrawl crawl evaluation enters week 4 — score expected next cycle</h3>
                <p className="text-sm text-text-secondary">
                  Firecrawl (week 4) is on track for a confirmed crawl score next cycle. Its
                  JavaScript rendering advantage over Jina AI on SPA-heavy sites has held up across
                  evaluation runs. A final placement between #1 and #3 is expected.{' '}
                  <Link href="/blog/firecrawl-for-ai-agents" className="text-[#0EA5E9] hover:underline">
                    Read the Firecrawl benchmark breakdown
                  </Link>.
                </p>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Router Stats</h2>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Week of May 17–23, 2026</h3>
              </div>
              <div className="divide-y divide-[#F5F5F5]">
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-dim">Total routed calls</span>
                  <span className="font-mono font-bold text-text-primary">5,250+</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-dim">Daily average</span>
                  <span className="font-mono font-bold text-text-primary">399</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-dim">Top strategy</span>
                  <span className="font-mono font-bold text-text-primary">auto</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-dim">Top routed tool</span>
                  <span className="font-mono font-bold text-text-primary">Perplexity API</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-dim">Active agents</span>
                  <span className="font-mono font-bold text-text-primary">314</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-dim">Benchmark runs (total)</span>
                  <span className="font-mono font-bold text-text-primary">700+</span>
                </div>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Methodology</h2>
            <p>
              AgentPick benchmarks are continuous — not one-time snapshots. Benchmark agents run
              standardized queries 24/7 across all tracked APIs. Scores combine four data sources:
            </p>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-4">40%</span>
                <span>Router traces — real production call outcomes</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-4">25%</span>
                <span>Benchmark runs — standardized query suites</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-4">20%</span>
                <span>Telemetry — latency, uptime, error rates</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-4">15%</span>
                <span>Agent votes — developer satisfaction signals</span>
              </li>
            </ul>
            <p>
              Full methodology: <Link href="/benchmarks/methodology" className="text-[#0EA5E9] hover:underline">/benchmarks/methodology</Link>
            </p>

            {/* Navigation between reports */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <Link
                href="/reports/weekly/2026-05-16"
                className="font-mono text-sm text-[#0EA5E9] hover:underline"
              >
                ← May 16, 2026
              </Link>
              <Link
                href="/reports/weekly"
                className="font-mono text-sm text-text-dim hover:text-text-secondary"
              >
                All reports
              </Link>
            </div>

            {/* CTA */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-2 text-base font-[650] text-text-primary">Use these rankings in your agent</h3>
              <p className="mb-4 text-sm text-text-secondary">
                AgentPick routes to the highest-ranked API automatically. Free tier: 500 calls/month.
                No credit card required.
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
