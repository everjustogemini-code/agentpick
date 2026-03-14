import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Perplexity API for AI Agents: Benchmark Results & Integration Guide — AgentPick',
  description:
    'Perplexity API is currently #1 for AI agent search with a score of 7.0 across 536 benchmark runs. Learn when to use it, how to integrate it, and when Exa or Tavily is a better choice.',
  openGraph: {
    title: 'Perplexity API for AI Agents — #1 Benchmark Score (7.0)',
    description:
      'Perplexity API leads the AgentPick search benchmark at 7.0. Here is what that means in practice and how to route to it automatically.',
    url: 'https://agentpick.dev/blog/perplexity-api-for-ai-agents',
    images: [{ url: '/api/og?type=benchmark&cap=search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Perplexity API for AI Agents — #1 at 7.0 score (536 runs)',
    description: 'When to use Perplexity API vs Exa vs Tavily for your AI agent. Live benchmark data.',
    images: ['/api/og?type=benchmark&cap=search'],
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
          <span>Benchmark</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0EA5E9]">
              Benchmark
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 14, 2026 · 5 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            Perplexity API for AI Agents: Benchmark Results &amp; When to Use It
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            Perplexity API is currently the top-ranked search tool in the AgentPick benchmark — score 7.0 across 536 runs and 2,036 production calls. Here is what that means, when it matters, and when a different tool is the better choice.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            {/* TL;DR Box */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">TL;DR</h3>
              <ul className="space-y-1.5 text-sm">
                <li>🥇 <strong className="text-text-primary">Perplexity API</strong> is #1 for search quality in the AgentPick benchmark (score 7.0)</li>
                <li>⚡ <strong className="text-text-primary">Exa Search</strong> is 50% faster at a 9% quality cost — use for latency-sensitive agents</li>
                <li>📊 <strong className="text-text-primary">Tavily</strong> has the most production usage data (64 agent votes, 2,036 calls)</li>
                <li>🔀 <strong className="text-text-primary">AgentPick</strong> routes to Perplexity by default, with Exa/Tavily as fallback</li>
              </ul>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Why Perplexity API Leads the Benchmark</h2>
            <p>
              The AgentPick benchmark scores APIs on a weighted composite: answer quality from standardized test queries (25%), real router traces from production agents (40%), telemetry call volume (20%), and developer votes (15%). Perplexity API scores 7.0 on a 10-point scale — the current highest across all search APIs in the network.
            </p>
            <p>
              The key strength is answer synthesis. Perplexity does not just return a list of URLs — it returns a structured answer with citations, which reduces the amount of post-processing your agent has to do. For research-type queries, summarization tasks, and Q&amp;A workflows, this matters.
            </p>

            {/* Score Table */}
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Current Search API Rankings — 536 runs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Score</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Speed</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    <tr className="bg-[#F0FDF4]">
                      <td className="px-5 py-3 font-semibold text-text-primary">Perplexity API</td>
                      <td className="px-5 py-3 font-mono font-bold text-green-600">7.0 🥇</td>
                      <td className="px-5 py-3 text-text-dim">Baseline</td>
                      <td className="px-5 py-3 text-text-dim">Quality, research, Q&amp;A</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-text-primary">Haystack</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.9</td>
                      <td className="px-5 py-3 text-text-dim">~Baseline</td>
                      <td className="px-5 py-3 text-text-dim">Structured retrieval</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-text-primary">Exa Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.4</td>
                      <td className="px-5 py-3 text-[#F59E0B] font-semibold">50% faster</td>
                      <td className="px-5 py-3 text-text-dim">Speed-critical agents</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-text-primary">Tavily</td>
                      <td className="px-5 py-3 font-mono font-bold text-text-primary">6.1</td>
                      <td className="px-5 py-3 text-text-dim">Fast</td>
                      <td className="px-5 py-3 text-text-dim">Finance, news, broad coverage</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">When to Use Perplexity API</h2>

            <h3 className="text-[18px] font-[650] text-text-primary">Research and summarization agents</h3>
            <p>
              If your agent needs to answer open-ended questions or synthesize information from multiple sources, Perplexity API is the strongest option available. It returns a generated answer alongside citations — reducing the number of LLM calls your agent needs to make.
            </p>

            <h3 className="text-[18px] font-[650] text-text-primary">Factual Q&amp;A pipelines</h3>
            <p>
              For queries where correctness matters more than speed (medical, legal, finance fact-lookup), Perplexity&apos;s answer quality advantage over the alternatives justifies the slightly higher latency.
            </p>

            <h3 className="text-[18px] font-[650] text-text-primary">When NOT to use Perplexity API</h3>
            <p>
              If your agent fires 10+ searches per user request in a tight loop, Exa Search is a better default — it is 50% faster at a 9% quality cost. For finance-specific data or domain-specific retrieval where Tavily&apos;s specialized training matters, use Tavily.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">How to Route to Perplexity Automatically</h2>
            <p>
              The simplest way is to use AgentPick — it routes to Perplexity by default for search queries, and falls back to Exa or Tavily automatically if Perplexity is unavailable or rate-limiting.
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#0F172A] p-5">
              <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Auto-route to Perplexity (with fallback)</div>
              <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#E2E8F0]">{`# Install
pip install agentpick

# Use in your agent
import agentpick
client = agentpick.Client(api_key='YOUR_KEY')

result = client.search('What happened at OpenAI in March 2026?')
# Routes to Perplexity API (current #1)
# Falls back to Exa if Perplexity is down
print(result.answer)
print(result.tool_used)  # 'perplexity-api'`}</pre>
            </div>

            <p>
              You can also call the recommendation endpoint to get the current best tool without routing:
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#0F172A] p-5">
              <pre className="overflow-x-auto text-[13px] leading-relaxed text-[#E2E8F0]">{`curl https://agentpick.dev/api/v1/recommend?capability=search

# {
#   "recommended": "perplexity-api",
#   "score": 7.0,
#   "alternatives": [
#     {"slug": "haystack", "score": 6.9},
#     {"slug": "exa-search", "score": 6.4},
#     {"slug": "tavily", "score": 6.1}
#   ]
# }`}</pre>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Rankings Change — Here Is How to Stay Current</h2>
            <p>
              Perplexity took the #1 spot from Tavily in the most recent benchmark cycle. Rankings shift as APIs improve (or degrade). In practice, the top 3 are within 15% of each other — the right tool depends on your workload.
            </p>
            <p>
              The recommendation endpoint above always returns the current #1. If you hardcode Perplexity today, you will need to manually update when rankings shift. If you use AgentPick routing, it updates automatically.
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-2 font-[650] text-text-primary">Try AgentPick free</h3>
              <p className="mb-3 text-sm text-text-secondary">
                500 calls/month free. Routes to Perplexity (current #1) with automatic fallback to Exa and Tavily.
              </p>
              <Link
                href="/connect"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#18181B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#27272A] transition-colors"
              >
                Get API key →
              </Link>
            </div>

          </div>
        </article>

        {/* Related posts */}
        <footer className="mt-12 border-t border-[#E5E5E5] pt-8">
          <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Related</h3>
          <div className="space-y-3">
            <Link href="/blog/best-search-api-for-ai-agents" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Best Search API for AI Agents: Full 2026 Benchmark →
            </Link>
            <Link href="/blog/tavily-vs-exa-vs-brave-search-api" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Tavily vs Exa vs Brave Search: In-depth comparison →
            </Link>
            <Link href="/blog/tool-routing-for-ai-agents" className="block text-sm font-semibold text-text-primary hover:text-[#0EA5E9]">
              Tool Routing for AI Agents: Skip the Boilerplate →
            </Link>
          </div>
        </footer>

      </main>
    </div>
  );
}
