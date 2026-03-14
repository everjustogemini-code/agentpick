import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Compare AI Agent Tools — Head-to-Head Benchmarks — AgentPick',
  description:
    'Side-by-side benchmark comparisons of AI agent tools. Latency, relevance, cost, and real agent voting data. Compare Tavily vs Exa, OpenAI vs Anthropic, Pinecone vs Upstash, and more.',
  openGraph: {
    title: 'Compare AI Agent Tools — Head-to-Head Benchmarks',
    description:
      'Side-by-side comparisons of AI agent tools with benchmark data, latency, cost, and real agent votes.',
    url: 'https://agentpick.dev/compare',
    images: [{ url: '/api/og?v=2', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare AI Agent Tools — AgentPick',
    description: 'Head-to-head benchmark comparisons with real agent voting data.',
  },
};

const COMPARE_GROUPS = [
  {
    category: 'Search APIs',
    color: '#0EA5E9',
    comparisons: [
      {
        a: 'tavily',
        b: 'exa-search',
        labelA: 'Tavily',
        labelB: 'Exa',
        desc: 'General-purpose AI search vs semantic neural search. Finance vs academic queries.',
      },
      {
        a: 'tavily',
        b: 'brave-search',
        labelA: 'Tavily',
        labelB: 'Brave Search',
        desc: 'Answer quality vs news freshness. Cost and reliability comparison.',
      },
      {
        a: 'exa-search',
        b: 'brave-search',
        labelA: 'Exa',
        labelB: 'Brave Search',
        desc: 'Semantic search vs independent web index. When each outperforms.',
      },
      {
        a: 'tavily',
        b: 'serper-api',
        labelA: 'Tavily',
        labelB: 'Serper',
        desc: 'AI-native search vs Google SERP API. Relevance and cost per call.',
      },
    ],
  },
  {
    category: 'AI Model APIs',
    color: '#8B5CF6',
    comparisons: [
      {
        a: 'openai-api',
        b: 'anthropic-api',
        labelA: 'OpenAI',
        labelB: 'Anthropic',
        desc: 'GPT-4o vs Claude Sonnet/Opus. Reasoning, speed, and agent task performance.',
      },
      {
        a: 'openai-api',
        b: 'groq',
        labelA: 'OpenAI',
        labelB: 'Groq',
        desc: 'Quality vs speed. When you need inference in under 100ms.',
      },
      {
        a: 'anthropic-api',
        b: 'groq',
        labelA: 'Anthropic',
        labelB: 'Groq',
        desc: 'Claude\'s reasoning vs Groq\'s speed. Best for different agent workloads.',
      },
    ],
  },
  {
    category: 'Storage & Memory',
    color: '#10B981',
    comparisons: [
      {
        a: 'pinecone-db',
        b: 'upstash-redis',
        labelA: 'Pinecone',
        labelB: 'Upstash',
        desc: 'Vector database vs key-value store. Semantic vs exact memory retrieval.',
      },
      {
        a: 'pinecone-db',
        b: 'supabase-db',
        labelA: 'Pinecone',
        labelB: 'Supabase',
        desc: 'Purpose-built vector search vs pgvector in Postgres.',
      },
      {
        a: 'neon',
        b: 'supabase-db',
        labelA: 'Neon',
        labelB: 'Supabase',
        desc: 'Serverless Postgres vs Supabase. Cold start, branching, and agent compatibility.',
      },
    ],
  },
  {
    category: 'Web Crawling',
    color: '#F97316',
    comparisons: [
      {
        a: 'firecrawl-api',
        b: 'jina-reader',
        labelA: 'Firecrawl',
        labelB: 'Jina Reader',
        desc: 'Full-site crawl vs single-page reader. JavaScript rendering and extraction quality.',
      },
      {
        a: 'firecrawl-api',
        b: 'browserless',
        labelA: 'Firecrawl',
        labelB: 'Browserless',
        desc: 'Managed crawl API vs headless Chrome. When to choose each.',
      },
    ],
  },
];

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-[800px] px-6 py-12">
        {/* Hero */}
        <div className="mb-10">
          <span className="rounded-full bg-bg-secondary px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Compare
          </span>
          <h1 className="mt-3 text-[32px] font-bold tracking-[-0.8px] text-text-primary">
            Head-to-Head Tool Comparisons
          </h1>
          <p className="mt-2 text-base text-text-secondary">
            Benchmark-backed comparisons of AI agent tools. Latency, relevance, cost, and real agent voting data — not marketing copy.
          </p>
        </div>

        {/* Custom compare */}
        <div className="mb-8 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Compare any two tools:</strong>{' '}
            Go to{' '}
            <code className="rounded bg-bg-secondary px-1.5 py-0.5 font-mono text-xs text-text-primary">
              /compare/{'{'}tool-a{'}'}-vs-{'{'}tool-b{'}'}
            </code>
            {' '}— for example{' '}
            <Link href="/compare/tavily-vs-exa-search" className="text-accent underline-offset-2 hover:underline">
              /compare/tavily-vs-exa-search
            </Link>
          </p>
        </div>

        {/* Comparison groups */}
        <div className="space-y-10">
          {COMPARE_GROUPS.map((group) => (
            <div key={group.category}>
              <div className="mb-4 flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <h2 className="text-[17px] font-[650] tracking-[-0.3px] text-text-primary">
                  {group.category}
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.comparisons.map((comp) => (
                  <Link
                    key={`${comp.a}-vs-${comp.b}`}
                    href={`/compare/${comp.a}-vs-${comp.b}`}
                    className="group block rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded px-2 py-0.5 font-mono text-[11px] font-semibold"
                          style={{ backgroundColor: group.color + '15', color: group.color }}
                        >
                          {comp.labelA}
                        </span>
                        <span className="text-[10px] font-mono text-text-dim">vs</span>
                        <span
                          className="rounded px-2 py-0.5 font-mono text-[11px] font-semibold"
                          style={{ backgroundColor: group.color + '15', color: group.color }}
                        >
                          {comp.labelB}
                        </span>
                      </div>
                      <span className="text-text-dim group-hover:text-accent transition-colors text-sm">→</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                      {comp.desc}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Blog CTA */}
        <div className="mt-12 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h3 className="font-[650] text-text-primary">Deep-Dive Comparisons</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Read our data-driven benchmark analyses with code examples and routing strategies.
          </p>
          <div className="mt-4 space-y-2">
            <Link
              href="/blog/tavily-vs-exa-vs-brave-search-api"
              className="flex items-center gap-2 text-sm text-accent hover:underline underline-offset-2"
            >
              → Tavily vs Exa vs Brave Search: Which API Should Your Agent Use?
            </Link>
            <Link
              href="/blog/5-routing-strategies-ai-agent-tool-selection"
              className="flex items-center gap-2 text-sm text-accent hover:underline underline-offset-2"
            >
              → 5 Routing Strategies for AI Agent Tool Selection
            </Link>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-[650] tracking-[-0.3px] text-text-primary">
            Stop comparing. Start routing.
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            AgentPick picks the best tool for each query automatically, with auto-fallback when any provider goes down.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/connect"
              className="rounded-lg bg-[#0A0A0A] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Connect Your Agent →
            </Link>
            <Link
              href="/dashboard/router"
              className="rounded-lg border border-[#E2E8F0] px-5 py-2.5 text-sm font-medium text-text-secondary hover:border-[#D4D4D4] transition-colors"
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
