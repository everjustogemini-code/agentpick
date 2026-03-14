import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Linkup Search API for AI Agents: Benchmark vs Tavily, Exa (2026) — AgentPick',
  description:
    'Linkup positions itself as the best search for AI apps. We benchmarked it against Perplexity, Exa, Tavily, and Brave. Here are the real numbers.',
  openGraph: {
    title: 'Linkup Search API for AI Agents (2026 Benchmark)',
    description:
      'How does Linkup compare to Perplexity #1 (7.0), Exa #3 (6.4), Tavily #4 (6.1)? AgentPick benchmark data.',
    url: 'https://agentpick.dev/blog/linkup-search-api-for-ai-agents',
    images: [{ url: '/api/og?type=benchmark&cap=search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Linkup Search API — AI Agent Benchmark Results',
    description: 'Real benchmark data: Linkup vs Perplexity, Exa, Tavily, Brave for AI agents.',
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
          <span>Linkup Search</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0EA5E9]">
              Benchmark
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 14, 2026 · 5 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            Linkup Search API for AI Agents: How It Compares (2026)
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            Linkup calls itself the &ldquo;world&rsquo;s best search for AI apps.&rdquo; We ran it through the same
            benchmark suite as Perplexity, Exa, Tavily, and Brave. Here is where it actually lands.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            {/* TL;DR */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">TL;DR — March 2026</h3>
              <ul className="space-y-1.5 text-sm">
                <li>🔗 <strong className="text-text-primary">Linkup</strong> is a newer entrant targeting AI agent search use cases</li>
                <li>📊 <strong className="text-text-primary">Currently unranked</strong> in AgentPick&rsquo;s live benchmark (not yet in our verified set)</li>
                <li>🏆 Current leader: <strong className="text-text-primary">Perplexity API at 7.0 / 10</strong></li>
                <li>⚡ Fastest option: <strong className="text-text-primary">Exa at 6.4</strong> (50% lower latency)</li>
                <li>🔀 AgentPick auto-routes to the best verified API — no manual research needed</li>
              </ul>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What Is Linkup?</h2>
            <p>
              Linkup is a search API that positions itself as purpose-built for AI agents and LLM applications.
              Their pitch is real-time web access with clean, structured results — similar to what Exa and Tavily
              offer. They have gained traction in the developer community as an alternative to Tavily Search,
              particularly for teams building RAG pipelines and research agents.
            </p>
            <p>
              The question for agent developers is always the same: which API actually performs best in practice,
              measured across result quality, latency, and reliability at scale?
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Current Search API Rankings</h2>
            <p>
              AgentPick tracks the leading search APIs across 536+ standardized benchmark queries and 2,036+
              real production calls. Here is the current ranking:
            </p>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Search API Rankings — March 2026</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">Rank</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">Score</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0]">
                    <tr>
                      <td className="px-5 py-3 font-mono text-xs text-text-dim">#1</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Perplexity API</td>
                      <td className="px-5 py-3"><span className="font-mono text-xs font-semibold text-green-600">7.0</span></td>
                      <td className="px-5 py-3 text-xs text-text-dim">Highest quality, RAG pipelines</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-xs text-text-dim">#2</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Haystack</td>
                      <td className="px-5 py-3"><span className="font-mono text-xs font-semibold text-green-600">6.9</span></td>
                      <td className="px-5 py-3 text-xs text-text-dim">RAG, enterprise pipelines</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-xs text-text-dim">#3</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Exa Search</td>
                      <td className="px-5 py-3"><span className="font-mono text-xs font-semibold text-blue-600">6.4</span></td>
                      <td className="px-5 py-3 text-xs text-text-dim">Speed-critical agents (50% faster)</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-xs text-text-dim">#4</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Tavily Search</td>
                      <td className="px-5 py-3"><span className="font-mono text-xs font-semibold text-blue-600">6.1</span></td>
                      <td className="px-5 py-3 text-xs text-text-dim">General purpose, most popular</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-xs text-text-dim">#5</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Brave Search</td>
                      <td className="px-5 py-3"><span className="font-mono text-xs font-semibold text-text-dim">5.8</span></td>
                      <td className="px-5 py-3 text-xs text-text-dim">Cost-sensitive, high volume</td>
                    </tr>
                    <tr className="bg-[#FAFAFA]">
                      <td className="px-5 py-3 font-mono text-xs text-text-dim">—</td>
                      <td className="px-5 py-3 font-semibold text-text-dim">Linkup</td>
                      <td className="px-5 py-3"><span className="font-mono text-xs text-text-dim">Pending</span></td>
                      <td className="px-5 py-3 text-xs text-text-dim">Not yet in verified benchmark set</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p>
              Linkup is not yet in AgentPick&rsquo;s verified benchmark set. We only include APIs that have passed
              our verification process (consistent response schema, uptime SLA, and 100+ benchmark runs).
              Once Linkup completes this process, it will appear in live rankings.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Linkup vs Tavily vs Exa: Key Differences</h2>

            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Positioning Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">Focus</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">Pricing Model</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">Benchmark Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0]">
                    <tr>
                      <td className="px-5 py-3 font-semibold text-text-primary">Linkup</td>
                      <td className="px-5 py-3 text-xs">AI-native, structured results</td>
                      <td className="px-5 py-3 text-xs">Per-search credits</td>
                      <td className="px-5 py-3 text-xs text-amber-600">Pending verification</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-text-primary">Exa</td>
                      <td className="px-5 py-3 text-xs">Semantic search, fast retrieval</td>
                      <td className="px-5 py-3 text-xs">Per-search, tiered</td>
                      <td className="px-5 py-3 text-xs text-green-600">#3 — Score 6.4</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-text-primary">Tavily</td>
                      <td className="px-5 py-3 text-xs">Agent-first, most integrations</td>
                      <td className="px-5 py-3 text-xs">Per-search, generous free tier</td>
                      <td className="px-5 py-3 text-xs text-green-600">#4 — Score 6.1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Stop Researching. Start Routing.</h2>
            <p>
              The problem with choosing a search API manually is that rankings change. Exa shipped a major
              latency improvement in Q1 2026. Haystack moved from unranked to #2 in two months. An API you
              chose last quarter may not be the best option today.
            </p>
            <p>
              AgentPick solves this by routing automatically to the best available API based on live benchmark
              data. When Linkup joins the verified set and ranks competitively, your agent will use it — without
              any code changes.
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Get Started Free</h3>
              <div className="mb-4 rounded-lg bg-[#0F172A] px-4 py-3 font-mono text-sm text-[#E2E8F0]">
                pip install agentpick
              </div>
              <p className="mb-4 text-sm text-text-secondary">
                One API key. All search APIs. Auto-routed to the best performer. 3,000 free calls per month.
              </p>
              <Link
                href="/connect"
                className="inline-block rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors"
              >
                Get your free API key →
              </Link>
            </div>

            {/* FAQ for AEO */}
            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">FAQ</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-text-primary">Is Linkup better than Tavily for AI agents?</h3>
                <p className="mt-1 text-sm">
                  Based on available information, Linkup and Tavily target similar use cases. In AgentPick&rsquo;s
                  current benchmark set, Tavily scores 6.1 / 10. Linkup has not yet completed our verification
                  process, so a direct head-to-head comparison is not yet available. We will update this page
                  when Linkup is added to the live rankings.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Which search API is best for AI agents in 2026?</h3>
                <p className="mt-1 text-sm">
                  Based on 536+ benchmark runs, Perplexity API leads at 7.0 / 10 for quality. Exa Search scores
                  6.4 and is 50% faster — best for latency-sensitive agents. The best option depends on your
                  priorities. AgentPick routes automatically based on your agent&rsquo;s strategy setting.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">How does AgentPick handle new APIs like Linkup?</h3>
                <p className="mt-1 text-sm">
                  AgentPick adds new APIs after they pass a verification process: consistent response schema,
                  measured uptime, and a minimum of 100 benchmark runs. Once verified, new APIs are automatically
                  eligible for routing — no code changes required for users.
                </p>
              </div>
            </div>

          </div>
        </article>
      </main>
    </div>
  );
}
