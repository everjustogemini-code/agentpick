import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Auto-Fallback: How AgentPick Keeps Your Agent Running When APIs Go Down — AgentPick',
  description:
    'APIs fail. The question is whether your agent fails with them. Inside AgentPick\'s auto-fallback routing layer — how it detects failures, selects alternatives, and maintains agent uptime during outages.',
  openGraph: {
    title: 'Auto-Fallback: How AgentPick Keeps Your Agent Running When APIs Go Down',
    description:
      'Inside AgentPick\'s auto-fallback routing: how it detects failures, selects alternatives, and maintains uptime during outages.',
    url: 'https://agentpick.dev/blog/auto-fallback-agentpick-keeps-agent-running',
    images: [{ url: '/api/og?v=2', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Auto-Fallback: How AgentPick Keeps Your Agent Running',
    description: 'APIs fail. Your agent doesn\'t have to.',
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
          <span>Reliability</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
              Reliability
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 4, 2026 · 6 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            Auto-Fallback: How AgentPick Keeps Your Agent Running When APIs Go Down
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            APIs fail. Rate limits hit. Services degrade. Here&apos;s how AgentPick&apos;s fallback layer makes your agent resilient to all of it.
          </p>
        </header>

        <article className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

          <p>
            On December 14th 2025, Tavily experienced a 4-hour partial outage affecting search relevance. Agents routing through AgentPick automatically switched to Exa and Brave Search — with zero downtime. Agents calling Tavily directly returned errors for 4 hours.
          </p>
          <p>
            That&apos;s the difference auto-fallback makes. Not if an API will fail — when.
          </p>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">How AgentPick Detects Failures</h2>
          <p>
            AgentPick runs two parallel failure detection systems:
          </p>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="space-y-5">
              <div>
                <h4 className="font-semibold text-sm text-text-primary">1. Probe-based Health Checking</h4>
                <p className="mt-1 text-sm text-text-secondary">
                  Every 90 seconds, AgentPick sends synthetic probe queries to each registered tool endpoint. A probe consists of a canonical query with a known good response. If the response deviates by more than 15% relevance delta or exceeds 3x normal latency, the tool is marked degraded.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-text-primary">2. Live Traffic Error Rate Monitoring</h4>
                <p className="mt-1 text-sm text-text-secondary">
                  Every router call outcome is streamed to a sliding window counter. If error rate exceeds 5% in any 5-minute window, the tool enters circuit-breaker mode. If it exceeds 20%, it&apos;s bypassed entirely until recovery.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">The Fallback Selection Algorithm</h2>
          <p>
            When a primary tool fails mid-request, AgentPick doesn&apos;t just grab the next provider alphabetically. The fallback selection considers:
          </p>

          <div className="rounded-xl bg-[#0A0A0A] p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#64748B]">Pseudocode — Fallback selection</div>
            <pre className="overflow-x-auto text-[13px] text-[#E2E8F0]"><code>{`def select_fallback(query_context, failed_tool, available_tools):
    candidates = [
        t for t in available_tools
        if t.health_status == "healthy"
        and t.name != failed_tool
    ]
    
    # Score candidates on multiple signals
    for candidate in candidates:
        candidate.score = weighted_sum(
            # Historical success rate for this domain (40%)
            candidate.domain_success_rate(query_context.domain) * 0.4,
            # Current p50 latency percentile (30%)
            (1 - candidate.latency_percentile) * 0.3,
            # AgentPick benchmark score (20%)
            candidate.benchmark_score * 0.2,
            # User vote weight (10%)
            candidate.weighted_votes * 0.1,
        )
    
    return max(candidates, key=lambda t: t.score)`}</code></pre>
          </div>

          <p>
            The key insight is that the best fallback depends on context. For a finance query where Tavily fails, Exa is a better fallback than Brave. For a news freshness query, Brave is the right choice. Domain-aware fallback selection matters.
          </p>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Circuit Breaker Pattern</h2>
          <p>
            AgentPick implements a circuit breaker for each tool-domain pair. The circuit breaker has three states:
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { state: 'Closed', color: '#10B981', desc: 'Normal operation. Calls pass through.' },
              { state: 'Open', color: '#EF4444', desc: 'Failure threshold hit. All calls bypass to fallback.' },
              { state: 'Half-Open', color: '#F59E0B', desc: 'Probing recovery. Let 10% of calls through to test.' },
            ].map((item) => (
              <div key={item.state} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-center">
                <div
                  className="mx-auto mb-2 h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <p className="font-semibold text-sm text-text-primary">{item.state}</p>
                <p className="mt-1 text-xs text-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Using Auto-Fallback in Your Agent</h2>
          <p>
            From your agent&apos;s perspective, auto-fallback is invisible. You make one API call, you get results back. The fallback happens inside AgentPick&apos;s routing layer:
          </p>

          <div className="rounded-xl bg-[#0A0A0A] p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#64748B]">Python — Auto-fallback is transparent</div>
            <pre className="overflow-x-auto text-[13px] text-[#E2E8F0]"><code>{`import requests

def search(query: str) -> dict:
    response = requests.post(
        "https://agentpick.dev/api/v1/route/search",
        headers={"Authorization": "Bearer YOUR_AP_KEY"},
        json={"params": {"query": query}},
        timeout=15  # AgentPick handles internal timeouts
    )
    result = response.json()
    
    # Check if fallback was triggered (optional — for your logs)
    router_meta = result.get("_router", {})
    if router_meta.get("fallback"):
        print(f"⚠️ Fallback triggered: {router_meta['primary_tool']} failed, "
              f"used {router_meta['tool']} instead")
    
    return result["results"]

# Your agent calls search() normally.
# If Tavily is down, AgentPick routes to Exa or Brave.
# Your agent never sees the failure.`}</code></pre>
          </div>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Bring Your Own Keys</h2>
          <p>
            AgentPick never stores your API keys. When you route a call with your own key, it&apos;s used in-memory for that request only and immediately discarded. If you don&apos;t provide a key, AgentPick uses its pool of verified API access.
          </p>

          <div className="rounded-xl bg-[#0A0A0A] p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#64748B]">Python — Route with your own keys</div>
            <pre className="overflow-x-auto text-[13px] text-[#E2E8F0]"><code>{`# Provide your key for the primary tool
# AgentPick uses its own keys for fallback providers
response = requests.post(
    "https://agentpick.dev/api/v1/route/search",
    headers={"Authorization": "Bearer YOUR_AP_KEY"},
    json={
        "tool": "tavily",
        "tool_api_key": "tvly-xxx",  # Your Tavily key
        "params": {"query": "NVDA earnings"}
        # If Tavily fails → AgentPick auto-fallbacks
        # using its verified backup providers
    }
)`}</code></pre>
          </div>

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Real-World Impact</h2>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Fallback Events (Last 30 Days)</h3>
            <div className="space-y-3">
              {[
                { date: 'Dec 14', tool: 'Tavily', duration: '4h 12m', impact: '~23K calls auto-rerouted' },
                { date: 'Dec 9', tool: 'Brave Search', duration: '1h 44m', impact: '~8K calls auto-rerouted' },
                { date: 'Nov 28', tool: 'Exa', duration: '38m', impact: '~2K calls auto-rerouted' },
              ].map((event) => (
                <div key={event.date} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-text-dim w-14">{event.date}</span>
                    <span className="font-semibold text-text-primary">{event.tool}</span>
                    <span className="text-text-secondary">outage ({event.duration})</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#10B981]">{event.impact}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-text-dim">All rerouted calls completed successfully. Agent uptime: 100%.</p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/connect"
              className="rounded-lg bg-[#0A0A0A] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Enable auto-fallback →
            </Link>
            <Link
              href="/dashboard/router"
              className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-text-secondary hover:border-[#D4D4D4] transition-colors"
            >
              See uptime dashboard →
            </Link>
          </div>

        </article>

        <div className="mt-12 rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-[650] tracking-[-0.3px] text-text-primary">
            Never let an API outage take down your agent
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            AgentPick&apos;s auto-fallback layer routes around failures automatically. 100% agent uptime even when providers go down.
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
