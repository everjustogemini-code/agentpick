import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Firecrawl for AI Agents: Benchmark vs Tavily, Exa, Perplexity (2026) — AgentPick',
  description:
    'Firecrawl converts any website to clean LLM-ready markdown with JavaScript rendering. How does it compare to AI-native search APIs like Perplexity, Exa, and Tavily for AI agent workloads?',
  openGraph: {
    title: 'Firecrawl for AI Agents — Benchmark Results 2026',
    description:
      'Firecrawl vs Perplexity #1 (7.0), Exa #3 (6.4), Tavily #4 (6.1). AgentPick benchmark data for AI agent web scraping and search API selection.',
    url: 'https://agentpick.dev/blog/firecrawl-for-ai-agents',
    images: [{ url: '/api/og?type=benchmark&cap=search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Firecrawl for AI Agents — 2026 Benchmark Results',
    description: 'Real benchmark data: Firecrawl vs Perplexity, Exa, Tavily, Brave for AI agents.',
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
          <span>Firecrawl for AI Agents</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-orange-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#F97316]">
              Benchmark
            </span>
            <span className="font-mono text-[11px] text-text-dim">May 2, 2026 · 5 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            Firecrawl for AI Agents: Benchmark Results (2026)
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            Firecrawl is one of the most widely adopted web scraping APIs for AI developers — it
            converts any website to clean, LLM-ready markdown with full JavaScript rendering.
            Here is how it compares to search and retrieval APIs in the AgentPick benchmark set,
            and when it belongs in your agent stack.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            {/* TL;DR */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">TL;DR — May 2026</h3>
              <ul className="space-y-1.5 text-sm">
                <li><strong className="text-text-primary">Firecrawl</strong> — AI-native web scraping, converts pages to clean LLM-ready markdown</li>
                <li><strong className="text-text-primary">JavaScript rendering</strong> — handles SPAs, dynamic content, headless browser built-in</li>
                <li><strong className="text-text-primary">Currently evaluating</strong> in AgentPick benchmark set — confirmed score pending</li>
                <li><strong className="text-text-primary">Best for</strong> full-page content extraction, RAG document pipelines, structured scraping</li>
                <li><strong className="text-text-primary">Not a search API</strong> — crawls specific URLs rather than querying by topic</li>
              </ul>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What is Firecrawl?</h2>
            <p>
              Firecrawl (firecrawl.dev) is a web scraping and crawling API built specifically for
              AI applications. Unlike general-purpose scrapers, Firecrawl is designed to output
              clean markdown that LLMs can consume directly — stripping navigation, ads, and boilerplate
              while preserving structured content.
            </p>
            <p>
              Key capabilities: full-page scraping with JavaScript rendering, site-wide crawling
              with depth controls, structured data extraction via LLM-powered schemas, and batch
              URL processing. It powers the ingestion layer for many RAG pipelines and
              knowledge-base builders.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Firecrawl vs Search APIs for AI Agents</h2>
            <p>
              Firecrawl and search APIs solve adjacent but different problems. Search APIs
              (Perplexity, Exa, Tavily) answer <em>queries</em> — you ask about a topic and get
              relevant results. Firecrawl answers <em>URLs</em> — you give it a page and get
              the full cleaned content. Understanding this distinction prevents misapplication.
            </p>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">API Comparison — AI Agent Use Cases</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">AgentPick Score</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Input</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    <tr className="bg-[#F0FFF4]">
                      <td className="px-5 py-3 font-semibold text-text-primary">Perplexity API</td>
                      <td className="px-5 py-3 font-mono font-bold text-green-600">7.0 #1</td>
                      <td className="px-5 py-3 text-text-secondary">Query text</td>
                      <td className="px-5 py-3 text-text-secondary">General research, Q&A</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-text-primary">Haystack</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">6.9 #2</td>
                      <td className="px-5 py-3 text-text-secondary">Query text</td>
                      <td className="px-5 py-3 text-text-secondary">RAG pipelines</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-text-primary">Exa Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">6.4 #3</td>
                      <td className="px-5 py-3 text-text-secondary">Query text</td>
                      <td className="px-5 py-3 text-text-secondary">Fast retrieval loops</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-text-primary">Tavily</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#F59E0B]">6.1 #4</td>
                      <td className="px-5 py-3 text-text-secondary">Query text</td>
                      <td className="px-5 py-3 text-text-secondary">Finance, domain-specific</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-text-primary">Brave Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#F97316]">5.8 #5</td>
                      <td className="px-5 py-3 text-text-secondary">Query text</td>
                      <td className="px-5 py-3 text-text-secondary">Cost-sensitive, news</td>
                    </tr>
                    <tr className="bg-[#FFF7F0]">
                      <td className="px-5 py-3 font-semibold text-text-primary">Firecrawl</td>
                      <td className="px-5 py-3 font-mono text-[#F97316]">evaluating</td>
                      <td className="px-5 py-3 text-text-secondary">URL(s)</td>
                      <td className="px-5 py-3 text-text-secondary">Full-page extraction, RAG docs</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">When Firecrawl Makes Sense for Agents</h2>
            <p>
              Firecrawl is the right tool when your agent needs to work with specific web pages
              rather than search results. Key use cases:
            </p>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-4">1.</span>
                <span><strong className="text-text-primary">RAG document ingestion</strong> — crawl a documentation site or knowledge base into clean markdown for vector storage</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-4">2.</span>
                <span><strong className="text-text-primary">Dynamic content extraction</strong> — pages that require JavaScript rendering (React, Vue, Next.js apps)</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-4">3.</span>
                <span><strong className="text-text-primary">Structured data extraction</strong> — use LLM-powered schemas to extract specific fields from any page</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-4">4.</span>
                <span><strong className="text-text-primary">Full-site crawling</strong> — map and crawl an entire domain with depth controls and link following</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-4">5.</span>
                <span><strong className="text-text-primary">Competitor monitoring</strong> — periodically scrape and diff specific pages for changes</span>
              </li>
            </ul>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Search + Crawl in the Same Agent Loop</h2>
            <p>
              The most effective agent stacks combine search and crawl in sequence: a search API
              (Perplexity, Exa, or Tavily) identifies relevant URLs, then Firecrawl extracts the
              full content from those URLs for deep analysis. This two-step pattern is common in
              research agents and competitive intelligence pipelines.
            </p>
            <p>
              AgentPick routes both search and crawl calls. When your agent needs full-page content
              after a search, the crawl capability routes to Firecrawl (or Jina AI, currently
              ranked #1 for crawl at 5.2) automatically.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Pricing Comparison</h2>
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="divide-y divide-[#F5F5F5]">
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-secondary">Firecrawl</span>
                  <span className="font-mono text-text-primary">Free tier (500 pages/month) + $0.001/page</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-secondary">Perplexity API</span>
                  <span className="font-mono text-text-primary">~$0.005/call (search + synthesis)</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-secondary">Exa Search</span>
                  <span className="font-mono text-text-primary">~$0.003/call</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-secondary">Tavily</span>
                  <span className="font-mono text-text-primary">~$0.001–$0.004/call</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-secondary">Jina AI (crawl #1)</span>
                  <span className="font-mono text-text-primary">Free tier + $0.02/1K tokens</span>
                </div>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">AgentPick Benchmark Status</h2>
            <p>
              Firecrawl entered the AgentPick benchmark set this week (May 2026). It requires 50+
              standardized runs across crawl, extraction, and document ingestion tasks before
              receiving a confirmed composite score. Given its AI-native design and strong developer
              adoption, we expect Firecrawl to score competitively in the crawl category
              alongside the current #1 Jina AI (5.2).
            </p>
            <p>
              Confirmed score expected within 2–3 cycles. Follow{' '}
              <Link href="/reports/weekly/2026-05-02" className="text-[#0EA5E9] hover:underline">
                the weekly benchmark report
              </Link>{' '}
              for updates.
            </p>

            {/* FAQ */}
            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">FAQ</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-[650] text-text-primary">Is Firecrawl good for AI agents?</h3>
                <p className="mt-1 text-sm">
                  Firecrawl is excellent for AI agents that need to extract content from specific
                  URLs — documentation, product pages, competitor sites, or any dynamic web content.
                  For topic-based search (finding relevant pages by query), use a search API like
                  Perplexity (7.0) or Exa (6.4) instead. The two tools are complementary, not interchangeable.
                </p>
              </div>
              <div>
                <h3 className="text-base font-[650] text-text-primary">Firecrawl vs Tavily for AI agents?</h3>
                <p className="mt-1 text-sm">
                  Tavily is a search API — you give it a query, it returns relevant results with
                  synthesized answers. Firecrawl is a crawl API — you give it a URL, it returns the
                  full cleaned page content. Many production agent stacks use both: Tavily for
                  discovery, Firecrawl for deep content extraction from the discovered URLs.
                </p>
              </div>
              <div>
                <h3 className="text-base font-[650] text-text-primary">Firecrawl vs Jina AI for web crawling?</h3>
                <p className="mt-1 text-sm">
                  Both convert web pages to LLM-ready markdown. Jina AI (score 5.2, current crawl #1
                  in AgentPick) has a simpler API and generous free tier. Firecrawl offers more
                  advanced features: JavaScript rendering, structured extraction schemas, and full
                  site crawling with depth controls. For simple single-URL extraction, Jina AI is
                  often sufficient. For complex crawling pipelines, Firecrawl has more capability.
                </p>
              </div>
              <div>
                <h3 className="text-base font-[650] text-text-primary">Does Firecrawl handle JavaScript-heavy sites?</h3>
                <p className="mt-1 text-sm">
                  Yes. Firecrawl uses a headless browser under the hood, so it handles React, Vue,
                  Next.js, and other SPA frameworks that require JavaScript execution to render
                  content. This is a significant advantage over simple HTTP scrapers that only see
                  the initial HTML.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-2 text-base font-[650] text-text-primary">Route search and crawl automatically</h3>
              <p className="mb-4 text-sm text-text-secondary">
                AgentPick routes to the highest-ranked API for each capability — search, crawl,
                finance, realtime. One key, automatic fallback, no vendor lock-in.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/connect"
                  className="rounded-lg bg-[#0EA5E9] px-5 py-2.5 font-mono text-sm font-semibold text-white hover:bg-[#0284C7]"
                >
                  Get API Key →
                </Link>
                <Link
                  href="/blog/best-search-api-for-ai-agents"
                  className="rounded-lg border border-[#E2E8F0] px-5 py-2.5 font-mono text-sm font-semibold text-text-secondary hover:border-[#CBD5E1]"
                >
                  Full Rankings →
                </Link>
              </div>
            </div>

          </div>
        </article>
      </main>
    </div>
  );
}
