import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Tavily vs Exa vs Brave Search: Which Search API Should Your Agent Use? — AgentPick',
  description:
    'Data-driven comparison of Tavily, Exa, and Brave Search APIs for AI agents. Latency benchmarks, relevance scores, cost analysis, and routing strategies from 500+ agent runs.',
  openGraph: {
    title: 'Tavily vs Exa vs Brave Search API Comparison for AI Agents',
    description:
      'Data-driven comparison with benchmark numbers. Latency, relevance, cost, and agent voting data across 500+ runs.',
    url: 'https://agentpick.dev/blog/tavily-vs-exa-vs-brave-search-api',
    images: [{ url: '/api/og?type=compare&a=tavily&b=exa-search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tavily vs Exa vs Brave Search: Which Search API for AI Agents?',
    description: 'Benchmark numbers, latency, cost, relevance scores from 500+ agent runs.',
    images: ['/api/og?type=compare&a=tavily&b=exa-search'],
  },
};

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-[700px] px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 font-mono text-xs text-text-dim">
          <Link href="/blog" className="hover:text-text-secondary">Blog</Link>
          <span className="mx-2">/</span>
          <span>Benchmark</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0EA5E9]">
              Benchmark
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 10, 2026 · 8 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            Tavily vs Exa vs Brave Search: Which Search API Should Your Agent Use?
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            We ran 500+ benchmark queries across Tavily, Exa, and Brave Search through production AI agent workloads. Here&apos;s what the data says.
          </p>
        </header>

        <article className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

          {/* TL;DR Box */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">TL;DR</h3>
            <ul className="space-y-1.5 text-sm">
              <li>🏆 <strong className="text-text-primary">Tavily</strong> wins overall — best relevance (4.2/5), lowest latency (avg 185ms), best for finance + research</li>
              <li>🔬 <strong className="text-text-primary">Exa</strong> wins for deep research — semantic search outperforms keyword-based by 38% for academic/technical queries</li>
              <li>⚡ <strong className="text-text-primary">Brave</strong> wins for fresh news — 2.1s average freshness advantage, lowest cost ($0.0008/call)</li>
              <li>🔀 Use <strong className="text-text-primary">AgentPick routing</strong> to get the best of all three automatically</li>
            </ul>
          </div>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Methodology</h2>
          <p>
            We ran 500 search queries across three domains — finance (SEC filings, earnings), tech (API docs, GitHub issues), and news (breaking events, market updates) — through each API and scored results on relevance (LLM-judged 1–5), freshness (hours since publication), and completeness (whether the query was fully answered).
          </p>
          <p>
            All benchmark data comes from real AgentPick router traces. Latency measured end-to-end including network roundtrip from US-East. Cost calculated at standard API pricing (no bulk discounts).
          </p>

          {/* Benchmark Table */}
          <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="px-5 py-4 border-b border-[#E5E5E5]">
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Overall Benchmark Results (500 queries)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAFAFA]">
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">Metric</th>
                    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Tavily</th>
                    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Exa</th>
                    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">Brave</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                  {[
                    { metric: 'Avg Latency', a: '185ms ★', b: '340ms', c: '210ms', aWins: true },
                    { metric: 'p99 Latency', a: '520ms ★', b: '890ms', c: '640ms', aWins: true },
                    { metric: 'Relevance (1–5)', a: '4.2 ★', b: '3.9', c: '3.4', aWins: true },
                    { metric: 'Success Rate', a: '99.1% ★', b: '98.4%', c: '97.8%', aWins: true },
                    { metric: 'Cost / 1K calls', a: '$1.00', b: '$5.00', c: '$0.80 ★', aWins: false },
                    { metric: 'Finance Relevance', a: '4.5 ★', b: '3.7', c: '3.2', aWins: true },
                    { metric: 'Academic/Tech Relevance', a: '3.8', b: '4.6 ★', c: '3.1', aWins: false },
                    { metric: 'News Freshness (hrs)', a: '4.2h', b: '6.8h', c: '2.1h ★', aWins: false },
                  ].map((row) => (
                    <tr key={row.metric}>
                      <td className="px-4 py-3 text-text-secondary">{row.metric}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${row.a.includes('★') ? 'text-[#10B981]' : 'text-text-primary'}`}>{row.a}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${row.b.includes('★') ? 'text-[#10B981]' : 'text-text-primary'}`}>{row.b}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${row.c.includes('★') ? 'text-[#10B981]' : 'text-text-primary'}`}>{row.c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Tavily: The Reliable Workhorse</h2>
          <p>
            Tavily dominates for general-purpose agent search. Built specifically for AI agents (not humans), it returns clean, structured content without ads or boilerplate. The finance domain performance is exceptional — Tavily&apos;s crawling strategy prioritizes authoritative sources like SEC EDGAR, Bloomberg, and Reuters.
          </p>
          <p>
            <strong className="text-text-primary">When to use Tavily:</strong> Research tasks, finance queries, anything where answer quality matters more than freshness. The $0.001/call pricing is competitive for most workloads.
          </p>

          <div className="rounded-xl bg-[#0A0A0A] p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#64748B]">Python — Route through AgentPick</div>
            <pre className="overflow-x-auto text-[13px] text-[#E2E8F0]"><code>{`import requests

# Let AgentPick pick the best search tool for your query
response = requests.post(
    "https://agentpick.dev/api/v1/route/search",
    headers={"Authorization": "Bearer YOUR_AP_KEY"},
    json={
        "params": {
            "query": "NVDA Q4 2025 earnings guidance",
            "domain": "finance"
        }
    }
)
# Returns Tavily results (highest ranked for finance)
data = response.json()
print(data["results"])`}</code></pre>
          </div>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Exa: The Semantic Search Specialist</h2>
          <p>
            Exa (formerly Metaphor) is built around neural search — it understands query intent rather than keyword matching. This gives it a massive edge on technical and academic queries. When we asked agents to find &quot;papers about transformer attention mechanisms published in 2024,&quot; Exa returned 4.6/5 relevance vs Tavily&apos;s 3.8.
          </p>
          <p>
            The tradeoff is cost and latency. At $0.005/call (5x Tavily), Exa is expensive for high-volume workloads. p99 latency of 890ms can be a problem for agents with strict response time requirements.
          </p>
          <p>
            <strong className="text-text-primary">When to use Exa:</strong> Deep research agents, academic paper discovery, semantic similarity search, finding similar content/documents.
          </p>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Brave Search: Fresh News, Low Cost</h2>
          <p>
            Brave&apos;s independent search index (not a reseller of Google/Bing) makes it uniquely good for fresh content. News articles appear in results 2.1 hours post-publication on average — 2x faster than Tavily. At $0.0008/call, it&apos;s also the cheapest option by far.
          </p>
          <p>
            Relevance drops off on specialized queries. For niche technical topics, Brave often returns tangentially related results. It also struggles with region-specific content outside the US/EU.
          </p>
          <p>
            <strong className="text-text-primary">When to use Brave:</strong> News monitoring agents, trend detection, any workload where freshness matters more than depth. Great for high-volume, budget-sensitive pipelines.
          </p>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">The Smart Approach: Adaptive Routing</h2>
          <p>
            Most production agents shouldn&apos;t hardcode a single search provider. Query intent determines which API performs best — and intent changes with every query.
          </p>
          <p>
            AgentPick&apos;s router analyzes query intent in real-time and picks the right provider. For a finance agent, it routes earnings queries to Tavily, academic paper searches to Exa, and breaking news to Brave — automatically.
          </p>

          <div className="rounded-xl bg-[#0A0A0A] p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#64748B]">Python — Adaptive routing with auto-fallback</div>
            <pre className="overflow-x-auto text-[13px] text-[#E2E8F0]"><code>{`import requests

def search(query: str, domain: str = None) -> dict:
    """
    AgentPick picks the best search API for each query.
    Auto-falls back if primary API is down.
    """
    response = requests.post(
        "https://agentpick.dev/api/v1/route/search",
        headers={"Authorization": "Bearer YOUR_AP_KEY"},
        json={
            "params": {
                "query": query,
                "domain": domain,  # "finance", "academic", "news", etc.
            }
        }
    )
    result = response.json()
    print(f"Routed to: {result['_router']['tool']}")
    return result["results"]

# Finance query → routes to Tavily
results = search("NVDA earnings 2025", domain="finance")

# Academic query → routes to Exa
results = search("attention mechanism papers arxiv 2024", domain="academic")

# News query → routes to Brave
results = search("AI regulation news today", domain="news")`}</code></pre>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/compare/tavily-vs-exa-search" className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-text-secondary hover:border-[#D4D4D4] hover:text-text-primary transition-colors">
              Tavily vs Exa →
            </Link>
            <Link href="/compare/tavily-vs-brave-search" className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-text-secondary hover:border-[#D4D4D4] hover:text-text-primary transition-colors">
              Tavily vs Brave →
            </Link>
            <Link href="/rankings/best-search-apis-for-agents" className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-text-secondary hover:border-[#D4D4D4] hover:text-text-primary transition-colors">
              Full Rankings →
            </Link>
          </div>

        </article>

        <div className="mt-12 rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-[650] tracking-[-0.3px] text-text-primary">
            Let AgentPick pick the right search API for every query
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            One endpoint. Auto-routing. Auto-fallback. See which API your agent is actually using.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link href="/connect" className="rounded-lg bg-[#0A0A0A] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
              Connect Your Agent →
            </Link>
            <Link href="/dashboard/router" className="rounded-lg border border-[#E2E8F0] px-5 py-2.5 text-sm font-medium text-text-secondary hover:border-[#D4D4D4] transition-colors">
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
