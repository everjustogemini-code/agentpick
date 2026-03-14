import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Tool Routing for AI Agents: Skip the Boilerplate — AgentPick',
  description:
    'Tool routing for AI agents means automatically selecting the best API per query instead of hardcoding one. Here is how it works, why it matters, and how to add it to your agent in 5 minutes.',
  openGraph: {
    title: 'Tool Routing for AI Agents — One API, Every Tool',
    description:
      'Stop hardcoding Tavily or Exa. AgentPick routes to the best search API per query automatically — with fallback, benchmarks, and zero maintenance.',
    url: 'https://agentpick.dev/blog/tool-routing-for-ai-agents',
    images: [{ url: '/api/og?v=2', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tool Routing for AI Agents — Skip the Boilerplate',
    description: 'One API key. Auto-routes to the best search/crawl/embed tool per query. Free to start.',
    images: ['/api/og?v=2'],
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
          <span>Architecture</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: '#8B5CF615', color: '#8B5CF6' }}>
              Architecture
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 14, 2026 · 6 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            Tool Routing for AI Agents: Skip the Boilerplate
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            Every production AI agent eventually needs to solve the same problem: which API do I call for this query? Tool routing is the pattern that solves it. Here is the 5-minute version.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            {/* TL;DR */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">TL;DR</h3>
              <ul className="space-y-1.5 text-sm">
                <li>🔀 <strong className="text-text-primary">Tool routing</strong> = automatically selecting the best API for each agent query</li>
                <li>💥 <strong className="text-text-primary">Hardcoding one API</strong> creates silent failures, stale results, and no fallback</li>
                <li>🏗️ <strong className="text-text-primary">AgentPick</strong> is a hosted tool router — one API key routes to Perplexity, Exa, Tavily, Firecrawl, and more</li>
                <li>🆓 <strong className="text-text-primary">Free tier</strong>: 500 calls/month, no credit card, live in 5 minutes</li>
              </ul>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">The Problem: Every Agent Hardcodes Its Tools</h2>
            <p>
              Most AI agents are built like this:
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#0F172A] p-5">
              <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Typical agent (fragile)</div>
              <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#E2E8F0]">{`# Agent hardcodes Tavily
from tavily import TavilyClient
client = TavilyClient(api_key=TAVILY_KEY)

def search(query):
    return client.search(query)  # breaks if Tavily is down
                                  # no fallback
                                  # may not be the best tool`}</pre>
            </div>

            <p>
              This works until it does not. API downtime, rate limits, pricing changes, or simply a better tool becoming available — all of these require you to manually update your agent. At scale, this is maintenance debt.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What Tool Routing Solves</h2>

            <p>A tool router sits between your agent and the underlying APIs. Instead of calling Tavily directly, your agent calls the router with a query and a capability type. The router:</p>

            <ul className="space-y-2 pl-4">
              <li className="relative pl-4 before:absolute before:left-0 before:content-['1.']"><strong className="text-text-primary">Selects the best API</strong> based on live benchmark scores, latency, cost, and stability</li>
              <li className="relative pl-4 before:absolute before:left-0 before:content-['2.']"><strong className="text-text-primary">Calls it on your behalf</strong> using managed API keys (no key management overhead)</li>
              <li className="relative pl-4 before:absolute before:left-0 before:content-['3.']"><strong className="text-text-primary">Falls back automatically</strong> if the primary tool is down or rate-limiting</li>
              <li className="relative pl-4 before:absolute before:left-0 before:content-['4.']"><strong className="text-text-primary">Returns structured results</strong> in a consistent format regardless of which tool ran</li>
            </ul>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">AgentPick: A Hosted Tool Router</h2>
            <p>
              AgentPick is a hosted tool router for AI agents. It currently routes to 23+ verified APIs across search, web crawl, embeddings, and finance data. Rankings are computed from real benchmark runs and production call data — not static presets.
            </p>

            {/* Routing strategies */}
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Routing Strategies</h3>
              </div>
              <div className="divide-y divide-[#F5F5F5]">
                {[
                  { name: 'auto', desc: 'Default. Routes to the highest benchmark score for the capability.' },
                  { name: 'best_performance', desc: 'Optimizes for answer quality and relevance score.' },
                  { name: 'cheapest', desc: 'Lowest cost per call with a minimum quality floor (3.0/10).' },
                  { name: 'most_stable', desc: 'Highest uptime and success rate. Good for production.' },
                  { name: 'balanced', desc: 'Weighted composite of quality, speed, cost, and stability.' },
                ].map((s) => (
                  <div key={s.name} className="flex items-start gap-4 px-5 py-3">
                    <code className="shrink-0 rounded bg-bg-secondary px-2 py-0.5 font-mono text-[12px] text-text-primary">{s.name}</code>
                    <span className="text-sm text-text-secondary">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">5-Minute Integration</h2>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#0F172A] p-5">
              <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Python — before and after</div>
              <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#E2E8F0]">{`# Before: hardcoded Tavily
from tavily import TavilyClient
results = TavilyClient(api_key=TAVILY_KEY).search(query)

# After: routed to current best tool
import agentpick
client = agentpick.Client(api_key='YOUR_AGENTPICK_KEY')
results = client.search(query)
# routes to Perplexity API today (score 7.0)
# auto-falls back to Exa, Tavily if needed
# tool_used tells you which API ran`}</pre>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#0F172A] p-5">
              <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">REST API — direct</div>
              <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#E2E8F0]">{`curl -X POST https://agentpick.dev/api/v1/router/search \\
  -H 'Authorization: Bearer YOUR_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"query": "latest AI models 2026", "strategy": "auto"}'

# {
#   "data": {
#     "results": [...],
#     "answer": "In 2026, the leading AI models are..."
#   },
#   "meta": { "tool_used": "perplexity-api", "latency_ms": 812 }
# }`}</pre>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What You Get Out of the Box</h2>
            <ul className="space-y-2 pl-4">
              <li className="relative pl-4 before:absolute before:left-0 before:content-['→']">Auto-routing to current #1 ranked tool (updates as benchmarks run)</li>
              <li className="relative pl-4 before:absolute before:left-0 before:content-['→']">Automatic fallback chain — if the primary fails, the next-best runs</li>
              <li className="relative pl-4 before:absolute before:left-0 before:content-['→']">Consistent response format across all tools</li>
              <li className="relative pl-4 before:absolute before:left-0 before:content-['→']">Call logs and dashboard at /dashboard/router</li>
              <li className="relative pl-4 before:absolute before:left-0 before:content-['→']">No per-tool API key management</li>
            </ul>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-2 font-[650] text-text-primary">Start routing in 5 minutes</h3>
              <p className="mb-3 text-sm text-text-secondary">
                500 calls/month free. No credit card. Works with Python, TypeScript, or direct REST.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/connect"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#18181B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#27272A] transition-colors"
                >
                  Get API key →
                </Link>
                <Link
                  href="/dashboard/router"
                  className="inline-flex items-center rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm font-medium text-text-secondary hover:border-[#D4D4D4] hover:text-text-primary transition-colors"
                >
                  View Router
                </Link>
              </div>
            </div>

          </div>
        </article>

        {/* Related posts */}
        <footer className="mt-12 border-t border-[#E5E5E5] pt-8">
          <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Related</h3>
          <div className="space-y-3">
            <Link href="/blog/best-search-api-for-ai-agents" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Best Search API for AI Agents: 2026 Benchmark Results →
            </Link>
            <Link href="/blog/perplexity-api-for-ai-agents" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Perplexity API for AI Agents: Benchmark &amp; Integration Guide →
            </Link>
            <Link href="/blog/5-routing-strategies-ai-agent-tool-selection" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              5 Routing Strategies for AI Agent Tool Selection →
            </Link>
          </div>
        </footer>

      </main>
    </div>
  );
}
