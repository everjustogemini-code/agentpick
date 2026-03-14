import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Blog — AgentPick',
  description:
    'Technical guides on AI agent tool selection, API routing, auto-fallback, and building production-grade agent infrastructure.',
  openGraph: {
    title: 'AgentPick Blog — AI Agent Tool Engineering',
    description:
      'Technical guides on AI agent tool selection, API routing, auto-fallback, and building production-grade agent infrastructure.',
    url: 'https://agentpick.dev/blog',
    images: [{ url: '/api/og?v=2', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentPick Blog — AI Agent Tool Engineering',
    description:
      'Technical guides on AI agent tool selection, API routing, auto-fallback, and building production-grade agent infrastructure.',
  },
};

const POSTS = [
  {
    slug: 'firecrawl-for-ai-agents',
    title: 'Firecrawl for AI Agents: Benchmark vs Tavily, Exa, Perplexity (2026)',
    description:
      'Firecrawl converts any website to clean LLM-ready markdown with JavaScript rendering. How it compares to search APIs for AI agent workloads and when to use crawl vs search.',
    date: '2026-05-02',
    readTime: '5 min',
    tag: 'Benchmark',
    tagColor: '#F97316',
  },
  {
    slug: 'serpapi-for-ai-agents',
    title: 'SerpAPI for AI Agents: Benchmark vs Tavily, Exa, Perplexity (2026)',
    description:
      'SerpAPI covers 40+ search engines and is the go-to for SERP scraping. How does it compare to AI-native search APIs for AI agent workloads? Real benchmark data.',
    date: '2026-03-14',
    readTime: '5 min',
    tag: 'Benchmark',
    tagColor: '#0EA5E9',
  },
  {
    slug: 'valyu-search-api-for-ai-agents',
    title: 'Valyu Search API for AI Agents: Benchmark Results (2026)',
    description:
      'Valyu Search ranked #1 across 5 benchmark categories in independent comparisons. How it performs in AgentPick production routing data vs Perplexity, Exa, Tavily, and Brave.',
    date: '2026-03-14',
    readTime: '5 min',
    tag: 'Benchmark',
    tagColor: '#0EA5E9',
  },
  {
    slug: 'parallel-search-api-for-ai-agents',
    title: 'Parallel Search API for AI Agents: Benchmark Results (2026)',
    description:
      'Parallel Search is built from the ground up for AI agents — declarative semantic objectives, token-compressed excerpts, fewer round trips. How it compares to Perplexity, Exa, and Tavily.',
    date: '2026-03-14',
    readTime: '5 min',
    tag: 'Benchmark',
    tagColor: '#0EA5E9',
  },
  {
    slug: 'brave-search-api-for-ai-agents',
    title: 'Brave Search API for AI Agents: Benchmark Results (2026)',
    description:
      'Brave has an independent index, costs $0.0008/call (7x cheaper than Perplexity), and leads on news freshness. When Brave beats the #1 search API — and when it does not.',
    date: '2026-03-14',
    readTime: '5 min',
    tag: 'Benchmark',
    tagColor: '#0EA5E9',
  },
  {
    slug: 'linkup-search-api-for-ai-agents',
    title: 'Linkup Search API for AI Agents: How It Compares (2026)',
    description:
      'Linkup calls itself the best search for AI apps. We benchmarked it against Perplexity, Exa, Tavily, and Brave. Here is where it actually lands.',
    date: '2026-03-14',
    readTime: '5 min',
    tag: 'Benchmark',
    tagColor: '#0EA5E9',
  },
  {
    slug: 'haystack-for-ai-agents',
    title: 'Haystack for AI Agents: Benchmark Results (2026)',
    description:
      'Haystack ranks #2 in AgentPick benchmarks with a score of 6.9 — just 1% behind Perplexity. The best structured retrieval API for RAG pipelines.',
    date: '2026-03-14',
    readTime: '5 min',
    tag: 'Benchmark',
    tagColor: '#0EA5E9',
  },
  {
    slug: 'exa-search-for-ai-agents',
    title: 'Exa Search API for AI Agents: Benchmark Results (2026)',
    description:
      'Exa Search scores 6.4 in AgentPick benchmarks and runs 50% faster than Perplexity. When to choose Exa over the #1 pick — and when not to.',
    date: '2026-03-14',
    readTime: '5 min',
    tag: 'Benchmark',
    tagColor: '#0EA5E9',
  },
  {
    slug: 'tool-routing-for-ai-agents',
    title: 'Tool Routing for AI Agents: Skip the Boilerplate',
    description:
      'Stop hardcoding Tavily or Exa. Tool routing automatically selects the best API per query — with fallback, benchmarks, and zero maintenance. 5-minute integration.',
    date: '2026-03-14',
    readTime: '6 min',
    tag: 'Architecture',
    tagColor: '#8B5CF6',
  },
  {
    slug: 'perplexity-api-for-ai-agents',
    title: 'Perplexity API for AI Agents: Benchmark Results & When to Use It',
    description:
      'Perplexity API is currently #1 for AI agent search (score 7.0, 536 runs). When does it win, when does Exa beat it, and how to route to it automatically.',
    date: '2026-03-14',
    readTime: '5 min',
    tag: 'Benchmark',
    tagColor: '#0EA5E9',
  },
  {
    slug: 'best-search-api-for-ai-agents',
    title: 'Best Search API for AI Agents (2026 Benchmark Results)',
    description:
      'Perplexity API leads at 7.0, Exa is 50% faster. 536 benchmark runs, 2,036 production calls. Which search API should your agent use?',
    date: '2026-03-14',
    readTime: '6 min',
    tag: 'Benchmark',
    tagColor: '#0EA5E9',
  },
  {
    slug: 'tavily-vs-exa-vs-brave-search-api',
    title: 'Tavily vs Exa vs Brave Search: Which Search API Should Your Agent Use?',
    description:
      'Data-driven comparison of the top search APIs for AI agents. Benchmark numbers, latency, cost, and relevance scores across 500+ agent runs.',
    date: '2026-03-10',
    readTime: '8 min',
    tag: 'Benchmark',
    tagColor: '#0EA5E9',
  },
  {
    slug: 'why-your-ai-agent-needs-a-tool-router',
    title: 'Why Your AI Agent Needs a Tool Router (And How to Build One)',
    description:
      'Hardcoding API calls is the fastest way to build a fragile agent. Learn how a tool router adds resilience, observability, and intelligence to your agent stack.',
    date: '2026-03-08',
    readTime: '7 min',
    tag: 'Architecture',
    tagColor: '#8B5CF6',
  },
  {
    slug: 'hidden-cost-hardcoding-api-tools',
    title: 'The Hidden Cost of Hardcoding API Tools in Your Agent',
    description:
      'Hardcoded tool dependencies create invisible failure modes. Quantifying the real cost of brittle agent architecture and how to fix it.',
    date: '2026-03-06',
    readTime: '6 min',
    tag: 'Engineering',
    tagColor: '#F97316',
  },
  {
    slug: 'auto-fallback-agentpick-keeps-agent-running',
    title: 'Auto-Fallback: How AgentPick Keeps Your Agent Running When APIs Go Down',
    description:
      'APIs fail. The question is whether your agent fails with them. Inside AgentPick\'s auto-fallback routing layer and how it maintains uptime during outages.',
    date: '2026-03-04',
    readTime: '6 min',
    tag: 'Reliability',
    tagColor: '#10B981',
  },
  {
    slug: '5-routing-strategies-ai-agent-tool-selection',
    title: '5 Routing Strategies for AI Agent Tool Selection',
    description:
      'From round-robin to ML-based adaptive routing — a practical guide to the five routing strategies that power production AI agents.',
    date: '2026-03-02',
    readTime: '9 min',
    tag: 'Guide',
    tagColor: '#6366F1',
  },
];

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-[760px] px-6 py-12">
        {/* Hero */}
        <div className="mb-10">
          <span className="rounded-full bg-bg-secondary px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Blog
          </span>
          <h1 className="mt-3 text-[32px] font-bold tracking-[-0.8px] text-text-primary">
            AI Agent Engineering
          </h1>
          <p className="mt-2 text-base text-text-secondary">
            Technical guides on building production-grade AI agents — tool routing, API selection, reliability, and architecture patterns.
          </p>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: post.tagColor + '15',
                        color: post.tagColor,
                      }}
                    >
                      {post.tag}
                    </span>
                    <span className="font-mono text-[10px] text-text-dim">
                      {post.date} · {post.readTime} read
                    </span>
                  </div>
                  <h2 className="text-[17px] font-[650] tracking-[-0.3px] text-text-primary group-hover:text-accent transition-colors leading-snug">
                    {post.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary line-clamp-2">
                    {post.description}
                  </p>
                </div>
                <span className="mt-1 shrink-0 text-text-dim group-hover:text-accent transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-[650] tracking-[-0.3px] text-text-primary">
            Stop guessing. Start routing.
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            Connect your agent to AgentPick and get auto-fallback, smart routing, and real-time benchmarks.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/connect"
              className="rounded-lg bg-[#0A0A0A] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Get Started →
            </Link>
            <Link
              href="/dashboard/router"
              className="rounded-lg border border-[#E2E8F0] px-5 py-2.5 text-sm font-medium text-text-secondary hover:border-[#D4D4D4] hover:text-text-primary transition-colors"
            >
              View Router
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#E5E5E5] py-6">
        <p className="text-center font-mono text-xs text-text-dim">
          agentpick.dev — agents discover the best software
        </p>
      </footer>
    </div>
  );
}
