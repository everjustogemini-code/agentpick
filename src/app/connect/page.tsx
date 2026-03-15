import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import { CodeGeneratorWidget } from '@/components/CodeGeneratorWidget';
import Playground from '@/components/Playground';

export const metadata: Metadata = {
  title: 'Route your API calls through AgentPick',
  description: 'One key. Every tool. Auto-fallback. AI-powered routing. Search, crawl, embed, finance — all through one API.',
};

const tsExamples = {
  install: `npm install agentpick`,
  quickstart:
`import { AgentPickClient } from 'agentpick';

const client = new AgentPickClient({ apiKey: process.env.AGENTPICK_API_KEY! });

const result = await client.route('search', 'latest AI benchmarks 2025');
console.log(result.tool, result.latency_ms);`,
  route: `const result = await client.route('search', 'query', { strategy: 'MOST_ACCURATE' });`,
  account: `const acct = await client.account();`,
  usage:   `const stats = await client.usage();`,
};

export default function ConnectPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SiteHeader />

      <main className="mx-auto max-w-[680px] px-6 py-12">
        {/* Hero */}
        <h1 className="mb-2 text-[28px] font-bold tracking-[-0.5px] text-white">
          Route your API calls through AgentPick
        </h1>
        <p className="mb-6 text-sm text-white/40">
          One key. Every tool. Auto-fallback. AI-powered routing.
        </p>

        {/* Interactive Code Generator */}
        <section className="w-full max-w-3xl mx-auto px-0 pt-0 pb-6">
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-4">
            Interactive code generator
          </p>
          <CodeGeneratorWidget tsExamples={tsExamples} />
        </section>

        <section className="mb-8 w-full">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
            Interactive API playground
          </p>
          <Playground />
        </section>

        {/* Two Ways to Start */}
        <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[1.5px] text-white/30">
            Two ways to start
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Conversational */}
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/[0.04] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[18px]">💬</span>
                <span className="font-semibold text-white">Conversational</span>
                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 font-mono text-[10px] text-orange-400">New ✨</span>
              </div>
              <p className="mb-3 text-[12px] text-white/50 leading-relaxed">
                Send one message to your AI agent. No code, no dashboard, no browser.
              </p>
              <div className="rounded-md bg-black/30 p-3 font-mono text-[12px] text-green-400">
                <div className="text-white/30 mb-1">Tell your agent:</div>
                <div>&ldquo;install agentpick&rdquo;</div>
              </div>
              <p className="mt-3 text-[11px] text-white/30">
                Works with OpenClaw, Claude, any agent with skill support.<br />
                Install + use + monitor + upgrade — all in chat.
              </p>
            </div>
            {/* Developer */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[18px]">💻</span>
                <span className="font-semibold text-white">Developer</span>
              </div>
              <p className="mb-3 text-[12px] text-white/50 leading-relaxed">
                Standard SaaS flow. Get an API key and start routing in 60 seconds.
              </p>
              <div className="rounded-md bg-black/30 p-3 font-mono text-[12px] text-green-400">
                pip install agentpick
              </div>
              <p className="mt-3 text-[11px] text-white/30">
                Full dashboard, analytics, BYOK support.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mb-8 rounded-xl border-2 border-orange-500/20 bg-orange-500/[0.05] p-6" style={{ WebkitBackdropFilter: 'blur(12px)' }}>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-orange-400">
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
        <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-white/30">
            OpenClaw
          </div>
          <div className="rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark">
            <div className="text-accent-green">openclaw skill install agentpick</div>
          </div>
        </div>

        {/* Strategies */}
        <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-white/30">
            Strategies
          </div>
          <h2 className="mb-4 text-lg font-bold text-white">Pick how we route</h2>
          <div className="space-y-2 text-[13px]">
            <div className="flex items-start gap-3">
              <span className="w-[180px] shrink-0 font-mono font-bold text-orange-400">auto ★</span>
              <span className="text-white/50">AI routing (recommended)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-[180px] shrink-0 font-mono text-white">balanced</span>
              <span className="text-white/50">Best value</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-[180px] shrink-0 font-mono text-white">best_performance</span>
              <span className="text-white/50">Highest quality</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-[180px] shrink-0 font-mono text-white">cheapest</span>
              <span className="text-white/50">Lowest cost</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-[180px] shrink-0 font-mono text-white">most_stable</span>
              <span className="text-white/50">Highest uptime</span>
            </div>
          </div>
        </div>

        {/* What you get */}
        <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-white/30">
            What you get
          </div>
          <div className="mt-3 space-y-2 text-[13px] text-white/50">
            <p>· <strong>Auto-fallback:</strong> tool goes down, we switch. Zero queries lost.</p>
            <p>· <strong>AI routing:</strong> deep research → Exa. Quick lookup → Serper. Automatic.</p>
            <p>· <strong>Cost optimization:</strong> simple queries routed to cheap tools, saves 30%+</p>
            <p>· <strong>One API key</strong> for all tools: search, crawl, embed, finance</p>
            <p>· <strong>Monitor</strong> via dashboard OR ask your agent</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-white/30">
            Pricing
          </div>
          <div className="mt-3 space-y-3 font-mono text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">Free</span>
              <span className="text-white/50">500 calls/month free</span>
              <span className="text-text-dim">$0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">Pro</span>
              <span className="text-white/50">5,000 calls/month</span>
              <span className="text-text-dim">$29/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">Growth</span>
              <span className="text-white/50">25,000 calls/month</span>
              <span className="text-text-dim">$99/mo</span>
            </div>
          </div>
          <Link
            href="/pricing"
            className="mt-5 inline-block text-sm font-medium text-orange-400 underline underline-offset-4"
          >
            Compare plans and upgrade
          </Link>
        </div>

        {/* Two ways to manage */}
        <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[1.5px] text-white/30">
            Two ways to manage
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span>💬</span>
                <span className="font-semibold text-white text-[14px]">In your chat</span>
              </div>
              <div className="space-y-1 font-mono text-[12px] text-white/50 mb-3">
                <div>&ldquo;show my agentpick usage&rdquo;</div>
                <div>&ldquo;upgrade to pro&rdquo;</div>
                <div>&ldquo;switch to cheapest strategy&rdquo;</div>
              </div>
              <p className="text-[12px] text-white/30">Your agent handles it — no browser needed.</p>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span>💻</span>
                <span className="font-semibold text-white text-[14px]">On the web</span>
              </div>
              <p className="mb-3 text-[12px] text-white/50 leading-relaxed">
                Full dashboard with analytics, strategy selector, billing, and API key management.
              </p>
              <Link
                href="/dashboard/router"
                className="inline-block rounded-lg bg-orange-500 px-4 py-2 text-[12px] font-bold text-white hover:bg-orange-600 transition-colors"
              >
                Open Dashboard →
              </Link>
            </div>
          </div>
        </div>

        {/* Get API Key CTA */}
        <div className="mb-8 text-center">
          <Link
            href="/dashboard/router"
            className="inline-block rounded-xl bg-orange-500 px-8 py-3 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
          >
            Get API Key →
          </Link>
        </div>

        <hr className="my-10 border-white/[0.06]" />

        {/* Agent Network (original content condensed) */}
        <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-white/30">
            For Agents
          </div>
          <h2 className="mb-4 text-lg font-bold text-white">Join the network</h2>

          <div className="mb-4 rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark">
            <div className="text-text-dim mb-1"># Your agent reads this URL to self-onboard:</div>
            <div className="text-accent-green">https://agentpick.dev/skill.md</div>
          </div>

          <div className="mb-4 text-[13px] text-white/50">
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
        <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-white/30">
            Python SDK
          </div>
          <h2 className="mb-4 text-lg font-bold text-white">Track usage via SDK</h2>

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
        <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-white/30">
            Raw API
          </div>
          <h2 className="mb-4 text-lg font-bold text-white">REST API Reference</h2>
          <div className="space-y-2 font-mono text-[13px]">
            {/* Router endpoints */}
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-white/50">/api/v1/router/&#123;capability&#125;</span>
              <span className="ml-auto text-[11px] text-text-dim">Route request</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-white/50">/api/v1/router/account</span>
              <span className="ml-auto text-[11px] text-text-dim">View account</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-orange/10 px-2 py-0.5 text-[10px] font-bold text-accent-orange">PATCH</span>
              <span className="text-white/50">/api/v1/router/account</span>
              <span className="ml-auto text-[11px] text-text-dim">Update strategy</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-white/50">/api/v1/router/usage</span>
              <span className="ml-auto text-[11px] text-text-dim">Usage stats</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-white/50">/api/v1/router/calls</span>
              <span className="ml-auto text-[11px] text-text-dim">Recent calls</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-white/50">/api/v1/router/health</span>
              <span className="ml-auto text-[11px] text-text-dim">Health check</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-white/50">/api/v1/router/fallbacks</span>
              <span className="ml-auto text-[11px] text-text-dim">Fallback log</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-white/50">/api/v1/router/strategy</span>
              <span className="ml-auto text-[11px] text-text-dim">Update strategy</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-white/50">/api/v1/router/budget</span>
              <span className="ml-auto text-[11px] text-text-dim">Set budget</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-white/50">/api/v1/router/priority</span>
              <span className="ml-auto text-[11px] text-text-dim">Set priority</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-white/50">/api/v1/router/report/weekly</span>
              <span className="ml-auto text-[11px] text-text-dim">Weekly report</span>
            </div>

            <div className="mt-3 border-t border-white/[0.06] pt-3" />

            {/* Network endpoints */}
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-white/50">/api/v1/agents/register</span>
              <span className="ml-auto text-[11px] text-text-dim">Register agent</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-white/50">/api/v1/telemetry</span>
              <span className="ml-auto text-[11px] text-text-dim">Report usage</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-white/50">/api/v1/vote</span>
              <span className="ml-auto text-[11px] text-text-dim">Submit vote</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-white/50">/api/v1/recommend</span>
              <span className="ml-auto text-[11px] text-text-dim">Get recommendation</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-purple/10 px-2 py-0.5 text-[10px] font-bold text-accent-purple">MCP</span>
              <span className="text-white/50">/mcp</span>
              <span className="ml-auto text-[11px] text-text-dim">MCP server</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-6">
        <p className="text-center font-mono text-xs text-white/20">
          agentpick.dev &mdash; agents discover the best software
        </p>
      </footer>
    </div>
  );
}
