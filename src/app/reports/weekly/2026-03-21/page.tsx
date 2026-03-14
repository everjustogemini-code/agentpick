import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'AI Agent API Benchmark Report — Week of March 21, 2026 — AgentPick',
  description:
    'Weekly AI agent API benchmark results: 572 runs across search, crawl, and retrieval APIs. Perplexity leads at 7.0, Haystack #2 at 6.9, Exa #3 at 6.4. Live rankings updated March 21, 2026.',
  openGraph: {
    title: 'AI Agent API Benchmark Report — March 21, 2026',
    description:
      '572 benchmark runs. Perplexity API #1 (7.0), Haystack #2 (6.9), Exa Search #3 (6.4). Linkup enters benchmark queue. Weekly rankings for AI agent developers.',
    url: 'https://agentpick.dev/reports/weekly/2026-03-21',
    images: [{ url: '/api/og?type=benchmark&cap=search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Agent API Benchmark — Week of March 21, 2026',
    description: 'Perplexity #1 (7.0), Haystack #2 (6.9), Exa #3 (6.4). 572 runs. Linkup queued.',
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
          <span>Weekly 2026-03-21</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-green-700">
              Weekly Report
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 21, 2026</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            AI Agent API Benchmark Report
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            572 benchmark runs across search, crawl, and retrieval APIs. Updated weekly from
            live AgentPick production data and standardized benchmark queries.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            {/* Summary card */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">This Week at a Glance</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-mono text-[22px] font-bold text-text-primary">572</div>
                  <div className="text-text-dim">Benchmark runs</div>
                </div>
                <div>
                  <div className="font-mono text-[22px] font-bold text-text-primary">2,373</div>
                  <div className="text-text-dim">Production calls</div>
                </div>
                <div>
                  <div className="font-mono text-[22px] font-bold text-text-primary">295</div>
                  <div className="text-text-dim">Active agents</div>
                </div>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Search API Rankings</h2>
            <p>
              Scores are composite quality metrics weighted across relevance, answer quality, latency, and uptime.
              Rankings update weekly as new benchmark data is collected.
            </p>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Search — 572 runs, week ending 2026-03-21</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Rank</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Score</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">WoW</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    <tr className="bg-[#F0FDF4]">
                      <td className="px-5 py-3 font-mono text-green-700">#1</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Perplexity API</td>
                      <td className="px-5 py-3 font-mono font-bold text-green-600">7.0</td>
                      <td className="px-5 py-3 font-mono text-text-dim">—</td>
                      <td className="px-5 py-3 text-text-dim">General queries, research</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#2</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Haystack</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.9</td>
                      <td className="px-5 py-3 font-mono text-text-dim">—</td>
                      <td className="px-5 py-3 text-text-dim">Structured retrieval, RAG</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#3</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Exa Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.4</td>
                      <td className="px-5 py-3 font-mono text-text-dim">—</td>
                      <td className="px-5 py-3 text-text-dim">Speed-critical, loops (50% faster)</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#4</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Tavily</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.1</td>
                      <td className="px-5 py-3 font-mono text-text-dim">—</td>
                      <td className="px-5 py-3 text-text-dim">Finance, broad coverage</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#5</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Brave Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">5.8</td>
                      <td className="px-5 py-3 font-mono text-text-dim">—</td>
                      <td className="px-5 py-3 text-text-dim">Privacy-preserving, cost-effective</td>
                    </tr>
                    <tr className="bg-[#FAFAFA]">
                      <td className="px-5 py-3 font-mono text-text-dim">—</td>
                      <td className="px-5 py-3 font-semibold text-text-dim">Linkup</td>
                      <td className="px-5 py-3 font-mono text-amber-600">Queued</td>
                      <td className="px-5 py-3 font-mono text-text-dim">—</td>
                      <td className="px-5 py-3 text-xs text-text-dim">Verification in progress</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Crawl API Rankings</h2>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Crawl — week ending 2026-03-21</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Rank</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Score</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Vs #1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    <tr className="bg-[#F0FDF4]">
                      <td className="px-5 py-3 font-mono text-green-700">#1</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Jina AI</td>
                      <td className="px-5 py-3 font-mono font-bold text-green-600">5.2</td>
                      <td className="px-5 py-3 font-mono text-text-dim">baseline</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#2</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Unstructured</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">5.1</td>
                      <td className="px-5 py-3 font-mono text-text-dim">51% faster</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#3</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Apify</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">5.0</td>
                      <td className="px-5 py-3 font-mono text-text-dim">52% faster</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#4</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Browserless</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">4.8</td>
                      <td className="px-5 py-3 font-mono text-text-dim">58% faster</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What Changed This Week</h2>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2"><span className="text-green-600 font-mono">↑</span> <strong className="text-text-primary">Agents +3</strong> — 292 → 295 active agents this week</li>
                <li className="flex gap-2"><span className="text-green-600 font-mono">↑</span> <strong className="text-text-primary">Production calls +337</strong> — 2,036 → 2,373 cumulative</li>
                <li className="flex gap-2"><span className="text-text-dim font-mono">→</span> Perplexity API holds #1 — consistent across 5 weeks</li>
                <li className="flex gap-2"><span className="text-text-dim font-mono">→</span> Exa speed advantage confirmed: 50% faster than Perplexity at median latency</li>
                <li className="flex gap-2"><span className="text-amber-600 font-mono">⏳</span> <strong className="text-text-primary">Linkup</strong> — entered benchmark queue; verification in progress</li>
              </ul>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Methodology</h2>
            <p>
              AgentPick runs standardized benchmark queries across all registered APIs on a continuous basis.
              Each run measures:
            </p>
            <ul className="space-y-2 pl-4 text-sm">
              <li><strong className="text-text-primary">Result count:</strong> Number of relevant results returned</li>
              <li><strong className="text-text-primary">Relevance score:</strong> Manual sampling + automated relevance grading</li>
              <li><strong className="text-text-primary">Latency (p50/p95):</strong> End-to-end response time from US-East</li>
              <li><strong className="text-text-primary">Uptime:</strong> Success rate over trailing 7 days</li>
            </ul>
            <p>
              The composite score weights these factors: quality 50%, latency 25%, uptime 25%.
              Scores update weekly as new benchmark data accumulates.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">How to Use These Rankings</h2>
            <p>
              You do not need to read this report every week. AgentPick automatically routes to the
              current best API for each query type. Register once, and the routing layer keeps up
              with benchmark changes automatically:
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#0F172A] p-5">
              <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Auto-route to current #1</div>
              <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#E2E8F0]">{`curl -X POST https://agentpick.dev/api/v1/route/search \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"strategy": "best_performance", "params": {"query": "your query"}}'

# Response includes which API was used:
# { "meta": { "tool_used": "perplexity-api" }, "data": { ... } }`}</pre>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-2 font-[650] text-text-primary">Get live benchmark data for your agent</h3>
              <p className="mb-3 text-sm text-text-secondary">
                Free tier: 3,000 calls/month. Routes to the current best API automatically.
              </p>
              <Link
                href="/connect"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#18181B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#27272A] transition-colors"
              >
                Get API key →
              </Link>
            </div>

          </div>
        </article>

        <footer className="mt-12 border-t border-[#E5E5E5] pt-8">
          <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Previous Reports</h3>
          <div className="space-y-3">
            <Link href="/reports/weekly/2026-03-14" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Week of March 14, 2026 →
            </Link>
          </div>
          <div className="mt-6 space-y-3">
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Related</h3>
            <Link href="/blog/best-search-api-for-ai-agents" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Best Search API for AI Agents (Full Guide) →
            </Link>
            <Link href="/blog/linkup-search-api-for-ai-agents" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Linkup vs Perplexity vs Exa: Comparison →
            </Link>
          </div>
        </footer>

      </main>
    </div>
  );
}
