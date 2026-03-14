import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'How We Benchmark Search APIs for AI Agents — AgentPick',
  description:
    'The methodology behind AgentPick\'s search API benchmark: 680+ runs, 4 data sources, continuous scoring. Perplexity #1 at 7.0, Exa #3 at 6.4. How rankings are calculated and why they hold for 10 consecutive weeks.',
  openGraph: {
    title: 'How We Benchmark Search APIs for AI Agents',
    description:
      '680+ benchmark runs, 4 data sources. How AgentPick scores Perplexity, Exa, Tavily, Brave, and Haystack for AI agent workloads — and why continuous benchmarking beats one-time snapshots.',
    url: 'https://agentpick.dev/blog/how-we-benchmark-search-apis-for-ai-agents',
    images: [{ url: '/api/og?type=benchmark&cap=search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How We Benchmark Search APIs for AI Agents',
    description: '680+ runs, 4 data sources. Methodology behind AgentPick rankings: Perplexity 7.0, Exa 6.4, Tavily 6.1.',
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
              Methodology
            </span>
            <span className="font-mono text-[11px] text-text-dim">May 16, 2026 · 7 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            How We Benchmark Search APIs for AI Agents
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            Most API benchmarks are snapshots: someone runs a test suite once, publishes the results, and that is it. AgentPick runs continuously. Here is how the scoring works, what data goes into it, and why the top-5 rankings have been stable for 10 consecutive weeks.
          </p>
        </header>

        <article className="prose-blog">
          <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

            {/* Current standings */}
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-4 border-b border-[#E5E5E5]">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Current Search Rankings — May 16, 2026</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0F0]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Rank</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">API</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Score</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Runs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    <tr className="bg-[#F0FFF4]">
                      <td className="px-5 py-3 font-mono text-green-700">#1</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Perplexity API</td>
                      <td className="px-5 py-3 font-mono font-bold text-green-600">7.0</td>
                      <td className="px-5 py-3 font-mono text-text-dim">680+</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#2</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Haystack</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">6.9</td>
                      <td className="px-5 py-3 font-mono text-text-dim">680+</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#3</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Exa Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0EA5E9]">6.4</td>
                      <td className="px-5 py-3 font-mono text-text-dim">680+</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#4</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Tavily</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#F59E0B]">6.1</td>
                      <td className="px-5 py-3 font-mono text-text-dim">680+</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-mono text-text-dim">#5</td>
                      <td className="px-5 py-3 font-semibold text-text-primary">Brave Search</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#F97316]">5.8</td>
                      <td className="px-5 py-3 font-mono text-text-dim">680+</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Why continuous beats one-time</h2>
            <p>
              A benchmark published in January is stale by March. APIs change pricing, update models,
              fix bugs, and have service incidents. A one-time test tells you how an API performed on
              one day under one set of conditions.
            </p>
            <p>
              AgentPick benchmarks run continuously. Every ranked API gets tested with standardized
              queries on a rolling basis. Scores update as new data arrives. When an API degrades,
              the score moves. When they improve, the score moves. Rankings reflect the current state
              of the API, not a historical snapshot.
            </p>
            <p>
              This is what makes the data useful for production routing decisions.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">The four data sources</h2>
            <p>
              Each API&apos;s score is a composite of four independently weighted inputs:
            </p>

            <div className="space-y-3">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-[28px] font-bold text-text-primary w-12 shrink-0">40%</span>
                  <div>
                    <h3 className="font-[650] text-text-primary">Router traces</h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Real production calls from the 313 agents routing through AgentPick. Every call
                      records the result quality, latency, and whether it succeeded. This is the
                      largest signal — production traffic under real query distributions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-[28px] font-bold text-text-primary w-12 shrink-0">25%</span>
                  <div>
                    <h3 className="font-[650] text-text-primary">Benchmark runs</h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Standardized query suites run against each API on a fixed schedule. Same queries,
                      same evaluation criteria, every time. This is where the 680+ run count comes from.
                      Standardization eliminates query distribution bias.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-[28px] font-bold text-text-primary w-12 shrink-0">20%</span>
                  <div>
                    <h3 className="font-[650] text-text-primary">Telemetry</h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Raw operational metrics: p50/p95 latency, uptime, error rate, rate limit frequency.
                      These are captured automatically from every production call. An API with great
                      result quality but 30% error rate scores lower than one with slightly lower quality
                      but 99.9% uptime.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-[28px] font-bold text-text-primary w-12 shrink-0">15%</span>
                  <div>
                    <h3 className="font-[650] text-text-primary">Agent votes</h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Developer satisfaction signals collected from agents that have used a tool.
                      Thumbs up/down on results, preference signals, explicit comparisons. Smallest
                      weight — useful signal but has selection bias (developers who vote tend to have
                      strong opinions).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What we measure</h2>
            <p>
              The benchmark query set is designed around real AI agent workloads, not general web search.
              The mix includes:
            </p>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-2">—</span>
                <span><strong className="text-text-primary">Factual retrieval</strong> — questions with verifiable answers (best for accuracy testing)</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-2">—</span>
                <span><strong className="text-text-primary">Research queries</strong> — multi-hop questions requiring synthesis across sources</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-2">—</span>
                <span><strong className="text-text-primary">Realtime queries</strong> — news, prices, current events (tests freshness)</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-2">—</span>
                <span><strong className="text-text-primary">Finance queries</strong> — earnings, filings, market data (domain-specific quality)</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="font-mono text-text-dim w-2">—</span>
                <span><strong className="text-text-primary">Technical queries</strong> — code, APIs, documentation lookups</span>
              </li>
            </ul>
            <p>
              Each category is weighted proportionally to how agents actually use search in production.
              Realtime queries carry higher weight because news freshness failures have high user-visible
              impact.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">The 90-day rolling window</h2>
            <p>
              Scores are computed over a 90-day rolling window. Older data is weighted less than recent
              data. This prevents a good month 3 months ago from masking current degradation, while
              also preventing a bad week from tanking a historically strong API.
            </p>
            <p>
              The practical result: rankings are stable under normal conditions, but move when
              something actually changes. The top-5 search rankings have been stable for 10 consecutive
              weeks — not because the window is too long, but because those APIs have genuinely
              maintained their relative quality over that period.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">What counts as a &quot;benchmark run&quot;</h2>
            <p>
              Each standardized query against each API counts as one benchmark run. With 5 ranked
              search APIs and a query set of ~30 queries, one full benchmark cycle produces ~150 runs.
              The 680+ run total represents multiple complete cycles across the evaluation history, plus
              additional runs for newly added APIs.
            </p>
            <p>
              Minimum confirmed score threshold is 50 runs per API. Below that, we mark the API as
              &quot;evaluating&quot; — Valyu (week 6) and Parallel Search (week 7) are currently in this phase.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Why Perplexity leads at 7.0</h2>
            <p>
              Perplexity API&apos;s score reflects consistent strength across all query categories. It
              performs well on research queries (multi-hop synthesis is where it has a real edge over
              index-based search APIs), acceptable on realtime queries, and strong on factual retrieval.
              It is not the cheapest — Brave Search at $0.0008/call costs less — and it is not the
              fastest — Exa is 50% faster at p50. But across the full weighted score, nothing else
              beats 7.0 right now.
            </p>
            <p>
              For more detail:{' '}
              <Link href="/blog/best-search-api-for-ai-agents" className="text-[#0EA5E9] hover:underline">
                Best search API for AI agents — full comparison
              </Link>.
            </p>

            <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Using these rankings in your agent</h2>
            <p>
              You do not need to read these reports every week. The point of AgentPick is that the
              router reads them for you.
            </p>
            <div className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-5 font-mono text-sm text-[#94A3B8]">
              <div className="mb-2 text-[#64748B] text-xs">python</div>
              <pre className="whitespace-pre-wrap text-[13px]">{`from agentpick import AgentPick

ap = AgentPick(api_key="your_key")

# Routes to current #1 automatically.
# No config. No hardcoded providers.
result = ap.search("state of LLMs 2026")`}</pre>
            </div>
            <p>
              The router uses the same ranking data that powers these reports. When Perplexity is #1,
              it routes to Perplexity first. When rankings change, routing changes with them — no code
              updates required.
            </p>
            <p>
              Free tier: 500 calls/month. No credit card required.{' '}
              <Link href="/connect" className="text-[#0EA5E9] hover:underline">Get an API key →</Link>
            </p>

            {/* Related */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Related</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/blog/best-search-api-for-ai-agents" className="text-[#0EA5E9] hover:underline">
                    Best search API for AI agents — rankings and comparison
                  </Link>
                </li>
                <li>
                  <Link href="/blog/tool-routing-for-ai-agents" className="text-[#0EA5E9] hover:underline">
                    Tool routing for AI agents — why hardcoding one API is a mistake
                  </Link>
                </li>
                <li>
                  <Link href="/reports/weekly/2026-05-16" className="text-[#0EA5E9] hover:underline">
                    Weekly benchmark report — May 16, 2026
                  </Link>
                </li>
                <li>
                  <Link href="/benchmarks/methodology" className="text-[#0EA5E9] hover:underline">
                    Full benchmark methodology
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </article>
      </main>
    </div>
  );
}
