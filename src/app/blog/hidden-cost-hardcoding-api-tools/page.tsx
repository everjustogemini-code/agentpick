import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'The Hidden Cost of Hardcoding API Tools in Your Agent — AgentPick',
  description:
    'Hardcoded tool dependencies create invisible failure modes, lock-in, and mounting technical debt. Here\'s how to quantify and eliminate the hidden costs of brittle agent architecture.',
  openGraph: {
    title: 'The Hidden Cost of Hardcoding API Tools in Your Agent',
    description:
      'Hardcoded tool dependencies create invisible failure modes and lock-in. Quantifying the real cost and how to fix it.',
    url: 'https://agentpick.dev/blog/hidden-cost-hardcoding-api-tools',
    images: [{ url: '/api/og?v=2', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Hidden Cost of Hardcoding API Tools in Your Agent',
    description: 'You\'re paying more than you think for that hardcoded Tavily call.',
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
          <span>Engineering</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: '#F9731620', color: '#F97316' }}>
              Engineering
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 6, 2026 · 6 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            The Hidden Cost of Hardcoding API Tools in Your Agent
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            That hardcoded <code className="rounded bg-bg-secondary px-1.5 py-0.5 text-sm font-mono text-text-primary">tavily.search()</code> call feels innocent. Here&apos;s what it&apos;s actually costing you.
          </p>
        </header>

        <article className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

          <p>
            The first version of every agent has hardcoded tools. It makes sense — you&apos;re validating the concept, not building infrastructure. You find a good search API, you call it directly, and it works.
          </p>
          <p>
            Then you ship to production. And slowly, silently, the costs accumulate.
          </p>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Cost #1: Outage Amplification</h2>
          <p>
            Every API you hardcode becomes a single point of failure. When it goes down, your agent goes down with it.
          </p>
          <p>
            In 2025, the major search APIs averaged approximately 99.3% uptime — that&apos;s about 61 hours of downtime per year. If your agent runs continuously and depends on a single search API, you&apos;re looking at 61 hours of agent downtime. For a production service that translates to real user impact.
          </p>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Uptime Math</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Single API (99.3% uptime)</span>
                <span className="font-mono text-text-primary">~61 hrs/yr downtime</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">2 APIs with fallback</span>
                <span className="font-mono text-[#10B981]">~0.26 hrs/yr downtime</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">3 APIs with fallback</span>
                <span className="font-mono text-[#10B981]">~0.001 hrs/yr downtime</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-text-dim">Assuming independent failure. Two providers at 99.3% = 99.9951% combined uptime.</p>
          </div>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Cost #2: Paying for Suboptimal Performance</h2>
          <p>
            APIs are not uniformly good. Tavily outperforms Brave on finance queries by ~32% on relevance. Exa outperforms Tavily on academic/technical queries by ~21%. If you&apos;re hardcoded to one provider, you&apos;re consistently leaving quality on the table for large portions of your query mix.
          </p>
          <p>
            For a research agent processing 10K queries/month with a mix of query types, the relevance gap between a hardcoded provider and optimal routing translates to meaningfully worse output quality — and that has real downstream effects on whatever your agent is producing.
          </p>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Cost #3: Invisible Overspending</h2>
          <p>
            Without cost tracking at the tool level, you don&apos;t know what your agent stack costs. We&apos;ve talked to teams who had no idea they were spending $800/month on search API calls until they started measuring.
          </p>
          <p>
            The fix isn&apos;t always obvious either. Sometimes it&apos;s a single query pattern that&apos;s expensive — long queries, high <code className="rounded bg-bg-secondary px-1.5 py-0.5 text-sm font-mono text-text-primary">max_results</code> settings, or a runaway retry loop. You can&apos;t fix what you can&apos;t see.
          </p>

          <div className="rounded-xl bg-[#0A0A0A] p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#64748B]">Python — Adding cost visibility (the hard way)</div>
            <pre className="overflow-x-auto text-[13px] text-[#E2E8F0]"><code>{`# You'd have to write this yourself for every tool
import time

class CostTrackedTavily:
    COST_PER_CALL = 0.001  # Update when pricing changes
    
    def __init__(self):
        self.total_calls = 0
        self.total_cost = 0
    
    def search(self, query: str) -> dict:
        t0 = time.time()
        try:
            result = tavily_client.search(query)
            self.total_calls += 1
            self.total_cost += self.COST_PER_CALL
            return result
        except Exception as e:
            # Raises. No fallback.
            raise
    
    def report(self):
        print(f"Calls: {self.total_calls}, Cost: \${self.total_cost:.2f}")`}</code></pre>
          </div>

          <p>
            This is the kind of boilerplate you write once, then forget to update when pricing changes, then forget to add to your new tools, then lose track of entirely.
          </p>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Cost #4: The Migration Tax</h2>
          <p>
            When you decide to switch or add a search provider — and you will — you have to find every hardcoded call, understand its context, rewrite it, and test the change. In a large codebase, this is a week of work.
          </p>
          <p>
            If you have a routing layer, it&apos;s a one-line config change.
          </p>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">The Fix: One Routing Layer</h2>

          <div className="rounded-xl bg-[#0A0A0A] p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#64748B]">Python — Route through AgentPick (removes all four costs)</div>
            <pre className="overflow-x-auto text-[13px] text-[#E2E8F0]"><code>{`import requests

# One routing layer. All four costs eliminated.
def search(query: str, domain: str = None) -> dict:
    r = requests.post(
        "https://agentpick.dev/api/v1/route/search",
        headers={"Authorization": "Bearer YOUR_AP_KEY"},
        json={"params": {"query": query, "domain": domain}}
    )
    return r.json()

# ✅ Auto-fallback if any provider goes down
# ✅ Best provider selected per query type
# ✅ Full cost tracking at agentpick.dev/dashboard
# ✅ Switch providers via config, not code changes`}</code></pre>
          </div>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What to Do This Week</h2>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="space-y-3">
              {[
                'Audit your agent code for hardcoded API client calls. Grep for import tavily, import openai, requests.get("https://api.',
                'Add a thin router wrapper around your top 2-3 tool calls. Even without fallback, the abstraction pays dividends.',
                'Connect to AgentPick to get free cost visibility across all your tool calls.',
                'Add a second provider as fallback for your most critical tool (search is usually the best starting point).',
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="font-mono text-[10px] font-bold text-text-dim mt-0.5 shrink-0">0{i+1}</span>
                  <p className="text-sm text-text-secondary">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <p>
            The hardcoded tool call that gets you from 0 to demo is the same one that becomes your biggest reliability risk in production. The sooner you add the routing layer, the less it costs.
          </p>

          <div className="flex gap-3">
            <Link
              href="/connect"
              className="rounded-lg bg-[#0A0A0A] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Add routing now →
            </Link>
            <Link
              href="/dashboard/router"
              className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-text-secondary hover:border-[#D4D4D4] transition-colors"
            >
              See cost dashboard →
            </Link>
          </div>

        </article>

        <div className="mt-12 rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-[650] tracking-[-0.3px] text-text-primary">
            See exactly what your agent tool stack is costing you
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            Connect in 5 minutes. Free dashboard with per-tool cost tracking, latency, and success rates.
          </p>
          <Link
            href="/connect"
            className="mt-5 inline-block rounded-lg bg-[#0A0A0A] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Connect Your Agent →
          </Link>
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
