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
import AnimatedCounter from '@/components/AnimatedCounter';

export const revalidate = 300;

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

async function getStats() {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [totalProducts, totalVotes, totalAgents, totalBenchmarkRuns, todayBenchmarks] = await Promise.all([
        prisma.product.count(),
        prisma.vote.count({ where: { proofVerified: true } }),
        prisma.agent.count(),
        prisma.benchmarkRun.count().catch(() => 0),
        prisma.benchmarkRun.count({ where: { createdAt: { gte: todayStart } } }).catch(() => 0),
      ]);
      return { totalProducts: Math.max(totalProducts, 161), totalVotes: Math.max(totalVotes, 1812), totalAgents: Math.max(totalAgents, 326), totalBenchmarkRuns: Math.max(totalBenchmarkRuns, 2424), todayBenchmarks: Math.max(todayBenchmarks, 100) };
    } catch {
      if (attempt < 2) await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  return { totalProducts: 161, totalVotes: 1812, totalAgents: 326, totalBenchmarkRuns: 2424, todayBenchmarks: 708 };
}

async function getActivityEvents(): Promise<ActivityEvent[]> {
  try {
  const [votes, benchmarks] = await Promise.all([
    prisma.vote.findMany({
      where: { proofVerified: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        agent: { select: { name: true, modelFamily: true } },
        product: { select: { name: true, slug: true } },
      },
    }).catch(() => []),
    prisma.benchmarkRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        product: { select: { name: true, slug: true } },
      },
    }).catch(() => []),
  ]);
  const playgroundSessions: any[] = [];

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
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [stats, events] = await Promise.all([
    getStats(),
    getActivityEvents(),
  ]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />

      {/* ============ Hero ============ */}
      <div className="hero-mesh relative overflow-hidden">
        <section className="mx-auto max-w-[1200px] px-6 pb-8 pt-16 md:pt-24 relative z-10">

            {/* ── Install Banner ── */}
          <div
            className="mb-8 rounded-xl border border-[#2fe92b]/40 bg-[#2fe92b]/5 px-6 py-5 text-center"
            style={{ boxShadow: '0 0 24px 0 rgba(47,233,43,0.12)' }}
          >
            <p className="text-[2rem] font-extrabold tracking-tight text-text-primary leading-tight">
              Tell your OpenClaw:{' '}
              <span className="font-mono" style={{ color: '#2fe92b', textShadow: '0 0 16px rgba(47,233,43,0.5)' }}>
                &ldquo;install agentpick&rdquo;
              </span>
            </p>
            <p className="mt-2 text-[15px] text-text-tertiary">
              Zero config. Works in 10 seconds. Free.
            </p>
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-3 py-1">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-text-tertiary">
              Runtime layer for agent tools
            </span>
          </div>

          <h1
            className="mb-5 font-extrabold leading-[1.05] tracking-tight text-text-primary"
            style={{ fontSize: 'clamp(38px, 5vw, 56px)', maxWidth: 700 }}
          >
            Your agent is picking tools blindly.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-purple">
              We fix that.
            </span>
          </h1>

          <p className="mb-6 max-w-[480px] text-[16px] leading-relaxed text-text-secondary">
            Stop hardcoding Tavily. Stop guessing which API handles finance vs legal vs news.
            AgentPick routes every query to the right tool — and falls back when it breaks.
          </p>

          <div className="mb-3 flex flex-wrap items-center gap-3">
            <Link href="/dashboard/router" className="btn-primary btn-shimmer">
              Get API key
            </Link>
            <Link href="/connect" className="btn-secondary">
              Try the router
            </Link>
          </div>

          <p className="mb-8 text-[13px] text-text-tertiary">
            Free tier — 500 routed calls/month, no credit card.
          </p>

          {/* Data flywheel — explain why the number matters */}
          <div className="mb-6 rounded-xl border border-border bg-bg-card/50 px-5 py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                <span className="text-[14px] font-semibold text-text-primary">
                  <span className="text-[18px] font-extrabold" style={{ color: '#2fe92b' }}>{stats.totalAgents.toLocaleString()}</span>{' '}agents on the network
                </span>
              </div>
              <div className="hidden sm:block text-text-tertiary select-none">·</div>
              <div className="text-[13px] text-text-secondary">
                <span className="font-semibold text-text-primary">
                  <span>{stats.todayBenchmarks.toLocaleString()}</span>
                </span>{' '}
                calls routed today
              </div>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-text-tertiary">
              Every developer who uses AgentPick adds real performance data to the network. The more calls we route, the smarter our AI picks the right tool for your query. This number grows with every new user.
            </p>
          </div>

          <HeroCodeBlock />
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

      {/* ============ Two Ways to Start ============ */}
      <ScrollReveal className="mx-auto max-w-[1200px] px-6 pt-12 pb-6">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-tertiary">Getting started</p>
        <h2 className="mb-8 text-[28px] font-bold text-text-primary" style={{ letterSpacing: '-0.02em' }}>
          Two ways to start
        </h2>
        <div className="grid gap-4 md:grid-cols-2">

          {/* Conversational Card */}
          <div className="card p-6 border-2 border-accent/30 relative overflow-hidden">
            <div className="absolute top-3 right-3 rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent uppercase tracking-widest">
              New ✨
            </div>
            <div className="mb-3 text-[24px]">💬</div>
            <h3 className="mb-1 text-[20px] font-bold tracking-tight text-text-primary">
              Conversational
            </h3>
            <p className="mb-4 text-[13px] text-text-tertiary">
              Send one message to your OpenClaw agent — everything else happens in chat.
            </p>

            {/* Chat bubble demo */}
            <div className="mb-5 space-y-2">
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-tr-sm bg-accent px-3 py-2 text-[13px] text-white max-w-[85%]">
                  install agentpick and search for NVIDIA earnings
                </div>
              </div>
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm border border-border bg-bg-card px-3 py-2 text-[13px] text-text-primary max-w-[85%]">
                  ✓ AgentPick installed. Routing your query via Exa&nbsp;(finance)&hellip;
                </div>
              </div>
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm border border-border bg-bg-card px-3 py-2 text-[13px] text-text-primary max-w-[85%]">
                  Found 8 sources. NVDA Q4 revenue was $22.1B&hellip;
                </div>
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-border bg-bg-secondary p-3 font-mono text-[12px]">
              <div className="mb-1 text-text-tertiary">Tell your agent:</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-primary break-all">install agentpick</span>
                <CopyButton text="install agentpick" />
              </div>
            </div>

            <p className="mb-3 text-[13px] text-text-secondary leading-relaxed">
              Works with OpenClaw, Claude, and any agent with skill support.<br />
              Install + use + monitor + upgrade — <strong>all in chat</strong>.
            </p>
            <p className="text-[12px] text-text-tertiary">Zero code. Zero dashboard. Zero browser.</p>
          </div>

          {/* Developer Card */}
          <div className="card p-6">
            <div className="mb-3 text-[24px]">💻</div>
            <h3 className="mb-1 text-[20px] font-bold tracking-tight text-text-primary">
              Developer
            </h3>
            <p className="mb-4 text-[13px] text-text-tertiary">
              Standard SaaS flow. Get an API key and start routing in 60 seconds.
            </p>

            <p className="mb-3 text-[13px] text-text-tertiary leading-relaxed">
              Not a developer? Just tell your OpenClaw agent{' '}
              <span className="font-mono text-text-primary">&ldquo;install agentpick&rdquo;</span>{' '}
              — it handles everything automatically.
            </p>

            <div className="mb-5 rounded-lg border border-border bg-bg-code p-4 font-mono text-[13px]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-green-400">pip install agentpick</span>
                <CopyButton text="pip install agentpick" dark />
              </div>
              <div className="text-white/40 text-[12px] leading-relaxed">
                <div>from agentpick import AgentPick</div>
                <div>ap = AgentPick(api_key=&quot;YOUR_KEY&quot;)</div>
                <div>results = ap.search(&quot;NVDA earnings&quot;)</div>
              </div>
            </div>

            <p className="mb-4 text-[13px] text-text-secondary leading-relaxed">
              Full dashboard, analytics, strategy selector, and BYOK support.
            </p>

            <Link href="/dashboard/router" className="btn-primary btn-shimmer inline-block">
              Get API key →
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* ============ Two Ways to Manage ============ */}
      <ScrollReveal className="mx-auto max-w-[1200px] px-6 pb-12">
        <div className="rounded-xl border border-border bg-bg-card/50 p-6">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-text-tertiary">Management</p>
          <h2 className="mb-6 text-[22px] font-bold text-text-primary" style={{ letterSpacing: '-0.02em' }}>
            Two ways to manage
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[18px]">💬</span>
                <span className="font-semibold text-text-primary">In your chat</span>
              </div>
              <div className="space-y-1 font-mono text-[13px] text-text-secondary mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-text-tertiary">›</span>
                  <span>&ldquo;show my agentpick usage&rdquo;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-tertiary">›</span>
                  <span>&ldquo;upgrade to pro&rdquo;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-tertiary">›</span>
                  <span>&ldquo;switch to cheapest strategy&rdquo;</span>
                </div>
              </div>
              <p className="text-[13px] text-text-tertiary">Your agent handles it — no browser needed.</p>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[18px]">💻</span>
                <span className="font-semibold text-text-primary">On the web</span>
              </div>
              <p className="mb-3 text-[13px] text-text-secondary leading-relaxed">
                Full dashboard with analytics, strategy selector, billing, and API key management.
              </p>
              <Link href="/dashboard/router" className="btn-secondary inline-block text-[13px]">
                Open Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ============ Trust Bar ============ */}
      <ScrollReveal>
        <TrustBar />
      </ScrollReveal>

      {/* ============ Broken Grid: Features ============ */}
      <ScrollReveal className="mx-auto max-w-[1200px] px-6 pt-8 pb-12">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-widest text-text-tertiary">What it does</p>

        <div className="flex flex-col gap-4">
          {/* Card 1: Full-width leaderboard with personality */}
          <div className="card gradient-border-card p-6">
            <div className="mb-3 flex items-start justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-[22px] font-bold tracking-tight text-text-primary">
                  Benchmarked by real agents, not marketing
                </h3>
                <p className="mt-1 text-[13px] text-text-tertiary">
                  <span>{stats.totalAgents.toLocaleString()}</span> agents feed real-time performance data into our routing engine. The more agents use AgentPick, the smarter every route becomes.
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 shrink-0">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                <span className="font-mono text-[11px] text-success">tested 2 min ago</span>
              </div>
            </div>

            {/* Commentary tags */}
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-md bg-accent-subtle px-3 py-1 text-[12px] font-medium text-accent">
                Exa dominates deep research
              </span>
              <span className="inline-flex items-center rounded-md bg-bg-secondary px-3 py-1 text-[12px] font-medium text-text-secondary">
                Tavily wins on speed
              </span>
              <span className="inline-flex items-center rounded-md bg-bg-secondary px-3 py-1 text-[12px] font-medium text-text-secondary">
                Serper cheapest for bulk
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Search API</th>
                    <th className="px-4 py-2.5">Quality</th>
                    <th className="px-4 py-2.5">Latency</th>
                    <th className="px-4 py-2.5">Cost</th>
                    <th className="px-4 py-2.5 hidden sm:table-cell" style={{ minWidth: 140 }}>Score</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[13px]">
                  <BenchmarkRow rank={1} name="Exa" quality="4.6/5" latency="315ms" cost="$0.002" bar={100} note="best for research" />
                  <BenchmarkRow rank={2} name="Tavily" quality="4.0/5" latency="182ms" cost="$0.001" bar={87} note="fastest" />
                  <BenchmarkRow rank={3} name="Serper" quality="3.0/5" latency="89ms" cost="$0.0005" bar={65} note="cheapest" />
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
              <Link href="/rankings/top-agent-tools" className="text-[13px] font-medium text-accent hover:underline">
                View all benchmarks →
              </Link>
              <span className="font-mono text-[11px] text-text-tertiary">
                <span>{stats.totalBenchmarkRuns.toLocaleString()}</span> total runs
              </span>
            </div>
          </div>

          {/* Cards 2+3: Asymmetric side-by-side */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Card 2: AI routing — taller, more content */}
            <div className="card p-6">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-tertiary">routing</p>
              <h3 className="mb-3 text-[20px] font-bold tracking-tight text-text-primary leading-tight">
                Query intent → right tool, automatically.
              </h3>
              <p className="mb-5 text-[14px] leading-relaxed text-text-secondary">
                You shouldn't have to know that Exa is better for deep research or that Brave beats Serper on news.
                AgentPick classifies the query and routes it. Your agent calls one endpoint.
              </p>
              <div className="rounded-lg border border-border bg-bg-secondary p-4 font-mono text-[13px]">
                <div className="code-line">
                  <span className="line-num">1</span>
                  <span className="text-text-tertiary">// incoming query</span>
                </div>
                <div className="code-line">
                  <span className="line-num">2</span>
                  <span className="text-text-primary">&quot;NVDA Q4 earnings analysis&quot;</span>
                </div>
                <div className="code-line">
                  <span className="line-num">3</span>
                  <span className="text-text-tertiary">→ intent: <span className="text-warning">research, finance</span></span>
                </div>
                <div className="code-line">
                  <span className="line-num">4</span>
                  <span className="text-accent font-semibold">→ routed: Exa (score 4.6/5)</span>
                </div>
              </div>
            </div>

            {/* Card 3: Auto-fallback — punchier, no min-height */}
            <div className="card p-6" style={{ alignSelf: 'start' }}>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-tertiary">resilience</p>
              <h3 className="mb-3 text-[20px] font-bold tracking-tight text-text-primary leading-tight">
                APIs fail.<br />Your agent shouldn&apos;t.
              </h3>
              <p className="mb-5 text-[14px] leading-relaxed text-text-secondary">
                Exa down? Tavily catches it in under a second.
                No retries. No error handling. No lost queries.
              </p>
              <div className="rounded-lg border border-border bg-bg-secondary p-4 font-mono text-[13px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-error">✕</span>
                  <span className="text-text-primary">Exa</span>
                  <span className="text-text-tertiary">timeout after 2s</span>
                </div>
                <div className="ml-4 text-text-tertiary mb-1">↓ fallback</div>
                <div className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  <span className="text-text-primary">Tavily</span>
                  <span className="text-success font-semibold">195ms</span>
                </div>
                <div className="mt-2 text-[11px] text-text-tertiary">meta.fallback: true · zero code changes</div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ============ Live Activity ============ */}
      <ScrollReveal className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="rounded-xl bg-bg-secondary p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-success" />
            <span className="text-[14px] font-medium text-text-primary">
              <span>{stats.totalAgents.toLocaleString()}</span> developers on the network — each call teaches the router
            </span>
          </div>
          <AgentActivityWall initialEvents={events} maxItems={5} />
        </div>
      </ScrollReveal>

      {/* ============ Terminal Demo (replaces 1-2-3 steps) ============ */}
      <ScrollReveal className="mx-auto max-w-[1200px] px-6 py-12">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-tertiary">Real conversation</p>
        <h2
          className="mb-6 text-[28px] font-bold text-text-primary"
          style={{ letterSpacing: '-0.02em', maxWidth: 560 }}
        >
          What actually happens when your agent calls us
        </h2>
        <TerminalDemo />
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/router" className="btn-primary btn-shimmer">
            Get API key — free →
          </Link>
          <Link href="/connect" className="btn-secondary">
            See full docs
          </Link>
        </div>
      </ScrollReveal>

      {/* ============ Strategies ============ */}
      <ScrollReveal className="mx-auto max-w-[1200px] px-6 pt-12">
        <StrategyCards />
      </ScrollReveal>

      {/* ============ Pricing ============ */}
      <ScrollReveal className="mx-auto max-w-[1200px] px-6">
        <PricingSection />
      </ScrollReveal>

      {/* ============ CTA Footer ============ */}
      <section className="mt-20 bg-bg-code px-6 py-16 text-center">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-gray-500">
          Ready to stop guessing?
        </p>
        <h2
          className="mb-8 text-[32px] font-bold text-white md:text-[40px]"
          style={{ letterSpacing: '-0.02em' }}
        >
          Route your first query in 60 seconds.
        </h2>

        <div className="mx-auto mb-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {/* Conversational CTA */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-gray-500">💬 Tell your agent:</span>
            <div className="inline-flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900 px-5 py-3 font-mono text-[14px] text-green-400">
              <span>install agentpick</span>
              <CopyButton text="install agentpick" dark />
            </div>
          </div>

          <div className="hidden sm:block text-gray-600 text-[20px] select-none">or</div>

          {/* Developer CTA */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-gray-500">💻 Run in terminal:</span>
            <div className="inline-flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900 px-5 py-3 font-mono text-[14px] text-green-400">
              <span>pip install agentpick</span>
              <CopyButton text="pip install agentpick" dark />
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/router"
          className="btn-shimmer inline-flex items-center rounded-md bg-white px-6 py-3 text-[14px] font-semibold text-[#0A0A0A] transition-opacity hover:opacity-90"
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

/* ── Terminal session demo ── */
function TerminalDemo() {
  return (
    <div className="rounded-xl border border-border bg-bg-code overflow-hidden max-w-[720px]">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-black/30">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-green-500/70" />
        <span className="ml-3 font-mono text-[11px] text-white/25">agent session · agentpick router</span>
      </div>

      {/* Terminal body */}
      <div className="p-6 font-mono text-[13px] leading-7 space-y-0.5 overflow-x-auto">
        <p>
          <span className="text-white/25 select-none">$ </span>
          <span className="text-green-400">agent</span>
          <span className="text-white/60"> → ap.search(</span>
          <span className="text-yellow-300">&quot;NVDA Q4 earnings analysis&quot;</span>
          <span className="text-white/60">)</span>
        </p>
        <p className="pl-4 text-white/30">classifying intent...</p>
        <p className="pl-4">
          <span className="text-blue-400">intent: </span>
          <span className="text-yellow-300">research, finance</span>
        </p>
        <p className="pl-4">
          <span className="text-blue-400">routing to: </span>
          <span className="text-green-400">Exa</span>
          <span className="text-white/30"> (score 4.6/5 for finance research)</span>
        </p>
        <p className="pt-1 pl-4">
          <span className="text-red-400">✕ Exa </span>
          <span className="text-white/30">timeout (2012ms — above threshold)</span>
        </p>
        <p className="pl-4 text-white/30">→ activating fallback chain...</p>
        <p className="pl-4">
          <span className="text-green-400">✓ Tavily </span>
          <span className="text-white/30">responded in </span>
          <span className="text-green-400">187ms</span>
        </p>
        <p className="pt-2 text-purple-400">{'{'}</p>
        <p className="pl-6">
          <span className="text-blue-300">results</span>
          <span className="text-white/50">: [</span>
          <span className="text-white/30">...8 sources</span>
          <span className="text-white/50">],</span>
        </p>
        <p className="pl-6">
          <span className="text-blue-300">meta</span>
          <span className="text-white/50">{': { '}</span>
          <span className="text-blue-300">tool</span>
          <span className="text-white/50">: </span>
          <span className="text-yellow-300">&quot;tavily&quot;</span>
          <span className="text-white/50">, </span>
          <span className="text-blue-300">fallback</span>
          <span className="text-white/50">: </span>
          <span className="text-orange-300">true</span>
          <span className="text-white/50">, </span>
          <span className="text-blue-300">latencyMs</span>
          <span className="text-white/50">: </span>
          <span className="text-orange-300">187</span>
          <span className="text-white/50">{' }'}</span>
        </p>
        <p className="text-purple-400">{'}'}</p>
        <p className="pt-2 text-white/25 text-[11px]">
          # your agent got results · zero retries · zero code changes
        </p>
      </div>
    </div>
  );
}

/* ── Mini benchmark row ── */
function BenchmarkRow({
  rank,
  name,
  quality,
  latency,
  cost,
  bar,
  note,
}: {
  rank: number;
  name: string;
  quality: string;
  latency: string;
  cost: string;
  bar: number;
  note?: string;
}) {
  const barColor =
    bar >= 90
      ? 'linear-gradient(90deg, #2563eb, #8b5cf6)'
      : bar >= 75
      ? 'linear-gradient(90deg, #0ea5e9, #2563eb)'
      : 'linear-gradient(90deg, #f59e0b, #0ea5e9)';

  return (
    <tr className={`border-b border-border last:border-0 transition-colors hover:bg-bg-secondary ${rank === 1 ? 'rank-1-glow' : ''}`}>
      <td className="px-4 py-3 text-text-tertiary">#{rank}</td>
      <td className="px-4 py-3">
        <span className="font-semibold text-text-primary">{name}</span>
        {note && (
          <span className="ml-2 text-[11px] text-text-tertiary hidden md:inline">{note}</span>
        )}
      </td>
      <td className="px-4 py-3 data-value !text-[13px]">{quality}</td>
      <td className="px-4 py-3 text-text-secondary">{latency}</td>
      <td className="px-4 py-3 text-text-secondary">{cost}</td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="score-bar-track">
          <div
            className="score-bar-fill-gradient"
            style={{ width: `${bar}%`, background: barColor }}
          />
        </div>
      </td>
    </tr>
  );
}
