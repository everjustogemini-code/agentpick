import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Exa Search API for AI Agents: Benchmark Results (2026) — AgentPick',
  description:
    'Exa Search ranks #3 overall in AgentPick benchmarks with a score of 6.4 — and it runs 50% faster than the #1 pick. When to choose Exa for your AI agent.',
  openGraph: {
    title: 'Exa Search API for AI Agents (2026 Benchmark Results)',
    description:
      'Score: 6.4. 50% faster than Perplexity. Best speed/quality ratio for high-volume agents. 536 benchmark runs.',
    url: 'https://agentpick.dev/blog/exa-search-for-ai-agents',
    images: [{ url: '/api/og?type=benchmark&cap=search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Exa Search for AI Agents — Benchmark Results',
    description: 'Score 6.4 / 10. 50% faster than #1. Best for speed-critical agents.',
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
          <span>Exa Search</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0EA5E9]">
              Benchmark
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 14, 2026 · 5 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            Exa Search API for AI Agents: Benchmark Results (2026)
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            Exa Search scores 6.4 in AgentPick benchmarks — ranked #3 overall. But it runs 50% faster than
            Perplexity, the current #1. Here is when to choose Exa and when not to.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            {/* TL;DR */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">TL;DR — March 2026</h3>
              <ul className="space-y-1.5 text-sm">
                <li>📊 <strong className="text-text-primary">Exa Search score: 6.4 / 10</strong> across 536 benchmark runs</li>
                <li>⚡ <strong className="text-text-primary">50% faster</strong> than Perplexity API (the #1 overall)</li>
                <li>🎯 Best for: <strong className="text-text-primary">speed-critical agents</strong>, high-volume loops, first-pass retrieval</li>
                <li>⚠️ Not ideal for: single high-stakes queries where quality is paramount</li>
                <li>🔀 AgentPick auto-routes to Exa when latency is the priority signal</li>
              </ul>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Where Exa Ranks</h2>
            <p>
              AgentPick tracks every major search API across production agent calls and standardized benchmark queries.
              As of March 2026, Exa Search holds position #3 in the overall search ranking:
            </p>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Search API Rankings — 536 benchmark runs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Rank</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Score</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Speed vs #1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#1</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Perplexity API</td>
                      <td className="px-5 py-3 font-mono font-bold text-green-600">7.0</td>
                      <td className="px-5 py-3 text-text-dim">baseline</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#2</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Haystack</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.9</td>
                      <td className="px-5 py-3 text-text-dim">similar</td>
                    </tr>
                    <tr className="bg-[#FFF7ED]">
                      <td className="px-5 py-3 font-mono text-[#F59E0B]">#3 ★</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Exa Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.4</td>
                      <td className="px-5 py-3 font-semibold text-[#F59E0B]">50% faster</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#4</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Tavily</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.1</td>
                      <td className="px-5 py-3 text-text-dim">slower</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">The Speed Advantage</h2>
            <p>
              Exa Search runs 50% faster than Perplexity in AgentPick&apos;s end-to-end latency measurements (US-East,
              median across 536 runs). The quality gap is 9% (6.4 vs 7.0). Whether that tradeoff is worth it depends
              entirely on your use case.
            </p>
            <p>
              For agents that run a single high-stakes search — say, a research assistant answering a complex question —
              that 9% quality difference matters. Use Perplexity.
            </p>
            <p>
              For agents that run search in a tight loop — crawling competitors, scouting for leads, doing first-pass
              retrieval before reranking — the 50% speed advantage compounds. 10 searches at Exa takes as long as 5
              searches at Perplexity. Use Exa.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What Exa Does Differently</h2>
            <p>
              Exa uses neural search trained on link prediction. Rather than keyword matching, it understands what a
              page is about semantically — making it stronger for technical and academic queries where the exact
              phrasing varies.
            </p>
            <p>
              The highlights feature extracts the most relevant sentence-level excerpts for your query, which can cut
              token usage by 50%+ when you are feeding results to an LLM. This matters for agents where token cost
              compounds across many calls.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">When to Use Exa Search</h2>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-[650] text-text-primary">Use Exa when:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> Your agent runs search in a loop (many queries per task)</li>
                <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> Latency directly impacts user experience</li>
                <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> You want to reduce token costs via highlights extraction</li>
                <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> Your queries are technical or academic (semantic model advantage)</li>
                <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> You run RAG pipelines where retrieval speed is the bottleneck</li>
              </ul>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-[650] text-text-primary">Use Perplexity instead when:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2"><span className="text-red-500 font-bold">✗</span> One query, one high-stakes answer (9% quality gap matters)</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">✗</span> General-purpose retrieval with no speed constraint</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">✗</span> Finance research where accuracy is critical</li>
              </ul>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Auto-routing with AgentPick</h2>
            <p>
              You do not have to choose manually. AgentPick routes to Exa when your routing strategy is set to{' '}
              <code className="rounded bg-[#F5F5F5] px-1.5 py-0.5 text-[13px]">balanced</code> or{' '}
              <code className="rounded bg-[#F5F5F5] px-1.5 py-0.5 text-[13px]">cheapest</code>, and routes to
              Perplexity when set to{' '}
              <code className="rounded bg-[#F5F5F5] px-1.5 py-0.5 text-[13px]">best_performance</code>.
              The <code className="rounded bg-[#F5F5F5] px-1.5 py-0.5 text-[13px]">auto</code> strategy uses both
              based on the query type.
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#0F172A] p-5">
              <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Route to Exa automatically</div>
              <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#E2E8F0]">{`# Get current recommendation
curl https://agentpick.dev/api/v1/recommend?capability=search

# Route with balanced strategy (Exa for speed when appropriate)
curl -X POST https://agentpick.dev/api/v1/route/search \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"strategy": "balanced", "params": {"query": "your query"}}'`}</pre>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Frequently Asked Questions</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-[650] text-text-primary">Is Exa Search better than Tavily for AI agents?</h3>
                <p className="mt-1 text-sm">
                  For speed: yes. Exa runs significantly faster. For overall quality score, Exa (6.4) edges Tavily (6.1)
                  but both trail Perplexity (7.0). Tavily has the most production usage data with 2,036 recorded calls
                  in the AgentPick network.
                </p>
              </div>
              <div>
                <h3 className="font-[650] text-text-primary">How does Exa&apos;s semantic search compare to keyword search?</h3>
                <p className="mt-1 text-sm">
                  Exa uses neural link prediction rather than keyword matching. For technical queries where exact
                  phrasing varies (academic papers, code concepts, research topics), Exa tends to surface more
                  relevant results. For breaking news and time-sensitive queries, index-based search may be faster
                  to index new content.
                </p>
              </div>
              <div>
                <h3 className="font-[650] text-text-primary">What is the Exa highlights feature?</h3>
                <p className="mt-1 text-sm">
                  Exa can return sentence-level excerpts most relevant to your query, rather than full page content.
                  This typically reduces the token count you pass to your LLM by 40-60%, cutting both cost and latency.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-2 font-[650] text-text-primary">Try AgentPick free</h3>
              <p className="mb-3 text-sm text-text-secondary">
                500 calls/month free. Routes to Exa, Perplexity, Tavily, and more based on your strategy. No credit card.
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
          <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Related</h3>
          <div className="space-y-3">
            <Link href="/blog/best-search-api-for-ai-agents" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Best Search API for AI Agents (Full Ranking) →
            </Link>
            <Link href="/blog/tavily-vs-exa-vs-brave-search-api" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Tavily vs Exa vs Brave Search: In-depth comparison →
            </Link>
            <Link href="/blog/perplexity-api-for-ai-agents" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Perplexity API for AI Agents: When it beats Exa →
            </Link>
          </div>
        </footer>

      </main>
    </div>
  );
}
