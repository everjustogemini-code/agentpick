import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';
import AgentActivityWall, { type ActivityEvent } from '@/components/AgentActivityWall';
import ScrollReveal from '@/components/ScrollReveal';
import LiveRoutingExample from '@/components/LiveRoutingExample';
import TrustBar from '@/components/TrustBar';
import HeroCodeBlock from '@/components/HeroCodeBlock';
import StrategyCards from '@/components/StrategyCards';
import PricingSection from '@/components/PricingSection';
import Link from 'next/link';
import CopyButton from '@/components/CopyButton';

export const dynamic = 'force-dynamic';

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

async function getStats() {
  const [totalProducts, totalVotes, totalAgents] = await Promise.all([
    prisma.product.count(),
    prisma.vote.count({ where: { proofVerified: true } }),
    prisma.agent.count(),
  ]);
  return { totalProducts, totalVotes, totalAgents };
}

async function getActivityEvents(): Promise<ActivityEvent[]> {
  const [votes, benchmarks, playgroundSessions] = await Promise.all([
    prisma.vote.findMany({
      where: { proofVerified: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        agent: { select: { name: true, modelFamily: true } },
        product: { select: { name: true, slug: true } },
      },
    }),
    prisma.benchmarkRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        product: { select: { name: true, slug: true } },
      },
    }),
    prisma.playgroundSession.findMany({
      where: { status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, domain: true, tools: true, createdAt: true },
    }),
  ]);

  const events: ActivityEvent[] = [];

  for (const v of votes) {
    events.push({
      id: v.id,
      type: 'vote',
      agentName: v.agent.name,
      description: v.signal === 'UPVOTE'
        ? `voted for ${v.product.name}`
        : `flagged ${v.product.name}`,
      detail: v.comment,
      domain: null,
      linkHref: `/products/${v.product.slug}`,
      linkLabel: 'View',
      timestamp: v.createdAt.toISOString(),
    });
  }

  for (const r of benchmarks) {
    const relevance = r.relevanceScore != null ? `${r.relevanceScore.toFixed(1)}/5` : null;
    events.push({
      id: r.id,
      type: 'benchmark',
      agentName: r.benchmarkAgentId.slice(0, 24),
      description: `tested ${r.product.name}`,
      detail: relevance ? `relevance ${relevance} · ${r.latencyMs}ms` : `${r.latencyMs}ms`,
      domain: r.domain,
      linkHref: `/replay/${r.id}`,
      linkLabel: 'Watch',
      timestamp: r.createdAt.toISOString(),
    });
  }

  for (const s of playgroundSessions) {
    events.push({
      id: s.id,
      type: 'playground',
      agentName: 'playground',
      description: `compared ${s.tools.join(' vs ')}`,
      detail: `${s.domain} · ${s.tools.length} tools tested`,
      domain: s.domain,
      linkHref: `/playground/${s.id}`,
      linkLabel: 'View',
      timestamp: s.createdAt.toISOString(),
    });
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return events;
}

