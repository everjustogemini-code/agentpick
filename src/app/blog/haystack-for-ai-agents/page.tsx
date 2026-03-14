import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Haystack for AI Agents: Benchmark Results (2026) — AgentPick',
  description:
    'Haystack ranks #2 in AgentPick benchmarks with a score of 6.9 — just 1% behind Perplexity. The best structured retrieval API for AI agents building RAG pipelines.',
  openGraph: {
    title: 'Haystack for AI Agents (2026 Benchmark Results)',
    description:
      'Score: 6.9. Only 1% behind #1 Perplexity. Best for structured retrieval and RAG pipelines. 536 benchmark runs.',
    url: 'https://agentpick.dev/blog/haystack-for-ai-agents',
    images: [{ url: '/api/og?type=benchmark&cap=search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Haystack for AI Agents — Benchmark Results',
    description: 'Score 6.9 / 10. 1% behind #1. Best for structured retrieval and RAG.',
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
          <span>Haystack</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0EA5E9]">
              Benchmark
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 14, 2026 · 5 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            Haystack for AI Agents: Benchmark Results (2026)
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            Haystack scores 6.9 in AgentPick benchmarks — ranked #2 overall, just 1% behind Perplexity.
            It is the strongest option for structured retrieval and production RAG pipelines.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            {/* TL;DR */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">TL;DR — March 2026</h3>
              <ul className="space-y-1.5 text-sm">
                <li>📊 <strong className="text-text-primary">Haystack score: 6.9 / 10</strong> across 536 benchmark runs</li>
                <li>🏆 <strong className="text-text-primary">Ranked #2</strong> — only 1% behind Perplexity API (7.0)</li>
                <li>🎯 Best for: <strong className="text-text-primary">structured retrieval, RAG pipelines, document search</strong></li>
                <li>⚠️ Not ideal for: real-time web search or news retrieval</li>
                <li>🔀 AgentPick auto-routes to Haystack for structured document queries</li>
              </ul>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Where Haystack Ranks</h2>
            <p>
              AgentPick benchmarks every major search and retrieval API across production agent calls and
              standardized test queries. As of March 2026, Haystack holds position #2 in the overall
              search ranking — within 1% of the top spot:
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
                    <tr className="bg-[#F0F9FF]">
                      <td className="px-5 py-3 font-mono text-[#0EA5E9]">#2 ★</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Haystack</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">6.9</td>
                      <td className="px-5 py-3 text-text-dim">Structured retrieval, RAG</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#3</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Exa Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.4</td>
                      <td className="px-5 py-3 text-text-dim">Speed-critical, loops</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#4</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Tavily</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.1</td>
                      <td className="px-5 py-3 text-text-dim">Finance, broad coverage</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What Makes Haystack Different</h2>
            <p>
              Haystack is purpose-built for document retrieval and RAG (retrieval-augmented generation)
              pipelines. Unlike general-purpose search APIs optimized for web crawling, Haystack
              excels at searching structured corpora — knowledge bases, document stores, proprietary
              datasets — with high precision.
            </p>
            <p>
              Its pipeline-based architecture allows agents to chain preprocessing, embedding, retrieval,
              and reranking steps. This makes it particularly effective when you are not searching the
              open web but instead retrieving from a curated document set.
            </p>
            <p>
              The 6.9 benchmark score reflects this: for structured retrieval tasks, Haystack
              consistently returns higher-relevance results than general web search APIs. The 1%
              gap below Perplexity closes — and sometimes reverses — when the query is against
              a structured knowledge base rather than open web content.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">When to Use Haystack</h2>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-[650] text-text-primary">Use Haystack when:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> Building RAG pipelines over private or curated document sets</li>
                <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> Your agent needs to search internal knowledge bases or wikis</li>
                <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> Query precision matters more than speed</li>
                <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> You need fine-grained control over retrieval pipelines (embedding, reranking)</li>
                <li className="flex gap-2"><span className="text-green-600 font-bold">✓</span> Searching structured data: PDFs, Markdown, HTML document stores</li>
              </ul>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-[650] text-text-primary">Use Perplexity instead when:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2"><span className="text-red-500 font-bold">✗</span> You need live web search (Haystack does not crawl the open web)</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">✗</span> Time-sensitive queries about recent events or news</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">✗</span> General-purpose question answering without a structured corpus</li>
              </ul>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Haystack vs Perplexity vs Exa</h2>
            <p>
              The three top-ranked APIs cover different niches. Understanding the differences helps
              you choose the right one — or let AgentPick route automatically:
            </p>
            <ul className="space-y-2 pl-4">
              <li><strong className="text-text-primary">Perplexity (7.0):</strong> Best for open-web general queries. Returns curated, cited answers.</li>
              <li><strong className="text-text-primary">Haystack (6.9):</strong> Best for structured retrieval over your own document corpus. Pipeline-based control.</li>
              <li><strong className="text-text-primary">Exa (6.4):</strong> Best for speed. 50% faster than Perplexity, strong for technical/academic semantic search.</li>
            </ul>
            <p>
              Most production agents benefit from routing across all three depending on query type.
              That is exactly what AgentPick does with its <code className="rounded bg-[#F5F5F5] px-1.5 py-0.5 text-[13px]">auto</code> strategy.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Auto-routing with AgentPick</h2>
            <p>
              You do not have to hardcode one API. AgentPick&apos;s routing layer automatically selects
              between Haystack, Perplexity, Exa, and Tavily based on your query type and strategy:
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#0F172A] p-5">
              <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Route to Haystack automatically</div>
              <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#E2E8F0]">{`# Register (free, 500 calls/month)
curl -X POST https://agentpick.dev/api/v1/agents/register \\
  -H "Content-Type: application/json" \\
  -d '{"name": "my-agent"}'

# Route — AgentPick selects best tool per query
curl -X POST https://agentpick.dev/api/v1/route/search \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"strategy": "best_performance", "params": {"query": "your query"}}'`}</pre>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Frequently Asked Questions</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-[650] text-text-primary">Is Haystack better than Perplexity for AI agents?</h3>
                <p className="mt-1 text-sm">
                  For structured document retrieval and RAG pipelines: yes, Haystack often wins. For
                  open-web general queries: Perplexity leads. AgentPick benchmarks show a 6.9 vs 7.0
                  overall gap — effectively tied for most use cases, with the winner depending on query type.
                </p>
              </div>
              <div>
                <h3 className="font-[650] text-text-primary">What is Haystack used for in AI agents?</h3>
                <p className="mt-1 text-sm">
                  Haystack is primarily used for retrieval-augmented generation (RAG) — fetching relevant
                  documents from a knowledge base to ground LLM outputs. It handles embedding, indexing,
                  retrieval, and reranking as configurable pipeline components.
                </p>
              </div>
              <div>
                <h3 className="font-[650] text-text-primary">How does Haystack benchmark against Tavily?</h3>
                <p className="mt-1 text-sm">
                  Haystack scores 6.9 vs Tavily&apos;s 6.1 in AgentPick benchmarks — a 13% quality advantage.
                  Tavily has broader web coverage and more production usage data (2,036 recorded calls),
                  but Haystack wins on retrieval quality for structured or domain-specific queries.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-2 font-[650] text-text-primary">Try AgentPick free</h3>
              <p className="mb-3 text-sm text-text-secondary">
                500 calls/month free. Routes to Haystack, Perplexity, Exa, Tavily and more based on your strategy. No credit card.
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
            <Link href="/blog/perplexity-api-for-ai-agents" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Perplexity API for AI Agents: When it beats Haystack →
            </Link>
            <Link href="/blog/exa-search-for-ai-agents" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Exa Search for AI Agents: 50% faster, score 6.4 →
            </Link>
          </div>
        </footer>

      </main>
    </div>
  );
}
