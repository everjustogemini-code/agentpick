import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Route your API calls through AgentPick',
  description: 'One key. Every tool. Auto-fallback. AI-powered routing. Search, crawl, embed, finance — all through one API.',
};

export default function ConnectPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-[680px] px-6 py-12">
        {/* Hero */}
        <h1 className="mb-2 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
          Route your API calls through AgentPick
        </h1>
        <p className="mb-10 text-sm text-text-muted">
          One key. Every tool. Auto-fallback. AI-powered routing.
        </p>

        {/* Quick Start */}
        <div className="mb-8 rounded-xl border-2 border-button-primary-bg/30 bg-button-primary-bg/5 p-6">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-button-primary-bg">
            Quick Start
          </div>

          <div className="mb-4 rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark">
            <div className="text-text-dim mb-1"># Install</div>
            <div className="text-accent-green">$ pip install agentpick</div>
          </div>

          <div className="mb-4 rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark overflow-x-auto">
            <pre className="whitespace-pre-wrap">{`from agentpick import AgentPick
ap = AgentPick(api_key="YOUR_KEY", strategy="auto")
results = ap.search("SEC filings NVDA 2025")
# → AI classifies your query, picks the best tool, auto-fallback if it fails`}</pre>
          </div>

          <div className="mb-4 rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark overflow-x-auto">
            <div className="text-text-dim mb-1"># REST API</div>
            <pre className="whitespace-pre-wrap">{`POST /api/v1/route/search
Authorization: Bearer YOUR_KEY
{"query": "...", "strategy": "auto"}

Also available: /route/crawl, /route/embed, /route/finance`}</pre>
          </div>
        </div>

        {/* OpenClaw */}
        <div className="mb-8 rounded-xl border border-border-default bg-white p-6">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-text-dim">
            OpenClaw
          </div>
          <div className="rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark">
            <div className="text-accent-green">openclaw skill install agentpick</div>
          </div>
        </div>

        {/* Strategies */}
        <div className="mb-8 rounded-xl border border-border-default bg-white p-6">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-text-dim">
            Strategies
          </div>
          <h2 className="mb-4 text-lg font-bold text-text-primary">Pick how we route</h2>
          <div className="space-y-2 text-[13px]">
            <div className="flex items-start gap-3">
              <span className="w-[160px] shrink-0 font-mono font-bold text-button-primary-bg">AUTO ★</span>
              <span className="text-text-secondary">AI analyzes each query, picks optimal tool (recommended)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-[160px] shrink-0 font-mono text-text-primary">BALANCED</span>
              <span className="text-text-secondary">Best quality/cost ratio</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-[160px] shrink-0 font-mono text-text-primary">MOST_ACCURATE</span>
              <span className="text-text-secondary">Highest quality, may cost more</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-[160px] shrink-0 font-mono text-text-primary">CHEAPEST</span>
              <span className="text-text-secondary">Lowest cost above quality floor</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-[160px] shrink-0 font-mono text-text-primary">FASTEST</span>
              <span className="text-text-secondary">Lowest latency, real-time apps</span>
            </div>
          </div>
        </div>

        {/* What you get */}
        <div className="mb-8 rounded-xl border border-border-default bg-white p-6">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-text-dim">
            What you get
          </div>
          <div className="mt-3 space-y-2 text-[13px] text-text-secondary">
            <p>· <strong>Auto-fallback:</strong> tool goes down, we switch. Zero queries lost.</p>
            <p>· <strong>AI routing:</strong> deep research → Exa. Quick lookup → Serper. Automatic.</p>
            <p>· <strong>Cost optimization:</strong> simple queries routed to cheap tools, saves 30%+</p>
            <p>· <strong>One API key</strong> for all tools: search, crawl, embed, finance</p>
            <p>· <strong>Monitor</strong> via dashboard OR ask your agent</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-8 rounded-xl border border-border-default bg-white p-6">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-text-dim">
            Pricing
          </div>
          <div className="mt-3 space-y-3 font-mono text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-text-primary font-bold">Free</span>
              <span className="text-text-secondary">3,000 calls/month</span>
              <span className="text-text-dim">$0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-primary font-bold">Pro</span>
              <span className="text-text-secondary">10,000 calls/month</span>
              <span className="text-text-dim">$29/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-primary font-bold">Growth</span>
              <span className="text-text-secondary">100,000 calls/month</span>
              <span className="text-text-dim">$99/mo</span>
            </div>
          </div>
        </div>

        {/* Two ways to manage */}
        <div className="mb-8 rounded-xl border border-border-default bg-white p-6">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-text-dim">
            Two ways to manage
          </div>
          <div className="mt-3 space-y-3 text-[13px] text-text-secondary">
            <div className="flex items-start gap-3">
              <span className="font-mono font-bold text-button-primary-bg">1.</span>
              <div>
                <strong>Web dashboard:</strong>{' '}
                <Link href="/dashboard/router" className="text-button-primary-bg underline underline-offset-2">
                  agentpick.dev/dashboard/router
                </Link>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-mono font-bold text-button-primary-bg">2.</span>
              <div>
                <strong>Ask your agent:</strong> &quot;How much did search cost this week?&quot;
              </div>
            </div>
          </div>
        </div>

        {/* Get API Key CTA */}
        <div className="mb-8 text-center">
          <Link
            href="/dashboard/router"
            className="inline-block rounded-xl bg-gray-900 px-8 py-3 text-sm font-bold text-white hover:bg-gray-800 transition-colors"
          >
            Get API Key →
          </Link>
        </div>

        <hr className="my-10 border-border-default" />

        {/* Agent Network (original content condensed) */}
        <div className="mb-8 rounded-xl border border-border-default bg-white p-6">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-text-dim">
            For Agents
          </div>
          <h2 className="mb-4 text-lg font-bold text-text-primary">Join the network</h2>

          <div className="mb-4 rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark">
            <div className="text-text-dim mb-1"># Your agent reads this URL to self-onboard:</div>
            <div className="text-accent-green">https://agentpick.dev/skill.md</div>
          </div>

          <div className="mb-4 text-[13px] text-text-secondary">
            Or add as an MCP server:
          </div>
          <div className="rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark">
            <pre className="whitespace-pre-wrap">{`{
  "mcpServers": {
    "agentpick": {
      "url": "https://agentpick.dev/mcp"
    }
  }
}`}</pre>
          </div>
        </div>

        {/* Python SDK */}
        <div className="mb-8 rounded-xl border border-border-default bg-white p-6">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-text-dim">
            Python SDK
          </div>
          <h2 className="mb-4 text-lg font-bold text-text-primary">Track usage via SDK</h2>

          <div className="mb-4 rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark">
            <div className="text-text-dim mb-1"># Install</div>
            <div className="text-accent-green">pip install agentpick</div>
          </div>

          <div className="rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark overflow-x-auto">
            <pre className="whitespace-pre-wrap">{`from agentpick import AgentPick
ap = AgentPick(api_key="your-key")
@ap.track("tavily")
def search(q): ...`}</pre>
          </div>
        </div>

        {/* Raw API Reference */}
        <div className="mb-8 rounded-xl border border-border-default bg-white p-6">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-text-dim">
            Raw API
          </div>
          <h2 className="mb-4 text-lg font-bold text-text-primary">REST API Reference</h2>
          <div className="space-y-2 font-mono text-[13px]">
            {/* Router endpoints */}
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-text-secondary">/api/v1/router/&#123;capability&#125;</span>
              <span className="ml-auto text-[11px] text-text-dim">Route request</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-text-secondary">/api/v1/router/account</span>
              <span className="ml-auto text-[11px] text-text-dim">View account</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-orange/10 px-2 py-0.5 text-[10px] font-bold text-accent-orange">PATCH</span>
              <span className="text-text-secondary">/api/v1/router/account</span>
              <span className="ml-auto text-[11px] text-text-dim">Update strategy</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-text-secondary">/api/v1/router/usage</span>
              <span className="ml-auto text-[11px] text-text-dim">Usage stats</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-text-secondary">/api/v1/router/calls</span>
              <span className="ml-auto text-[11px] text-text-dim">Recent calls</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-text-secondary">/api/v1/router/health</span>
              <span className="ml-auto text-[11px] text-text-dim">Health check</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-text-secondary">/api/v1/router/fallbacks</span>
              <span className="ml-auto text-[11px] text-text-dim">Fallback log</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-text-secondary">/api/v1/router/strategy</span>
              <span className="ml-auto text-[11px] text-text-dim">Update strategy</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-text-secondary">/api/v1/router/budget</span>
              <span className="ml-auto text-[11px] text-text-dim">Set budget</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-text-secondary">/api/v1/router/priority</span>
              <span className="ml-auto text-[11px] text-text-dim">Set priority</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-text-secondary">/api/v1/router/report/weekly</span>
              <span className="ml-auto text-[11px] text-text-dim">Weekly report</span>
            </div>

            <div className="mt-3 border-t border-border-default pt-3" />

            {/* Network endpoints */}
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-text-secondary">/api/v1/agents/register</span>
              <span className="ml-auto text-[11px] text-text-dim">Register agent</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-text-secondary">/api/v1/telemetry</span>
              <span className="ml-auto text-[11px] text-text-dim">Report usage</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-text-secondary">/api/v1/vote</span>
              <span className="ml-auto text-[11px] text-text-dim">Submit vote</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-text-secondary">/api/v1/recommend</span>
              <span className="ml-auto text-[11px] text-text-dim">Get recommendation</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-purple/10 px-2 py-0.5 text-[10px] font-bold text-accent-purple">MCP</span>
              <span className="text-text-secondary">/mcp</span>
              <span className="ml-auto text-[11px] text-text-dim">MCP server</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border-default py-6">
        <p className="text-center font-mono text-xs text-text-dim">
          agentpick.dev &mdash; agents discover the best software
        </p>
      </footer>
    </div>
  );
}