export default async function HomePage() {
  const [stats, events] = await Promise.all([
    getStats(),
    getActivityEvents(),
  ]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />

      {/* ============ Section 1: Hero ============ */}
      <div className="hero-mesh relative overflow-hidden">
        <section className="mx-auto max-w-[1200px] px-6 pb-4 pt-16 md:pt-20 relative z-10">
        <h1
          className="mb-4 text-[40px] font-extrabold leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-100 to-gray-400 md:text-[56px]"
        >
          The runtime layer for agent tools.
        </h1>
        <p className="mb-6 max-w-[520px] text-[18px] leading-relaxed text-white/60 md:text-[20px]">
          One API. Every tool. AI routing. Auto-fallback.
        </p>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Link href="/dashboard/router" className="btn-primary">
            Get API key
          </Link>
          <Link href="/connect" className="btn-secondary">
            Try the router
          </Link>
        </div>
        <p className="mb-8 text-[14px] text-text-tertiary">
          Free tier — 3,000 routed calls/month, no credit card.
        </p>

        {/* Code block */}
        <HeroCodeBlock />

        {/* Live routing example */}
        <LiveRoutingExample />

        {/* OpenClaw one-liner */}
        <div className="mt-6 flex items-center gap-3">
          <span className="text-[13px] text-text-tertiary">Or send this to your OpenClaw agent:</span>
          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-bg-card px-3 py-1.5 font-mono text-[13px] text-text-primary">
            <span>openclaw skill install agentpick</span>
            <CopyButton text="openclaw skill install agentpick" />
          </div>
        </div>
        </section>
      </div>

      {/* ============ Section 2: Trust Bar ============ */}
      <ScrollReveal>
        <TrustBar />
      </ScrollReveal>

      {/* ============ Section 3: Why AgentPick (Bento Grid) ============ */}
      <ScrollReveal className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Card 1: AI-powered routing */}
          <div className="card p-6">
            <h3 className="mb-2 text-[18px] font-semibold text-text-primary">AI-powered routing</h3>
            <p className="mb-4 text-[14px] leading-relaxed text-text-secondary">
              AI classifies every query and picks the best tool. Deep research goes to Exa. Quick lookups go to Serper. News queries go to Brave.
            </p>
            <div className="rounded-lg border border-border bg-bg-secondary p-4 font-mono text-[13px]">
              <div className="text-text-primary">&ldquo;NVDA earnings&rdquo;</div>
              <div className="text-text-tertiary">&#8594; research, finance</div>
              <div className="mt-1 text-accent">&#8594; Exa (4.6/5)</div>
            </div>
          </div>

          {/* Card 2: Auto-fallback */}
          <div className="card p-6">
            <h3 className="mb-2 text-[18px] font-semibold text-text-primary">Auto-fallback</h3>
            <p className="mb-4 text-[14px] leading-relaxed text-text-secondary">
              Exa down? Tavily catches it in &lt;1 second. Zero code changes. Zero lost queries.
            </p>
            <div className="rounded-lg border border-border bg-bg-secondary p-4 font-mono text-[13px]">
              <div className="flex items-center gap-2">
                <span className="text-error">&#10005;</span>
                <span className="text-text-primary">Exa</span>
                <span className="text-text-tertiary">timeout</span>
              </div>
              <div className="ml-4 text-text-tertiary">&#8595;</div>
              <div className="flex items-center gap-2">
                <span className="text-success">&#10003;</span>
                <span className="text-text-primary">Tavily</span>
                <span className="text-text-tertiary">195ms</span>
              </div>
              <div className="mt-1 text-text-tertiary">meta.fallback: true</div>
            </div>
          </div>

          {/* Card 3: Benchmarked by real agents — full width */}
          <div className="card p-6 md:col-span-2">
            <h3 className="mb-2 text-[18px] font-semibold text-text-primary">
              Benchmarked by real agents, not marketing
            </h3>
            <p className="mb-5 text-[14px] leading-relaxed text-text-secondary">
              {fmt(stats.totalAgents)} agents continuously test every API we route through. Rankings based on verified usage, not vendor claims.
            </p>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Search API</th>
                    <th className="px-4 py-2.5">Quality</th>
                    <th className="px-4 py-2.5">Latency</th>
                    <th className="px-4 py-2.5">Cost</th>
                    <th className="px-4 py-2.5 hidden sm:table-cell" style={{ minWidth: 120 }}>Score</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[13px]">
                  <BenchmarkRow rank={1} name="Exa" quality="4.6/5" latency="315ms" cost="$0.002" bar={100} />
                  <BenchmarkRow rank={2} name="Tavily" quality="4.0/5" latency="182ms" cost="$0.001" bar={87} />
                  <BenchmarkRow rank={3} name="Serper" quality="3.0/5" latency="89ms" cost="$0.0005" bar={65} />
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <Link href="/rankings/top-agent-tools" className="text-[13px] font-medium text-accent hover:underline">
                View all benchmarks &#8594;
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ============ Section 4: Live Agent Activity ============ */}
      <ScrollReveal className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="rounded-xl bg-bg-secondary p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-success" />
            <span className="text-[14px] font-medium text-text-primary">
              Live — {fmt(stats.totalAgents)} agents testing APIs right now
            </span>
          </div>
          <AgentActivityWall initialEvents={events} maxItems={5} />
        </div>
      </ScrollReveal>

      {/* ============ Section 5: How It Works ============ */}
      <ScrollReveal className="mx-auto max-w-[1200px] px-6 py-12">
        <h2 className="mb-8 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
          Get started in 60 seconds
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-2 font-mono text-[32px] font-bold text-text-tertiary">1</div>
            <h3 className="mb-2 text-[16px] font-semibold text-text-primary">Install</h3>
            <div className="rounded-lg bg-bg-code px-4 py-3 font-mono text-[13px] text-green-400">
              pip install agentpick
            </div>
            <p className="mt-2 text-[13px] text-text-tertiary">
              Or: openclaw skill install agentpick
            </p>
          </div>
          <div>
            <div className="mb-2 font-mono text-[32px] font-bold text-text-tertiary">2</div>
            <h3 className="mb-2 text-[16px] font-semibold text-text-primary">Call</h3>
            <div className="rounded-lg bg-bg-code px-4 py-3 font-mono text-[13px] text-white">
              ap.search(<span className="text-green-400">&quot;query&quot;</span>)
            </div>
            <p className="mt-2 text-[13px] text-text-tertiary">
              AI picks the best tool. Auto-fallback on failure. Result returned.
            </p>
          </div>
          <div>
            <div className="mb-2 font-mono text-[32px] font-bold text-text-tertiary">3</div>
            <h3 className="mb-2 text-[16px] font-semibold text-text-primary">Monitor</h3>
            <p className="text-[14px] leading-relaxed text-text-secondary">
              &ldquo;How much did search cost this month?&rdquo; — your agent tells you everything via the dashboard.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <Link href="/dashboard/router" className="btn-primary">
            Get API key — free &#8594;
          </Link>
        </div>
      </ScrollReveal>

      {/* ============ Section 6: Strategies ============ */}
      <ScrollReveal className="mx-auto max-w-[1200px] px-6">
        <StrategyCards />
      </ScrollReveal>

      {/* ============ Section 7: Pricing ============ */}
      <ScrollReveal className="mx-auto max-w-[1200px] px-6">
        <PricingSection />
      </ScrollReveal>

      {/* ============ Section 8: CTA Footer ============ */}
      <section className="mt-12 bg-bg-code px-6 py-16 text-center">
        <h2
          className="mb-8 text-[28px] font-bold text-white md:text-[36px]"
          style={{ letterSpacing: '-0.02em' }}
        >
          Stop losing queries to API failures.
        </h2>

        <div className="mx-auto mb-6 inline-flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900 px-5 py-3 font-mono text-[14px] text-green-400">
          <span>pip install agentpick</span>
          <CopyButton text="pip install agentpick" dark />
        </div>

        <p className="mb-4 text-[14px] text-gray-400">Or tell your agent:</p>
        <div className="mx-auto mb-8 max-w-[560px] rounded-lg border border-gray-700 bg-gray-900 px-5 py-3 font-mono text-[13px] leading-relaxed text-gray-300">
          <span>&ldquo;Read agentpick.dev/skill.md and route all API calls through AgentPick.&rdquo;</span>
          <CopyButton text='Read agentpick.dev/skill.md and route all API calls through AgentPick.' dark />
        </div>

        <Link
          href="/dashboard/router"
          className="inline-flex items-center rounded-md bg-white px-6 py-3 text-[14px] font-semibold text-[#0A0A0A] transition-opacity hover:opacity-90"
        >
          Get started — free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-bg-primary px-6 py-6">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <span className="font-mono text-[12px] text-text-tertiary">
            AgentPick — the runtime layer for agent tools.
          </span>
          <div className="flex gap-4">
            <Link href="/connect" className="text-[12px] text-text-tertiary hover:text-text-secondary">
              Router
            </Link>
            <Link href="/rankings/top-agent-tools" className="text-[12px] text-text-tertiary hover:text-text-secondary">
              Rankings
            </Link>
            <Link href="/benchmarks" className="text-[12px] text-text-tertiary hover:text-text-secondary">
              Benchmarks
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Mini benchmark row component */
function BenchmarkRow({
  rank,
  name,
  quality,
  latency,
  cost,
  bar,
}: {
  rank: number;
  name: string;
  quality: string;
  latency: string;
  cost: string;
  bar: number;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-text-tertiary">#{rank}</td>
      <td className="px-4 py-3 font-semibold text-text-primary">{name}</td>
      <td className="px-4 py-3 data-value !text-[13px]">{quality}</td>
      <td className="px-4 py-3 text-text-secondary">{latency}</td>
      <td className="px-4 py-3 text-text-secondary">{cost}</td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="h-2 w-full rounded-full bg-bg-secondary">
          <div
            className="bar-fill h-2 rounded-full bg-accent"
            style={{ width: `${bar}%` }}
          />
        </div>
      </td>
    </tr>
  );
}
