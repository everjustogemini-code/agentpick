import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'How to Reduce Search API Costs for AI Agents (2026) — AgentPick',
  description:
    'AI agents can overpay for search API calls by 3–5x. Learn how to reduce search API costs with query-type routing, cheap-first fallback, and budget-aware strategies. Based on 750+ benchmark runs.',
  openGraph: {
    title: 'How to Reduce Search API Costs for AI Agents (2026)',
    description:
      'Stop overpaying for search API calls. Route cheap queries to Brave ($0.0008/call), save Perplexity for quality-critical queries. Real benchmark data.',
    url: 'https://agentpick.dev/blog/reduce-ai-agent-search-costs',
    images: [{ url: '/api/og?type=blog&slug=reduce-ai-agent-search-costs', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Reduce Search API Costs for AI Agents (2026)',
    description: 'Route cheap queries to Brave, save Perplexity for quality-critical calls. Real cost data from 750+ benchmark runs.',
    images: ['/api/og?type=blog&slug=reduce-ai-agent-search-costs'],
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
          <span>How to reduce search API costs for AI agents</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-[#F0FFF4] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-green-700">
              Cost
            </span>
            <span className="font-mono text-[11px] text-text-dim">May 30, 2026</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            How to Reduce Search API Costs for AI Agents (2026)
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            Most AI agents overpay for search by 3–5x. The fix is not switching to a cheaper API —
            it is routing each query to the cheapest option that is still good enough for that
            specific query type. Here is how to do it, based on 750+ benchmark runs and 5,650+
            production calls.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Why agents overpay for search</h2>

            <p>
              The default pattern is to pick one search API — usually Tavily or Perplexity — and
              use it for every query. That works, but it is expensive.
            </p>
            <p>
              The problem: not all queries need the same quality level. A fact-check query and a
              simple news lookup have very different quality requirements, but if you hardcode
              Perplexity, you pay the same rate for both.
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Search API Cost Comparison — May 2026</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Cost/call</th>
                      <th className="px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Quality score</th>
                      <th className="px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Best use case</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-text-primary">Perplexity API</td>
                      <td className="px-4 py-3 font-mono text-text-primary">~$0.005</td>
                      <td className="px-4 py-3 font-mono font-bold text-green-600">7.0</td>
                      <td className="px-4 py-3 text-text-dim">Quality-critical research</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-text-primary">Haystack</td>
                      <td className="px-4 py-3 font-mono text-text-primary">~$0.004</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#0EA5E9]">6.9</td>
                      <td className="px-4 py-3 text-text-dim">Structured retrieval</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-text-primary">Exa Search</td>
                      <td className="px-4 py-3 font-mono text-text-primary">~$0.003</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#0EA5E9]">6.4</td>
                      <td className="px-4 py-3 text-text-dim">Speed-first, high volume</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-text-primary">Tavily</td>
                      <td className="px-4 py-3 font-mono text-text-primary">~$0.002</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#F59E0B]">6.1</td>
                      <td className="px-4 py-3 text-text-dim">Finance, business research</td>
                    </tr>
                    <tr className="bg-[#F0FFF4]">
                      <td className="px-4 py-3 font-semibold text-text-primary">Brave Search</td>
                      <td className="px-4 py-3 font-mono font-bold text-green-700">$0.0008</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#F97316]">5.8</td>
                      <td className="px-4 py-3 text-text-dim">Cost-sensitive, news, monitoring</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-text-dim">Scores from 750+ AgentPick benchmark runs. Cost estimates based on public pricing tiers.</p>
            </div>

            <p>
              Brave Search costs roughly 6x less than Perplexity per call. Its quality score (5.8)
              is 17% lower — but for many query types, 5.8 is more than good enough.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">The cost reduction playbook</h2>

            <p>
              There are three tactics you can apply, from simplest to most complete:
            </p>

            <div className="space-y-4">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-text-dim">Tactic 1 — Cheapest first, escalate on failure</div>
                <p className="text-sm text-text-secondary mb-3">
                  Route every query to Brave Search first. If it returns low-confidence results (or
                  fails), escalate to Tavily or Exa. Only use Perplexity for queries that actually
                  need maximum quality.
                </p>
                <div className="rounded-lg bg-[#0F172A] p-4 font-mono text-[12px]">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-[#64748B]">cheap-first escalation</div>
                  <pre className="overflow-x-auto leading-relaxed text-[#94A3B8]">{`result = brave.search(query)
if result.confidence < 0.7:
    result = exa.search(query)
if result.confidence < 0.8:
    result = perplexity.search(query)`}</pre>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-text-dim">Tactic 2 — Route by query type</div>
                <p className="text-sm text-text-secondary mb-3">
                  Classify each query before routing. News and monitoring queries get Brave (cheap,
                  fast, fresh). Finance queries get Tavily (domain advantage). Research queries
                  get Perplexity (quality-first).
                </p>
                <div className="rounded-lg bg-[#0F172A] p-4 font-mono text-[12px]">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-[#64748B]">query-type routing</div>
                  <pre className="overflow-x-auto leading-relaxed text-[#94A3B8]">{`query_type = classify(query)  # news/finance/research
if query_type == 'news':
    return brave.search(query)   # $0.0008
elif query_type == 'finance':
    return tavily.search(query)  # $0.002
else:
    return perplexity.search(query)  # $0.005`}</pre>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0EA5E9]">Tactic 3 — Auto-routing with budget cap</div>
                <p className="text-sm text-text-secondary mb-3">
                  Let AgentPick handle routing automatically with a budget strategy. The router
                  classifies queries, picks the best-ranked option within your budget, and falls
                  back automatically.
                </p>
                <div className="rounded-lg bg-[#0F172A] p-4 font-mono text-[12px]">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-[#64748B]">auto-routing with budget</div>
                  <pre className="overflow-x-auto leading-relaxed text-[#94A3B8]">{`results = agentpick.search(
    query=q,
    strategy='budget'  # prefers lower-cost options
)
# Routes to Brave for news, Tavily for finance,
# Perplexity only when quality matters most`}</pre>
                </div>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Real cost savings at scale</h2>

            <p>
              If your agent runs 10,000 search calls/month and 60% are news or simple lookups:
            </p>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Cost Comparison — 10K calls/month</h3>
              </div>
              <div className="divide-y divide-[#F5F5F5]">
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-dim">Hardcoded Perplexity (all queries)</span>
                  <span className="font-mono font-bold text-text-primary">~$50/mo</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-text-dim">Routed: 60% Brave + 40% Perplexity</span>
                  <span className="font-mono font-bold text-green-600">~$25/mo</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm bg-[#F0FFF4]">
                  <span className="font-[650] text-text-primary">Savings</span>
                  <span className="font-mono font-bold text-green-700">~$25/mo (50%)</span>
                </div>
              </div>
            </div>

            <p>
              The savings compound as call volume grows. At 100K calls/month the difference is
              ~$250/month. At 1M calls, it is over $2,500/month — enough to justify building
              proper routing logic.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">When not to optimize for cost</h2>

            <p>
              Cost optimization is the wrong priority when your agent&apos;s output quality directly
              drives revenue or safety decisions. For research agents producing reports that users
              pay for, the quality gap between Brave (5.8) and Perplexity (7.0) may be unacceptable.
            </p>
            <p>
              The rule: optimize for cost on queries where a 5.8/10 result is good enough.
              Spend on Perplexity only when quality above 6.5 actually changes the outcome.
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-dim">Cost vs quality cheat sheet</h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-44 shrink-0">News monitoring</span>
                  <span className="font-[650] text-text-primary">Brave ($0.0008) — freshness matters, quality threshold is low</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-44 shrink-0">High-volume first pass</span>
                  <span className="font-[650] text-text-primary">Exa ($0.003) — 50% faster, good for triage</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-44 shrink-0">Finance research</span>
                  <span className="font-[650] text-text-primary">Tavily ($0.002) — domain advantage, 4,400+ production calls</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-44 shrink-0">Quality-critical research</span>
                  <span className="font-[650] text-text-primary">Perplexity ($0.005) — #1 at 7.0, worth the premium</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-mono text-text-dim w-44 shrink-0">Mixed workload</span>
                  <span className="font-[650] text-text-primary">AgentPick auto-routing — picks the right option per query</span>
                </div>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Using AgentPick budget strategy</h2>

            <p>
              AgentPick&apos;s budget strategy does query-type routing automatically. Register once,
              set{' '}
              <code className="font-mono text-sm bg-[#F1F5F9] px-1.5 py-0.5 rounded">strategy=budget</code>
              {' '}and the router handles classification and cost-aware selection. No custom
              routing logic required.
            </p>

            <div className="rounded-xl bg-[#0F172A] p-5 font-mono text-sm">
              <div className="mb-2 text-[11px] uppercase tracking-wider text-[#64748B]">budget-aware routing via AgentPick</div>
              <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#94A3B8]">{`import agentpick

client = agentpick.Client(api_key='your-key')

# Cost-aware routing — picks cheapest option
# that meets quality threshold for this query type
result = client.search(
    query='latest AI funding news',
    strategy='budget'
)

# For quality-critical queries, use best_performance
result = client.search(
    query='comprehensive analysis of transformer architectures',
    strategy='best_performance'
)`}</pre>
            </div>

            <p>
              Free tier is 500 calls/month with no credit card required. The budget strategy
              is available on all plans.
            </p>

            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <Link
                href="/connect"
                className="rounded-lg bg-[#0EA5E9] px-5 py-2.5 font-mono text-sm font-semibold text-white hover:bg-[#0284C7]"
              >
                Get API Key →
              </Link>
              <Link
                href="/reports/weekly/2026-05-30"
                className="rounded-lg border border-[#E2E8F0] px-5 py-2.5 font-mono text-sm font-semibold text-text-secondary hover:border-[#CBD5E1]"
              >
                Latest Benchmark Report
              </Link>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0]">
              <p className="text-sm text-text-dim">
                Related:{' '}
                <Link href="/blog/how-to-choose-search-api-for-ai-agent" className="text-[#0EA5E9] hover:underline">How to choose a search API for your agent</Link>
                {' · '}
                <Link href="/blog/auto-fallback-agentpick-keeps-agent-running" className="text-[#0EA5E9] hover:underline">Auto-fallback: keeping agents running</Link>
                {' · '}
                <Link href="/blog/hidden-cost-hardcoding-api-tools" className="text-[#0EA5E9] hover:underline">The hidden cost of hardcoding API tools</Link>
              </p>
            </div>

          </div>
        </article>
      </main>
    </div>
  );
}
