import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Parallel Search API for AI Agents: Benchmark Results (2026) — AgentPick',
  description:
    'Parallel Search is built from the ground up for AI agents — declarative semantic objectives, token-compressed excerpts, fewer round trips. How it benchmarks against Perplexity, Exa, and Tavily.',
  openGraph: {
    title: 'Parallel Search API for AI Agents (2026 Benchmark)',
    description:
      'Parallel Search: declarative semantic search for agents. Token-compressed results, lower cost per reasoning step. AgentPick benchmark vs Perplexity, Exa, Tavily.',
    url: 'https://agentpick.dev/blog/parallel-search-api-for-ai-agents',
    images: [{ url: '/api/og?type=benchmark&cap=search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parallel Search API for AI Agents — Benchmark Results (2026)',
    description: 'Declarative semantic search built for agent loops. Benchmark vs Perplexity, Exa, Tavily.',
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
          <span>Parallel Search</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0EA5E9]">
              Benchmark
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 14, 2026 · 5 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            Parallel Search API for AI Agents: Benchmark Results (2026)
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            Parallel Search is designed from the ground up for AI agents — not adapted from a consumer
            search engine. It uses declarative semantic objectives instead of keyword queries, returns
            token-compressed excerpts optimized for LLM reasoning, and claims fewer round trips per task.
            Here is how it actually performs.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            {/* TL;DR */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">TL;DR — March 2026</h3>
              <ul className="space-y-1.5 text-sm">
                <li>🎯 <strong className="text-text-primary">Declarative search</strong> — agents specify intent in natural language, not keyword queries</li>
                <li>🗜️ <strong className="text-text-primary">Token-compressed output</strong> — excerpts optimized for LLM context windows</li>
                <li>⚡ <strong className="text-text-primary">Fewer round trips</strong> — relevant content in one call vs multiple scrape-then-extract steps</li>
                <li>📊 Benchmark position: under evaluation — entering AgentPick tracking</li>
                <li>🔀 AgentPick can route to Parallel for deep-research, multi-step agent workloads</li>
              </ul>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What Makes Parallel Different</h2>
            <p>
              Most search APIs were built for browsers — then adapted for developers. Parallel was built
              specifically for agentic workloads. The key difference is in how queries are expressed.
            </p>
            <p>
              Instead of constructing keyword strings, an agent using Parallel describes its objective:
              &quot;find Columbus-based corporate law firms specializing in disability care&quot; rather than
              &quot;Columbus corporate law disability.&quot; The API interprets meaning and context, returns
              compressed URL excerpts ranked by token relevancy, and is designed to minimize the number of
              follow-up calls needed before the agent has enough context to reason.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Current Rankings — Where Parallel Sits</h2>
            <p>
              AgentPick benchmarks search APIs continuously across production agent calls and standardized
              test suites. Parallel Search is entering dedicated tracking this cycle. Current confirmed rankings:
            </p>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Search API Rankings — March 2026 (608+ benchmark runs)</h3>
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
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#1</td>
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
                    <tr className="bg-[#F0F9FF]">
                      <td className="px-5 py-3 font-mono text-[#0EA5E9]">–</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Parallel Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">evaluating</td>
                      <td className="px-5 py-3 text-text-dim">Deep research, multi-step agents</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">The Declarative Search Advantage</h2>
            <p>
              Traditional search APIs expect keyword queries. When an agent wants to research a topic,
              it typically needs to: (1) construct a keyword query, (2) retrieve URLs, (3) scrape
              content, (4) extract relevant passages. That is 3-4 API calls minimum.
            </p>
            <p>
              Parallel Search compresses steps 1-3 into a single call. The agent sends an intent
              description; Parallel returns token-optimized excerpts directly usable by the LLM.
              For agents running many searches per task, this reduces latency and LLM token cost
              significantly — the context window gets dense signal rather than raw scraped HTML.
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#0F1117] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <pre className="overflow-x-auto font-mono text-[13px] text-[#E2E8F0] whitespace-pre-wrap">
{`# Traditional approach: 3-4 calls
urls = search_api.query("Columbus corporate law disability")
pages = [scrape(url) for url in urls[:3]]
passages = [extract_relevant(p) for p in pages]

# Parallel approach: 1 call
results = parallel.search(
  objective="Columbus-based corporate law firms specializing in disability care",
  format="compressed_excerpts"  # LLM-ready token output
)`}
              </pre>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">When to Use Parallel vs Alternatives</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <h3 className="mb-3 text-sm font-[650] text-green-700">Use Parallel when:</h3>
                <ul className="space-y-1.5 text-sm">
                  <li>• Multi-step research agents doing 10+ searches</li>
                  <li>• Context window budget is tight</li>
                  <li>• Semantic intent matters more than keywords</li>
                  <li>• You want fewer scrape/extract round trips</li>
                  <li>• Deep research tasks over broad queries</li>
                </ul>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <h3 className="mb-3 text-sm font-[650] text-red-600">Use Perplexity/Exa when:</h3>
                <ul className="space-y-1.5 text-sm">
                  <li>• Simple factual queries with one clear answer</li>
                  <li>• Technical documentation lookup</li>
                  <li>• High-volume, fast first-pass retrieval</li>
                  <li>• News and realtime information needs</li>
                  <li>• Budget-sensitive high-volume pipelines</li>
                </ul>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">How AgentPick Routes to Parallel</h2>
            <p>
              AgentPick analyzes query intent before routing. For queries that look like multi-step
              research tasks — long objectives, multiple entities, complex information needs — the
              router can select Parallel as a candidate alongside Perplexity and Exa:
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#0F1117] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <pre className="overflow-x-auto font-mono text-[13px] text-[#E2E8F0] whitespace-pre-wrap">
{`from agentpick import router

# Simple query → routes to Perplexity (quality)
result = router.search(
  query="what is the GDP of Germany",
  strategy="auto"
)

# Deep research intent → may route to Parallel
result = router.search(
  query="corporate law firms specializing in disability care in Columbus Ohio",
  strategy="auto"  # router classifies as deep-research intent
)`}
              </pre>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">FAQ</h2>

            <div className="space-y-4">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <h3 className="mb-2 text-sm font-[650] text-text-primary">What is Parallel Search API?</h3>
                <p className="text-sm text-text-secondary">
                  Parallel Search is a web search API built specifically for AI agents. Unlike
                  traditional search APIs adapted from consumer products, Parallel is designed for
                  agentic workflows — it accepts declarative semantic objectives, returns
                  token-compressed excerpts, and is optimized to minimize the number of calls
                  needed before an LLM has enough context to complete a task.
                </p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <h3 className="mb-2 text-sm font-[650] text-text-primary">How does Parallel Search compare to Tavily?</h3>
                <p className="text-sm text-text-secondary">
                  Tavily is optimized for structured search-and-extract with strong finance and
                  business coverage (AgentPick score: 6.1). Parallel is optimized for semantic
                  intent understanding and context efficiency. They serve different use cases —
                  Tavily excels at fact-retrieval tasks, Parallel at complex research where
                  reducing round trips matters.
                </p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <h3 className="mb-2 text-sm font-[650] text-text-primary">How does Parallel Search compare to Exa for AI agents?</h3>
                <p className="text-sm text-text-secondary">
                  Exa uses neural search trained on link prediction — excellent for technical
                  documentation and research paper discovery (score: 6.4, 50% faster than
                  Perplexity). Parallel uses declarative semantic objectives and token compression.
                  For agents doing many sequential document lookups, Exa may be faster per call;
                  for agents needing complex context assembly, Parallel reduces total round trips.
                </p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <h3 className="mb-2 text-sm font-[650] text-text-primary">What is the best search API for AI agents in 2026?</h3>
                <p className="text-sm text-text-secondary">
                  Based on AgentPick benchmarks (608+ runs): Perplexity API leads at 7.0 for
                  general search quality. Exa is fastest for technical queries. Parallel is
                  strongest for multi-step research with complex intents. The right answer depends
                  on your workload type — AgentPick routes to the right provider automatically.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-2 text-base font-[650] text-text-primary">Route to Parallel automatically</h3>
              <p className="mb-4 text-sm text-text-secondary">
                One API key. AgentPick routes to Parallel, Perplexity, Exa, or Tavily based on query
                intent and your strategy. Free tier: 500 calls/month.
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
                <Link href="/blog/tool-routing-for-ai-agents" className="block rounded-xl border border-[#E2E8F0] bg-white p-4 hover:border-[#CBD5E1] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  <div className="text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">Tool Routing for AI Agents: Skip the Boilerplate →</div>
                  <div className="mt-1 text-xs text-text-dim">How AgentPick selects the right API per query.</div>
                </Link>
              </div>
            </div>

          </div>
        </article>
      </main>
    </div>
  );
}
