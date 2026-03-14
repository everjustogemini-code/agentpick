import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Best Search API for AI Agents (2026 Benchmark Results) — AgentPick',
  description:
    'Which search API should your AI agent use? We ran 536+ benchmarks across Perplexity, Haystack, Exa, Tavily, and Brave. Here are the results, with a free routing API.',
  openGraph: {
    title: 'Best Search API for AI Agents (2026)',
    description:
      'Perplexity API leads at 7.0, Exa Search is 50% faster. 536 benchmark runs, 2,036 production calls. Free recommendation endpoint included.',
    url: 'https://agentpick.dev/blog/best-search-api-for-ai-agents',
    images: [{ url: '/api/og?type=benchmark&cap=search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best Search API for AI Agents (2026 Benchmarks)',
    description: 'Perplexity #1 (7.0), Exa 50% faster. 536 runs, live routing endpoint.',
    images: ['/api/og?type=benchmark&cap=search'],
  },
};

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-[700px] px-6 py-12">
        <nav className="mb-6 font-mono text-xs text-text-dim">
          <Link href="/blog" className="hover:text-text-secondary">Blog</Link>
          <span className="mx-2">/</span>
          <span>Benchmark</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0EA5E9]">
              Benchmark
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 14, 2026 · 6 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            Best Search API for AI Agents (2026 Benchmark Results)
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            We ran 536 benchmark queries and tracked 2,036 production calls across every major search API. Here is the current ranking — with a free endpoint to get the live recommendation for your agent.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            {/* TL;DR Box */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">TL;DR — March 2026</h3>
              <ul className="space-y-1.5 text-sm">
                <li>🥇 <strong className="text-text-primary">Perplexity API</strong> — score 7.0, best overall quality</li>
                <li>🥈 <strong className="text-text-primary">Haystack</strong> — score 6.9, nearly tied with Perplexity</li>
                <li>⚡ <strong className="text-text-primary">Exa Search</strong> — score 6.4, 50% faster than Perplexity, best speed/quality ratio</li>
                <li>📊 <strong className="text-text-primary">Tavily</strong> — score 6.1, 2,036 production calls, 64 agent votes</li>
                <li>🔀 Use <strong className="text-text-primary">AgentPick routing</strong> to auto-select the best tool per query</li>
              </ul>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">The Current Ranking</h2>
            <p>
              AgentPick tracks every major search API used in production AI agents. Our score combines benchmark quality (25%), router traces from real agent calls (40%), telemetry (20%), and developer votes (15%). Rankings update in real time.
            </p>

            {/* Benchmark Table */}
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Search API Rankings — 536 benchmark runs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Score</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">vs #1</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    <tr className="bg-[#F0FDF4]">
                      <td className="px-5 py-3 font-semibold text-text-primary">Perplexity API</td>
                      <td className="px-5 py-3 font-mono font-bold text-green-600">7.0</td>
                      <td className="px-5 py-3 text-text-dim">—</td>
                      <td className="px-5 py-3 text-text-dim">General queries, research</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-text-primary">Haystack</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.9</td>
                      <td className="px-5 py-3 text-text-dim">−1%</td>
                      <td className="px-5 py-3 text-text-dim">Structured retrieval</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-text-primary">Exa Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.4</td>
                      <td className="px-5 py-3 text-[#F59E0B] font-semibold">50% faster</td>
                      <td className="px-5 py-3 text-text-dim">Speed-critical agents</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-text-primary">Tavily</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.1</td>
                      <td className="px-5 py-3 text-text-dim">−13%</td>
                      <td className="px-5 py-3 text-text-dim">Finance, broad coverage</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Which One Should You Use?</h2>

            <h3 className="text-[18px] font-[650] text-text-primary">Use Perplexity API if quality matters most</h3>
            <p>
              Perplexity API currently leads with a score of 7.0 across general search queries. It is the default recommendation from AgentPick for agents that run research, Q&amp;A, or knowledge-retrieval workloads where answer quality is the primary metric.
            </p>

            <h3 className="text-[18px] font-[650] text-text-primary">Use Exa Search if latency matters</h3>
            <p>
              Exa runs 50% faster than Perplexity at a 9% quality cost (6.4 vs 7.0). If your agent does many searches in a loop, or if user-facing latency is the bottleneck, Exa is a strong choice. Semantic search also outperforms keyword search for technical and academic queries.
            </p>

            <h3 className="text-[18px] font-[650] text-text-primary">Use Tavily for finance and domain-specific queries</h3>
            <p>
              With 2,036 production calls and 64 agent votes, Tavily has the most real-world usage data in the AgentPick network. It performs well for finance queries (SEC filings, earnings data) and maintains good freshness on news. Score: 6.1.
            </p>

            <h3 className="text-[18px] font-[650] text-text-primary">Use AgentPick to auto-route</h3>
            <p>
              If you do not want to pick and maintain this yourself, AgentPick routes to the best search API per query automatically — using the same benchmark data above. One API key, one endpoint, zero maintenance.
            </p>

            {/* Code Box */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#0F172A] p-5">
              <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Get live recommendation</div>
              <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#E2E8F0]">{`curl https://agentpick.dev/api/v1/recommend?capability=search

# Returns:
# {
#   "recommended": "perplexity-api",
#   "score": 7,
#   "alternatives": [
#     { "slug": "haystack", "score": 6.9 },
#     { "slug": "exa-search", "score": 6.4 },
#     { "slug": "tavily", "score": 6.1 }
#   ]
# }`}</pre>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Methodology</h2>
            <p>
              AgentPick scores are computed from a 90-day rolling window using four data sources: router traces from production agent calls (40% weight), standardized benchmark queries across 10 domains (25%), telemetry call volume (20%), and developer votes (15%). All benchmark queries are run from US-East. Latency is measured end-to-end including network.
            </p>
            <p>
              536 benchmark runs have been completed for search APIs as of March 2026. Rankings update automatically as new data arrives.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">How Rankings Change</h2>
            <p>
              This ranking will change over time as APIs improve. In the previous benchmark cycle, Tavily held the #1 position. Perplexity has since moved to the top. Rankings shift based on real usage data — not marketing claims.
            </p>
            <p>
              To always get the current recommendation, use the live endpoint:
            </p>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#0F172A] p-5">
              <pre className="text-[13px] leading-relaxed text-[#E2E8F0]">{`# Python
import agentpick
client = agentpick.Client(api_key='YOUR_KEY')
result = client.recommend(capability='search')
print(result.recommended)  # always the current best`}</pre>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-2 font-[650] text-text-primary">Try AgentPick free</h3>
              <p className="mb-3 text-sm text-text-secondary">
                500 calls/month free. No credit card. Routes to the best search API per query automatically.
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

        {/* Related posts */}
        <footer className="mt-12 border-t border-[#E5E5E5] pt-8">
          <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Related</h3>
          <div className="space-y-3">
            <Link href="/blog/tavily-vs-exa-vs-brave-search-api" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Tavily vs Exa vs Brave Search: In-depth comparison →
            </Link>
            <Link href="/blog/why-your-ai-agent-needs-a-tool-router" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Why your AI agent needs a tool router →
            </Link>
            <Link href="/blog/5-routing-strategies-ai-agent-tool-selection" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              5 routing strategies for AI agent tool selection →
            </Link>
          </div>
        </footer>

      </main>
    </div>
  );
}
