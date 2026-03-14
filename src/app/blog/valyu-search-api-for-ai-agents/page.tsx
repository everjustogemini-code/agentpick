import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Valyu Search API for AI Agents: Benchmark Results (2026) — AgentPick',
  description:
    'Valyu Search ranked #1 across 5 benchmark categories in independent comparisons. How it performs in AgentPick production benchmarks vs Perplexity, Exa, Tavily, and Brave.',
  openGraph: {
    title: 'Valyu Search API for AI Agents (2026 Benchmark)',
    description:
      'Valyu Search: #1 across 5 benchmark categories. AgentPick benchmark results vs Perplexity, Exa, Tavily, Brave. Is the hype real?',
    url: 'https://agentpick.dev/blog/valyu-search-api-for-ai-agents',
    images: [{ url: '/api/og?type=benchmark&cap=search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Valyu Search API for AI Agents — Benchmark Results (2026)',
    description: 'Valyu ranked #1 in 5 benchmark categories. How it compares in AgentPick production routing data.',
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
          <span>Valyu Search</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0EA5E9]">
              Benchmark
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 14, 2026 · 5 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            Valyu Search API for AI Agents: Benchmark Results (2026)
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            Valyu Search appeared in independent benchmark comparisons this week, ranking #1 across five
            categories. That is a strong signal — but independent benchmarks and production agent workloads
            are different things. Here is what AgentPick production routing data shows.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            {/* TL;DR */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">TL;DR — March 2026</h3>
              <ul className="space-y-1.5 text-sm">
                <li>🏆 <strong className="text-text-primary">External benchmark #1</strong> — Valyu ranked first across 5 categories in independent comparisons</li>
                <li>📊 <strong className="text-text-primary">AgentPick tracking: entering evaluation</strong> — adding to production benchmark suite this week</li>
                <li>⚡ <strong className="text-text-primary">Claimed strength</strong> — high-relevance results optimized for agentic retrieval workflows</li>
                <li>🔀 <strong className="text-text-primary">Current #1 in AgentPick benchmarks</strong>: Perplexity API (7.0, 614+ runs)</li>
                <li>🎯 Best strategy: let AgentPick route automatically — it selects the top-ranked tool per query</li>
              </ul>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Why Valyu Is Worth Watching</h2>
            <p>
              Most search APIs score 5.8–7.0 in AgentPick benchmarks — a 1.2-point spread across the
              entire field. When a new entrant claims #1 across five independent benchmark categories,
              that is statistically unusual. It warrants immediate tracking.
            </p>
            <p>
              Valyu positions itself as a retrieval API purpose-built for AI agents — specifically
              optimized for returning high-relevance, structured results that LLMs can reason over
              without additional scraping or extraction steps. The claim is similar to what Exa and
              Parallel make, but the benchmark ranking suggests execution may differ.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Current AgentPick Rankings</h2>
            <p>
              AgentPick benchmarks run continuously across 301 active agents routing real production
              calls. These are not synthetic benchmarks — they reflect actual agent workloads across
              search, research, and retrieval tasks. Current confirmed rankings after 620+ benchmark runs:
            </p>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Search API Rankings — March 2026 (620+ benchmark runs)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Rank</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Score</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    <tr className="bg-[#F0FFF4]">
                      <td className="px-5 py-3 font-mono text-green-700">#1 ★</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Perplexity API</td>
                      <td className="px-5 py-3 font-mono font-bold text-green-600">7.0</td>
                      <td className="px-5 py-3 text-text-dim">General queries, research</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#2</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Haystack</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">6.9</td>
                      <td className="px-5 py-3 text-text-dim">Structured retrieval, RAG</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#3</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Exa Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">6.4</td>
                      <td className="px-5 py-3 text-text-dim">Technical docs, neural search</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#4</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Tavily</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#F59E0B]">6.1</td>
                      <td className="px-5 py-3 text-text-dim">Finance, business data</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#5</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Brave Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#F97316]">5.8</td>
                      <td className="px-5 py-3 text-text-dim">News, high-volume, budget</td>
                    </tr>
                    <tr className="bg-[#FFFBEB]">
                      <td className="px-5 py-3 font-mono text-[#F59E0B]">–</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Valyu Search</td>
                      <td className="px-5 py-3 font-mono text-[#F59E0B]">evaluating</td>
                      <td className="px-5 py-3 text-text-dim">Agentic retrieval, high-relevance</td>
                    </tr>
                    <tr className="bg-[#F0F9FF]">
                      <td className="px-5 py-3 font-mono text-[#0EA5E9]">–</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Parallel Search</td>
                      <td className="px-5 py-3 font-mono text-[#0EA5E9]">evaluating</td>
                      <td className="px-5 py-3 text-text-dim">Deep research, multi-step agents</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What Valyu Appears to Do Differently</h2>
            <p>
              Based on published documentation and the benchmark categories where it ranked first,
              Valyu appears to focus on retrieval quality for structured agentic use cases — specifically:
            </p>
            <ul className="list-none space-y-3 pl-0">
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-[#F59E0B] w-5">01</span>
                <div>
                  <strong className="text-text-primary">Precision over recall</strong> — returns fewer but more relevant results rather than broad coverage, reducing the LLM filtering burden
                </div>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-[#F59E0B] w-5">02</span>
                <div>
                  <strong className="text-text-primary">Structured output format</strong> — results are formatted for direct LLM consumption rather than requiring post-processing
                </div>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-[#F59E0B] w-5">03</span>
                <div>
                  <strong className="text-text-primary">Agentic context awareness</strong> — the API design anticipates multi-turn agent workflows rather than single-shot queries
                </div>
              </li>
            </ul>

            <p>
              Whether these design choices translate to higher scores in production agent routing — across
              the full mix of query types that real agents send — is what the current benchmark suite will
              determine.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Independent Benchmarks vs Production Routing</h2>
            <p>
              Synthetic benchmarks and production routing tell different stories. Most benchmark
              comparisons test a curated set of queries — often chosen to highlight the strengths
              of the tools being compared. Production routing captures the full range of what agents
              actually send: ambiguous queries, edge cases, malformed inputs, and domain-specific
              workloads.
            </p>
            <p>
              This is why AgentPick&apos;s scores differ from published marketing benchmarks. Perplexity
              leads at 7.0 in production routing despite not always topping external comparisons.
              Valyu&apos;s #1 ranking across 5 external categories is a strong signal — but the production
              benchmark suite will surface whether that advantage holds under real load.
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Benchmark Methodology</h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-8">40%</span>
                  <span>Router traces — real production call outcomes across 301 agents</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-8">25%</span>
                  <span>Benchmark runs — standardized query suites (620+ runs)</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-8">20%</span>
                  <span>Telemetry — latency p50/p95, uptime, error rates</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-8">15%</span>
                  <span>Agent votes — developer satisfaction signals</span>
                </div>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">When to Use Valyu vs Alternatives</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <h3 className="mb-3 text-sm font-[650] text-[#F59E0B]">Try Valyu when:</h3>
                <ul className="space-y-1.5 text-sm">
                  <li>• Precision matters more than coverage</li>
                  <li>• You want structured output ready for LLMs</li>
                  <li>• Multi-step agentic retrieval workflows</li>
                  <li>• Existing top-5 APIs aren&apos;t meeting quality bar</li>
                  <li>• External benchmarks align with your query type</li>
                </ul>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <h3 className="mb-3 text-sm font-[650] text-text-dim">Stick with current #1 when:</h3>
                <ul className="space-y-1.5 text-sm">
                  <li>• General-purpose search queries dominate</li>
                  <li>• Speed (p50 latency) is a hard constraint</li>
                  <li>• News and realtime coverage is important</li>
                  <li>• High-volume budget-sensitive pipelines</li>
                  <li>• You need a proven production track record</li>
                </ul>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">FAQ</h2>

            <div className="space-y-4">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <h3 className="mb-2 text-sm font-[650] text-text-primary">What is Valyu Search API?</h3>
                <p className="text-sm text-text-secondary">
                  Valyu is a web search API designed for AI agent retrieval workflows. It focuses on
                  high-precision results structured for direct LLM consumption — returning fewer but
                  more relevant results rather than broad keyword coverage. It recently ranked #1
                  across 5 benchmark categories in an independent comparison study.
                </p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <h3 className="mb-2 text-sm font-[650] text-text-primary">How does Valyu compare to Perplexity for AI agents?</h3>
                <p className="text-sm text-text-secondary">
                  Perplexity API leads AgentPick production benchmarks at 7.0 based on 620+ routing
                  runs across 301 active agents. Valyu is entering evaluation — external benchmarks
                  show it ranking #1 in 5 categories. Production score pending. If Valyu confirms
                  at or above 7.0, AgentPick will route to it automatically for appropriate queries.
                </p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <h3 className="mb-2 text-sm font-[650] text-text-primary">How does Valyu compare to Exa Search?</h3>
                <p className="text-sm text-text-secondary">
                  Exa (score 6.4) uses neural search trained on link prediction — fast, excellent for
                  technical documentation and developer queries. Valyu emphasizes precision and
                  structured agentic output. They may target different query types within the
                  agent workload mix. AgentPick benchmarks will surface which wins for each category.
                </p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <h3 className="mb-2 text-sm font-[650] text-text-primary">Is Valyu Search better than Tavily?</h3>
                <p className="text-sm text-text-secondary">
                  Tavily scores 6.1 in AgentPick benchmarks, with particular strength on finance and
                  business data queries. Valyu&apos;s external benchmark #1 ranking suggests potential
                  overall quality advantage — but Tavily&apos;s finance specialization may hold for
                  that specific query type. Production routing data will determine the comparison.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-2 text-base font-[650] text-text-primary">Route to Valyu automatically when it confirms</h3>
              <p className="mb-4 text-sm text-text-secondary">
                AgentPick will add Valyu to production routing as benchmarks confirm its score.
                Sign up now — one API key, automatic routing to the highest-ranked tool for every query.
                Free tier: 500 calls/month, no credit card required.
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

            {/* Related */}
            <div className="pt-2">
              <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Related</h3>
              <div className="space-y-3">
                <Link href="/blog/best-search-api-for-ai-agents" className="block rounded-xl border border-[#E2E8F0] bg-white p-4 hover:border-[#CBD5E1] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  <div className="text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">Best Search API for AI Agents (2026) →</div>
                  <div className="mt-1 text-xs text-text-dim">Full rankings. Perplexity #1, Haystack #2, Exa #3.</div>
                </Link>
                <Link href="/blog/exa-search-for-ai-agents" className="block rounded-xl border border-[#E2E8F0] bg-white p-4 hover:border-[#CBD5E1] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  <div className="text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">Exa Search API for AI Agents →</div>
                  <div className="mt-1 text-xs text-text-dim">50% faster than Perplexity. Score 6.4.</div>
                </Link>
                <Link href="/blog/parallel-search-api-for-ai-agents" className="block rounded-xl border border-[#E2E8F0] bg-white p-4 hover:border-[#CBD5E1] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  <div className="text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">Parallel Search API for AI Agents →</div>
                  <div className="mt-1 text-xs text-text-dim">Declarative semantic search for agent workflows.</div>
                </Link>
              </div>
            </div>

          </div>
        </article>
      </main>
    </div>
  );
}
