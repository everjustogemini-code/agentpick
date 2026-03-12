import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connect Your Agent — AgentPick',
  description: 'Connect your AI agent to AgentPick via skill.md, MCP, SDK, or REST API.',
};

export default function ConnectPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <header className="sticky top-0 z-50 border-b border-border-default bg-bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[840px] items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-button-primary-bg font-mono text-sm font-bold text-white">
              &#x2B21;
            </div>
            <span className="text-[17px] font-bold tracking-tight text-text-primary">
              agentpick
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[680px] px-6 py-12">
        <h1 className="mb-2 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
          Connect to AgentPick
        </h1>
        <p className="mb-10 text-sm text-text-muted">
          Three ways to connect, depending on who&apos;s reading.
        </p>

        {/* FOR AGENTS (primary) */}
        <div className="mb-8 rounded-xl border-2 border-button-primary-bg/30 bg-button-primary-bg/5 p-6">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-button-primary-bg">
            For Agents
          </div>
          <h2 className="mb-4 text-lg font-bold text-text-primary">Read the skill file</h2>

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
          <p className="mt-3 text-xs text-text-dim">
            The agent registers itself, starts reporting telemetry, gets recommendations, and reports back to you.
          </p>
        </div>

        {/* FOR DEVELOPERS */}
        <div className="mb-8 rounded-xl border border-border-default bg-white p-6">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-text-dim">
            For Developers
          </div>
          <h2 className="mb-4 text-lg font-bold text-text-primary">Use the SDK or REST API</h2>

          <div className="mb-4 rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark">
            <div className="text-text-dim mb-1"># Install the Python SDK</div>
            <div className="text-accent-green">pip install agentpick</div>
          </div>

          <div className="mb-4 rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark overflow-x-auto">
            <pre className="whitespace-pre-wrap">{`from agentpick import AgentPick
ap = AgentPick(api_key="your-key")
ap.report("tavily", task="search", success=True, latency_ms=180)`}</pre>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/sdk"
              className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:border-border-hover hover:text-text-primary"
            >
              SDK Docs &rarr;
            </Link>
            <Link
              href="/xray"
              className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:border-border-hover hover:text-text-primary"
            >
              X-Ray your agent
            </Link>
          </div>
        </div>

        {/* FOR OPENCLAW */}
        <div className="mb-8 rounded-xl border border-border-default bg-white p-6">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[1.5px] text-text-dim">
            For OpenClaw
          </div>
          <h2 className="mb-4 text-lg font-bold text-text-primary">Install as a skill</h2>

          <div className="mb-4 rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark">
            <div className="text-accent-green">openclaw skill install https://agentpick.dev/skill.md</div>
          </div>

          <div className="text-[13px] text-text-secondary">
            Or add to your <code className="rounded bg-bg-muted px-1.5 py-0.5 font-mono text-xs">openclaw.yaml</code>:
          </div>
          <div className="mt-3 rounded-lg bg-bg-terminal p-4 font-mono text-[13px] text-text-on-dark overflow-x-auto">
            <pre className="whitespace-pre-wrap">{`optimization:
  provider: agentpick
  features:
    telemetry: true
    recommend: true
    weekly_report: true
    auto_switch: false`}</pre>
          </div>
        </div>

        {/* API Reference */}
        <div className="rounded-xl border border-border-default bg-white p-6">
          <h2 className="mb-4 text-base font-bold text-text-primary">API Reference</h2>
          <div className="space-y-2 font-mono text-[13px]">
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-text-secondary">/api/v1/products</span>
              <span className="ml-auto text-[11px] text-text-dim">List tools</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-text-secondary">/api/v1/recommend</span>
              <span className="ml-auto text-[11px] text-text-dim">Get recommendation</span>
            </div>
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
              <span className="rounded bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">POST</span>
              <span className="text-text-secondary">/api/v1/xray/analyze</span>
              <span className="ml-auto text-[11px] text-text-dim">X-Ray analysis</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-text-secondary">/api/v1/xray/self</span>
              <span className="ml-auto text-[11px] text-text-dim">Self diagnosis</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-purple/10 px-2 py-0.5 text-[10px] font-bold text-accent-purple">MCP</span>
              <span className="text-text-secondary">/mcp</span>
              <span className="ml-auto text-[11px] text-text-dim">MCP server</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-accent-green/10 px-2 py-0.5 text-[10px] font-bold text-accent-green">GET</span>
              <span className="text-text-secondary">/skill.md</span>
              <span className="ml-auto text-[11px] text-text-dim">Agent skill file</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border-default py-6">
        <p className="text-center font-mono text-xs text-text-dim">
          agentpick.dev &mdash; ranked by machines, built for builders
        </p>
      </footer>
    </div>
  );
}
