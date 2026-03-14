import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Why Your AI Agent Needs a Tool Router (And How to Build One) — AgentPick',
  description:
    'Hardcoding API calls is the fastest way to build a fragile agent. Learn how a tool router adds resilience, observability, and intelligence to your agent stack with practical code examples.',
  openGraph: {
    title: 'Why Your AI Agent Needs a Tool Router',
    description:
      'Hardcoding API calls is the fastest way to build a fragile agent. Learn how to build a tool router with auto-fallback and smart routing.',
    url: 'https://agentpick.dev/blog/why-your-ai-agent-needs-a-tool-router',
    images: [{ url: '/api/og?v=2', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Why Your AI Agent Needs a Tool Router',
    description: "Hardcoded API calls create fragile agents. Here's how to fix it.",
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
            <span className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}>
              Architecture
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 8, 2026 · 7 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            Why Your AI Agent Needs a Tool Router (And How to Build One)
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            The single architectural decision that separates brittle agent demos from production-grade agent systems.
          </p>
        </header>

        <article className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

          <p>
            Every AI agent I&apos;ve seen fail in production fails the same way: it calls an API, the API returns an error (or returns garbage), and the whole pipeline crashes. There&apos;s no fallback. No retry logic. No observability. Just a silent failure and a confused user.
          </p>
          <p>
            The fix isn&apos;t better error handling on individual calls. It&apos;s a tool router — a layer between your agent and its tool dependencies that handles selection, fallback, observability, and optimization in one place.
          </p>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What a Tool Router Actually Does</h2>
          <p>
            A tool router sits between your agent&apos;s intent (&quot;I need to search for X&quot;) and the specific API implementation (&quot;call Tavily with this request&quot;). It owns four responsibilities:
          </p>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="space-y-4">
              {[
                { num: '01', title: 'Selection', desc: 'Choose the best tool for the current query context — not just globally, but for this specific type of request right now.' },
                { num: '02', title: 'Fallback', desc: "If the primary tool fails (error, timeout, rate limit), automatically retry with an alternative without surfacing the failure to your agent." },
                { num: '03', title: 'Observability', desc: "Record every call — which tool, latency, success/fail, cost — so you can understand what's actually happening in production." },
                { num: '04', title: 'Optimization', desc: 'Learn from historical performance to improve routing decisions over time. Your search router should know Tavily is faster on Mondays.' },
              ].map((item) => (
                <div key={item.num} className="flex gap-4">
                  <span className="font-mono text-[10px] font-bold text-text-dim mt-0.5 shrink-0">{item.num}</span>
                  <div>
                    <span className="font-semibold text-text-primary">{item.title}:</span>{' '}
                    <span>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">The Naive Approach (And Why It Fails)</h2>
          <p>Most agent code looks like this:</p>

          <div className="rounded-xl bg-[#0A0A0A] p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#64748B]">Python — The fragile way</div>
            <pre className="overflow-x-auto text-[13px] text-[#E2E8F0]"><code>{`import tavily

def research_agent(query: str) -> str:
    # Hardcoded. No fallback. No observability.
    results = tavily.search(query, api_key=TAVILY_KEY)
    return summarize(results)

# What happens when:
# - Tavily is down? → Agent crashes
# - Tavily rate-limits you? → Agent crashes
# - A better search API launches? → Need to rewrite
# - You want to know your search costs? → ???`}</code></pre>
          </div>

          <p>
            This code works in a demo. In production, it&apos;s a liability. Tavily has had three multi-hour outages in the past 12 months. At peak usage, you&apos;ll hit rate limits. And you have no visibility into what&apos;s happening.
          </p>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Building a Simple Tool Router</h2>
          <p>Here&apos;s a minimal tool router you can implement yourself:</p>

          <div className="rounded-xl bg-[#0A0A0A] p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#64748B]">Python — Simple tool router</div>
            <pre className="overflow-x-auto text-[13px] text-[#E2E8F0]"><code>{`import time
from typing import Optional

class SearchRouter:
    PROVIDERS = [
        {"name": "tavily", "fn": "_search_tavily", "priority": 1},
        {"name": "brave",  "fn": "_search_brave",  "priority": 2},
        {"name": "exa",    "fn": "_search_exa",    "priority": 3},
    ]

    def search(self, query: str) -> Optional[dict]:
        for provider in sorted(self.PROVIDERS, key=lambda p: p["priority"]):
            try:
                t0 = time.time()
                results = getattr(self, provider["fn"])(query)
                latency = int((time.time() - t0) * 1000)
                self._record(provider["name"], True, latency)
                return results
            except Exception as e:
                self._record(provider["name"], False, 0, str(e))
                continue
        raise RuntimeError("All search providers failed")

    def _record(self, tool, success, latency_ms, error=None):
        print(f"[router] {tool}: success={success} latency={latency_ms}ms")`}</code></pre>
          </div>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Using AgentPick as Your Tool Router</h2>
          <p>
            AgentPick is a managed tool router for AI agents. Instead of building and maintaining routing logic yourself, you route calls through AgentPick&apos;s API:
          </p>

          <div className="rounded-xl bg-[#0A0A0A] p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#64748B]">Python — Managed routing via AgentPick</div>
            <pre className="overflow-x-auto text-[13px] text-[#E2E8F0]"><code>{`import requests

class SearchRouter:
    def __init__(self, ap_key: str):
        self.ap_key = ap_key
        self.base = "https://agentpick.dev/api/v1"

    def search(self, query: str, domain: str = None) -> dict:
        """
        Routes to the best search API for the query.
        Auto-fallback if primary goes down.
        Full observability at agentpick.dev/dashboard
        """
        response = requests.post(
            f"{self.base}/route/search",
            headers={"Authorization": f"Bearer {self.ap_key}"},
            json={"params": {"query": query, "domain": domain}},
            timeout=10
        )
        response.raise_for_status()
        result = response.json()
        # result["_router"]["tool"] = which API was used
        # result["_router"]["fallback"] = True if primary failed
        return result

router = SearchRouter(ap_key="ah_live_sk_...")
results = router.search("SEC 10-K NVDA 2025", domain="finance")`}</code></pre>
          </div>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What You Get from a Managed Router</h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '⚡', title: 'Zero downtime', desc: 'Auto-fallback across 3+ providers per category' },
              { icon: '📊', title: 'Full observability', desc: 'Dashboard with latency, cost, and success rates' },
              { icon: '🧠', title: 'Smart selection', desc: 'ML routing picks best provider per query type' },
              { icon: '💰', title: 'Cost tracking', desc: 'Know exactly what your agent tool stack costs' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <span className="text-lg">{item.icon}</span>
                <p className="mt-1 font-semibold text-sm text-text-primary">{item.title}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">When to Build vs Buy</h2>
          <p>
            Build your own router if: you have very specific routing logic, you need to route over private/on-prem tools, or you&apos;re in a regulated environment where API calls can&apos;t go through third-party services.
          </p>
          <p>
            Use a managed router if: you want production reliability without maintaining infrastructure, you need observability across tools, or you want your routing logic to improve over time without manual work.
          </p>
          <p>
            Either way, the routing layer is the most important architectural decision you&apos;ll make for your agent. Get it right early.
          </p>

          <div className="flex gap-3">
            <Link href="/connect" className="rounded-lg bg-[#0A0A0A] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
              Set up routing →
            </Link>
            <Link href="/dashboard/router" className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-text-secondary hover:border-[#D4D4D4] transition-colors">
              See the dashboard →
            </Link>
          </div>

        </article>

        <div className="mt-12 rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-[650] tracking-[-0.3px] text-text-primary">
            Add a production-grade tool router in 5 minutes
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            No infrastructure to maintain. Auto-fallback, smart routing, full observability out of the box.
          </p>
          <Link href="/connect" className="mt-5 inline-block rounded-lg bg-[#0A0A0A] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
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
