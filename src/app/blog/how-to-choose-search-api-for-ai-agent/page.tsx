import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'How to Choose a Search API for Your AI Agent (2026 Guide) — AgentPick',
  description:
    'A practical decision framework for choosing between Perplexity, Exa, Tavily, Brave, and Linkup for AI agents. Based on 700+ benchmark runs and 5,250+ production routing decisions.',
  openGraph: {
    title: 'How to Choose a Search API for Your AI Agent (2026 Guide)',
    description:
      'Not all search APIs are equal for agents. Use this decision framework to pick the right one for your use case: quality vs speed vs cost vs freshness.',
    url: 'https://agentpick.dev/blog/how-to-choose-search-api-for-ai-agent',
    images: [{ url: '/api/og?type=blog&slug=how-to-choose-search-api-for-ai-agent', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Choose a Search API for Your AI Agent (2026)',
    description: 'Quality vs speed vs cost vs freshness — a decision framework based on 700+ benchmark runs.',
    images: ['/api/og?type=blog&slug=how-to-choose-search-api-for-ai-agent'],
  },
};

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-[700px] px-6 py-12">
        <nav className="mb-6 font-mono text-xs text-text-dim">
          <Link href="/" className="hover:text-text-secondary">AgentPick</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-text-secondary">Blog</Link>
          <span className="mx-2">/</span>
          <span>How to choose a search API for your AI agent</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-[#F0F9FF] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0EA5E9]">
              Guide
            </span>
            <span className="font-mono text-[11px] text-text-dim">May 23, 2026</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            How to Choose a Search API for Your AI Agent (2026)
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            A practical decision framework based on 700+ benchmark runs and 5,250+ production routing
            decisions. Stop reading comparison posts. Start with the question that actually matters:
            what does your agent need to optimize for?
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            <p>
              Every search API post tells you the same thing: here are 6 options, here are their pros
              and cons, good luck. That is not useful when you are building an agent and need to make
              a call.
            </p>
            <p>
              This post is different. It is a decision framework. Answer three questions about your
              agent, and you will know which search API to use — or whether to use an auto-router
              instead.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">The decision framework</h2>

            <p>
              Before picking an API, answer these:
            </p>

            <div className="space-y-3">
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-text-dim mb-2">Question 1</div>
                <p className="font-[650] text-text-primary mb-1">Does answer quality matter more than latency?</p>
                <p className="text-sm text-text-secondary">Research agents, report generators, and fact-checking pipelines typically need the best answer, not the fastest one. API agents, autocomplete, or high-volume first-pass retrieval usually need speed.</p>
              </div>
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-text-dim mb-2">Question 2</div>
                <p className="font-[650] text-text-primary mb-1">Is your domain general or specialized?</p>
                <p className="text-sm text-text-secondary">Finance, legal, and medical queries often need a different provider than general knowledge queries. The top-ranked general search API is not always the top for a specific domain.</p>
              </div>
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-text-dim mb-2">Question 3</div>
                <p className="font-[650] text-text-primary mb-1">Will you run more than one type of query?</p>
                <p className="text-sm text-text-secondary">Most agents do. If your agent runs research queries, news lookups, and finance checks, no single API is optimal for all three. That is when routing makes more sense than hardcoding.</p>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Current benchmark rankings</h2>

            <p>
              These scores come from AgentPick&apos;s continuous benchmark system — 700+ runs across
              search, crawl, and retrieval APIs, combined with 5,250+ production routing decisions.
              Scores are composite: relevance, latency, uptime, answer quality, 90-day rolling.
            </p>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Search API Rankings — May 2026</h3>
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
                      <td className="px-5 py-3 font-mono text-green-700">#1</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Perplexity API</td>
                      <td className="px-5 py-3 font-mono font-bold text-green-600">7.0</td>
                      <td className="px-5 py-3 text-text-dim">Quality-first general search</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#2</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Haystack</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">6.9</td>
                      <td className="px-5 py-3 text-text-dim">Structured retrieval, balanced speed</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#3</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Exa Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">6.4</td>
                      <td className="px-5 py-3 text-text-dim">Speed — 50% faster than Perplexity</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#4</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Tavily</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#F59E0B]">6.1</td>
                      <td className="px-5 py-3 text-text-dim">Finance, domain-specific research</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#5</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Brave Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#F97316]">5.8</td>
                      <td className="px-5 py-3 text-text-dim">Cheapest, independent index, news freshness</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">If quality is your top priority</h2>

            <p>
              Use <strong className="font-[650] text-text-primary">Perplexity API</strong>. It has
              held the #1 position for 11 consecutive weeks across 700+ benchmark runs. The gap to
              #2 (Haystack at 6.9) is small — roughly 1.5% — but Perplexity consistently wins on
              relevance and answer synthesis for general knowledge queries.
            </p>
            <p>
              Where Perplexity underperforms: very high-volume loops where latency compounds. At
              scale, its response time starts to matter.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">If speed is your top priority</h2>

            <p>
              Use <strong className="font-[650] text-text-primary">Exa Search</strong>. It is 50%
              faster than Perplexity at 6.4/10 — a 9% quality tradeoff for a 50% latency gain. For
              high-volume first-pass retrieval, that is the right tradeoff. Exa also has a neural
              search model that excels at concept-based queries rather than keyword matching.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">If cost is your top constraint</h2>

            <p>
              Use <strong className="font-[650] text-text-primary">Brave Search</strong>. At
              $0.0008/call, it is the cheapest option in the benchmark — and it runs on an
              independent web index (not licensed from Google or Bing). The score of 5.8/10 means
              it is meaningfully below Perplexity, but for cost-sensitive pipelines where quality
              above a threshold is good enough, Brave is the right choice.
            </p>
            <p>
              Brave also has the best news freshness of the five (2.1 hours average), which matters
              for agents doing real-time monitoring.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">If your domain is finance or business research</h2>

            <p>
              Use <strong className="font-[650] text-text-primary">Tavily</strong>. It ranks #4
              overall at 6.1, but its performance on finance and business research queries
              consistently outperforms its general score. It has accumulated more production calls
              (4,400+) than any other provider in the AgentPick system — which also means its
              score is the most statistically reliable of the five.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">If you run multiple query types</h2>

            <p>
              No single API is optimal across research, news, finance, and semantic retrieval. If
              your agent does more than one of these, hardcoding any provider means accepting
              suboptimal results on at least some of your queries.
            </p>
            <p>
              This is the case where routing is the right architectural choice. Rather than picking
              an API per use case and maintaining the logic yourself, you let a router pick the
              right API per query at runtime — and fall back automatically if the primary provider
              is slow or down.
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-dim">Decision summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-36 shrink-0">Quality first</span>
                  <span className="font-[650] text-text-primary">Perplexity API (#1, 7.0)</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-36 shrink-0">Speed first</span>
                  <span className="font-[650] text-text-primary">Exa Search (#3, 6.4, 50% faster)</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-36 shrink-0">Cost first</span>
                  <span className="font-[650] text-text-primary">Brave Search (#5, $0.0008/call)</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-36 shrink-0">Finance domain</span>
                  <span className="font-[650] text-text-primary">Tavily (#4, most production calls)</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-36 shrink-0">Multiple types</span>
                  <span className="font-[650] text-text-primary">Auto-routing (AgentPick)</span>
                </div>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">How AgentPick auto-routing works</h2>

            <p>
              AgentPick classifies each query at routing time — research, news, finance, or
              general — and picks the highest-ranked provider for that category. If the primary
              provider fails or rate-limits, it falls back to the next-best option automatically.
              No code changes required.
            </p>

            <div className="rounded-xl bg-[#0F172A] p-5 font-mono text-sm">
              <div className="mb-2 text-[11px] uppercase tracking-wider text-[#64748B]">Replace hardcoded Tavily</div>
              <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#94A3B8]">{`# Before: hardcoded
results = tavily.search(query=q)

# After: auto-routed
results = agentpick.search(query=q)
# Routes to Perplexity, Exa, Tavily, or Brave
# depending on query type and live benchmark scores`}</pre>
            </div>

            <p>
              Free tier is 500 calls/month, no credit card required. The router API is available at{' '}
              <code className="font-mono text-sm bg-[#F1F5F9] px-1.5 py-0.5 rounded">POST /api/v1/route/search</code>.
            </p>

            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <Link
                href="/connect"
                className="rounded-lg bg-[#0EA5E9] px-5 py-2.5 font-mono text-sm font-semibold text-white hover:bg-[#0284C7]"
              >
                Get API Key →
              </Link>
              <Link
                href="/reports/weekly/2026-05-23"
                className="rounded-lg border border-[#E2E8F0] px-5 py-2.5 font-mono text-sm font-semibold text-text-secondary hover:border-[#CBD5E1]"
              >
                Latest Benchmark Report
              </Link>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0]">
              <p className="text-sm text-text-dim">
                Related:{' '}
                <Link href="/blog/best-search-api-for-ai-agents" className="text-[#0EA5E9] hover:underline">Best search APIs for AI agents</Link>
                {' · '}
                <Link href="/blog/5-routing-strategies-ai-agent-tool-selection" className="text-[#0EA5E9] hover:underline">5 routing strategies for tool selection</Link>
                {' · '}
                <Link href="/blog/how-we-benchmark-search-apis-for-ai-agents" className="text-[#0EA5E9] hover:underline">How we benchmark search APIs</Link>
              </p>
            </div>

          </div>
        </article>
      </main>
    </div>
  );
}
