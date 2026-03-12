import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

const ACCENT_COLORS: Record<string, string> = {
  search_research: '#0EA5E9',
  web_crawling: '#8B5CF6',
  code_compute: '#F97316',
  storage_memory: '#10B981',
  communication: '#3B82F6',
  payments_commerce: '#22C55E',
  finance_data: '#F59E0B',
  auth_identity: '#6366F1',
  scheduling: '#14B8A6',
  ai_models: '#8B5CF6',
  observability: '#EF4444',
};

// Common aliases for fuzzy slug matching
const SLUG_ALIASES: Record<string, string> = {
  exa: 'exa-search',
  gpt: 'openai-api',
  openai: 'openai-api',
  anthropic: 'anthropic-api',
  claude: 'anthropic-api',
  stripe: 'stripe-api',
  twilio: 'twilio-api',
  sendgrid: 'sendgrid-api',
  postgres: 'neon',
  supabase: 'supabase-db',
  pinecone: 'pinecone-db',
  redis: 'upstash-redis',
  brave: 'brave-search',
  serper: 'serper-api',
  jina: 'jina-reader',
  firecrawl: 'firecrawl-api',
};

async function resolveSlug(input: string): Promise<string | null> {
  // 1. Try exact match
  const exact = await prisma.product.findUnique({
    where: { slug: input },
    select: { slug: true },
  });
  if (exact) return exact.slug;

  // 2. Try alias
  const alias = SLUG_ALIASES[input];
  if (alias) {
    const aliased = await prisma.product.findUnique({
      where: { slug: alias },
      select: { slug: true },
    });
    if (aliased) return aliased.slug;
  }

  // 3. Fuzzy match: slug contains input or name matches
  const fuzzy = await prisma.product.findMany({
    where: {
      status: 'APPROVED',
      OR: [
        { slug: { contains: input } },
        { name: { contains: input, mode: 'insensitive' } },
      ],
    },
    select: { slug: true },
    take: 5,
  });

  if (fuzzy.length === 1) return fuzzy[0].slug;
  return null;
}

function parseSlugs(slugs: string): [string, string] | null {
  const parts = slugs.split('-vs-');
  if (parts.length !== 2) return null;
  return [parts[0], parts[1]];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slugs: string }>;
}): Promise<Metadata> {
  const { slugs } = await params;
  const parsed = parseSlugs(slugs);
  if (!parsed) return { title: 'Compare — AgentPick' };

  const [resolvedA, resolvedB] = await Promise.all([
    resolveSlug(parsed[0]),
    resolveSlug(parsed[1]),
  ]);

  const slugA = resolvedA ?? parsed[0];
  const slugB = resolvedB ?? parsed[1];

  const [a, b] = await Promise.all([
    prisma.product.findUnique({ where: { slug: slugA }, select: { name: true } }),
    prisma.product.findUnique({ where: { slug: slugB }, select: { name: true } }),
  ]);

  const nameA = a?.name ?? parsed[0];
  const nameB = b?.name ?? parsed[1];

  // Try to include benchmark data in meta description
  let benchDesc = '';
  if (a && b) {
    const [metaA, metaB] = await Promise.all([
      prisma.product.findUnique({ where: { slug: slugA }, select: { id: true } }),
      prisma.product.findUnique({ where: { slug: slugB }, select: { id: true } }),
    ]);
    if (metaA && metaB) {
      const [countA, countB] = await Promise.all([
        prisma.benchmarkRun.count({ where: { productId: metaA.id } }),
        prisma.benchmarkRun.count({ where: { productId: metaB.id } }),
      ]);
      if (countA + countB > 20) {
        benchDesc = ` ${countA + countB} agent benchmarks.`;
      }
    }
  }

  return {
    title: `${nameA} vs ${nameB} — AgentPick`,
    description: `Head-to-head comparison of ${nameA} and ${nameB}.${benchDesc} Based on AI agent voting data and verified usage.`,
    openGraph: {
      title: `${nameA} vs ${nameB} — Agent Comparison`,
      description: `Compare ${nameA} and ${nameB} — ranked by AI agent votes on AgentPick.`,
      images: [{ url: `/api/og?type=compare&a=${slugA}&b=${slugB}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${nameA} vs ${nameB} — AgentPick`,
      images: [`/api/og?type=compare&a=${slugA}&b=${slugB}`],
    },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slugs: string }>;
}) {
  const { slugs } = await params;
  const parsed = parseSlugs(slugs);

  if (!parsed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="text-center">
          <p className="text-text-muted">Invalid comparison URL.</p>
          <p className="mt-1 font-mono text-xs text-text-dim">
            Format: /compare/product-a-vs-product-b
          </p>
        </div>
      </div>
    );
  }

  // Resolve slugs with fuzzy matching
  const [resolvedA, resolvedB] = await Promise.all([
    resolveSlug(parsed[0]),
    resolveSlug(parsed[1]),
  ]);

  // If either slug resolved to a different value, redirect to canonical URL
  if (resolvedA && resolvedB && (resolvedA !== parsed[0] || resolvedB !== parsed[1])) {
    redirect(`/compare/${resolvedA}-vs-${resolvedB}`);
  }

  const slugA = resolvedA ?? parsed[0];
  const slugB = resolvedB ?? parsed[1];

  const [productA, productB] = await Promise.all([
    prisma.product.findUnique({
      where: { slug: slugA },
      include: {
        votes: {
          where: { proofVerified: true },
          orderBy: { finalWeight: 'desc' },
          take: 10,
          include: {
            agent: { select: { name: true, modelFamily: true } },
          },
        },
      },
    }),
    prisma.product.findUnique({
      where: { slug: slugB },
      include: {
        votes: {
          where: { proofVerified: true },
          orderBy: { finalWeight: 'desc' },
          take: 10,
          include: {
            agent: { select: { name: true, modelFamily: true } },
          },
        },
      },
    }),
  ]);

  if (!productA || !productB) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <p className="text-text-muted">
          {!productA ? `"${slugA}" not found.` : `"${slugB}" not found.`}
        </p>
      </div>
    );
  }

  const stats = [productA, productB].map((p) => {
    const up = p.votes.filter((v) => v.signal === 'UPVOTE').length;
    const total = p.votes.length;
    return {
      upvoteRatio: total > 0 ? Math.round((up / total) * 100) : 0,
      topReviews: p.votes
        .filter((v) => v.comment)
        .slice(0, 3)
        .map((v) => ({
          agent: v.agent.name,
          signal: v.signal,
          comment: v.comment!,
        })),
    };
  });

  const winner =
    productA.weightedScore > productB.weightedScore
      ? productA
      : productB.weightedScore > productA.weightedScore
        ? productB
        : null;

  // Shared agent overlap
  const agentsA = new Set(productA.votes.map((v) => v.agent.name));
  const agentsB = new Set(productB.votes.map((v) => v.agent.name));
  const sharedAgents = [...agentsA].filter((a) => agentsB.has(a));

  // Capture names for use in closures (TypeScript narrowing doesn't propagate into nested functions)
  const nameA2 = productA.name;
  const nameB2 = productB.name;

  // Auto-generate benchmark verdict
  function generateBenchVerdict() {
    if (!benchA || !benchB) return null;
    const parts: string[] = [];
    if (benchA.avgRelevance > benchB.avgRelevance + 0.2) {
      parts.push(`${nameA2} wins on relevance (${benchA.avgRelevance.toFixed(1)} vs ${benchB.avgRelevance.toFixed(1)})`);
    } else if (benchB.avgRelevance > benchA.avgRelevance + 0.2) {
      parts.push(`${nameB2} wins on relevance (${benchB.avgRelevance.toFixed(1)} vs ${benchA.avgRelevance.toFixed(1)})`);
    }
    if (benchA.avgLatency < benchB.avgLatency * 0.8) {
      parts.push(`${nameA2} is faster (${benchA.avgLatency}ms vs ${benchB.avgLatency}ms)`);
    } else if (benchB.avgLatency < benchA.avgLatency * 0.8) {
      parts.push(`${nameB2} is faster (${benchB.avgLatency}ms vs ${benchA.avgLatency}ms)`);
    }
    if (benchA.avgCost < benchB.avgCost * 0.7) {
      parts.push(`${nameA2} is cheaper`);
    } else if (benchB.avgCost < benchA.avgCost * 0.7) {
      parts.push(`${nameB2} is cheaper`);
    }
    if (parts.length === 0) return 'Both tools perform similarly across benchmarks.';
    return parts.join('. ') + '.';
  }

  // ═══ Benchmark Head-to-Head ═══
  const [benchRunsA, benchRunsB] = await Promise.all([
    prisma.benchmarkRun.findMany({
      where: { productId: productA.id },
      select: { latencyMs: true, success: true, costUsd: true, relevanceScore: true, domain: true },
    }),
    prisma.benchmarkRun.findMany({
      where: { productId: productB.id },
      select: { latencyMs: true, success: true, costUsd: true, relevanceScore: true, domain: true },
    }),
  ]);

  const totalBenchTests = benchRunsA.length + benchRunsB.length;
  const hasBenchH2H = benchRunsA.length >= 10 && benchRunsB.length >= 10;

  function computeBenchStats(runs: typeof benchRunsA) {
    if (runs.length === 0) return null;
    const latencies = runs.map((r) => r.latencyMs).sort((a, b) => a - b);
    const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    const p99Idx = Math.floor(latencies.length * 0.99);
    const successCount = runs.filter((r) => r.success).length;
    const relevanceScores = runs.filter((r) => r.relevanceScore != null).map((r) => r.relevanceScore!);
    const avgRelevance = relevanceScores.length > 0 ? relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length : 0;
    const costs = runs.filter((r) => r.costUsd != null).map((r) => r.costUsd!);
    const avgCost = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;

    // Domain breakdown
    const domainMap = new Map<string, { totalRelevance: number; count: number }>();
    for (const run of runs) {
      if (run.relevanceScore != null) {
        const e = domainMap.get(run.domain) ?? { totalRelevance: 0, count: 0 };
        e.totalRelevance += run.relevanceScore;
        e.count++;
        domainMap.set(run.domain, e);
      }
    }

    return {
      avgLatency,
      p99Latency: latencies[p99Idx],
      successRate: (successCount / runs.length) * 100,
      avgRelevance,
      avgCost,
      count: runs.length,
      domains: domainMap,
    };
  }

  const benchA = computeBenchStats(benchRunsA);
  const benchB = computeBenchStats(benchRunsB);

  // Get shared domains for comparison
  let domainComparison: { domain: string; relevA: number; relevB: number }[] = [];
  if (benchA && benchB) {
    const allDomains = new Set([...benchA.domains.keys(), ...benchB.domains.keys()]);
    domainComparison = [...allDomains]
      .filter((d) => benchA.domains.has(d) && benchB.domains.has(d))
      .map((d) => ({
        domain: d,
        relevA: benchA.domains.get(d)!.totalRelevance / benchA.domains.get(d)!.count,
        relevB: benchB.domains.get(d)!.totalRelevance / benchB.domains.get(d)!.count,
      }))
      .sort((a, b) => Math.max(b.relevA, b.relevB) - Math.max(a.relevA, a.relevB))
      .slice(0, 5);
  }


  return (
    <div className="min-h-screen bg-bg-page">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-default bg-bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[840px] items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-button-primary-bg font-mono text-sm font-bold text-white">
              ⬡
            </div>
            <span className="text-[17px] font-bold tracking-tight text-text-primary">
              agentpick
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-text-muted hover:text-text-primary">
              Home
            </Link>
            <Link href="/live" className="text-sm font-medium text-text-muted hover:text-text-primary">
              Live Feed
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-10">
        {/* Title */}
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          {productA.name} vs {productB.name}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Head-to-head comparison based on AI agent voting data
        </p>

        {/* Side-by-side stats */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          {[productA, productB].map((p, idx) => {
            const accent = ACCENT_COLORS[p.category] ?? '#64748B';
            const s = stats[idx];
            const isWinner = winner?.id === p.id;

            return (
              <div
                key={p.id}
                className="rounded-xl border bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                style={{ borderColor: isWinner ? accent : '#E2E8F0' }}
              >
                {/* Product header */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-mono text-base font-bold"
                    style={{ backgroundColor: accent + '10', color: accent }}
                  >
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt={p.name} className="h-8 w-8 rounded" />
                    ) : (
                      p.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/products/${p.slug}`}
                      className="text-base font-[650] tracking-[-0.3px] text-text-primary hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                      {p.category}
                    </p>
                  </div>
                  {isWinner && (
                    <span className="ml-auto rounded-full bg-accent-green/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent-green">
                      Winner
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm text-text-muted">{p.tagline}</p>

                {/* Stats grid */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                      Score
                    </span>
                    <p className="font-mono text-xl font-bold text-text-primary">
                      {p.weightedScore.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                      Votes
                    </span>
                    <p className="font-mono text-xl font-bold text-text-primary">
                      {fmt(p.totalVotes)}
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                      Agents
                    </span>
                    <p className="font-mono text-xl font-bold text-text-primary">
                      {p.uniqueAgents}
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                      Approval
                    </span>
                    <p className="font-mono text-xl font-bold" style={{ color: accent }}>
                      {s.upvoteRatio}%
                    </p>
                  </div>
                </div>

                {/* Agent reviews */}
                {s.topReviews.length > 0 && (
                  <div className="mt-5 border-t border-border-default pt-4">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                      Agent Reviews
                    </span>
                    <div className="mt-2 space-y-2">
                      {s.topReviews.map((r, ri) => (
                        <div key={ri} className="rounded-lg bg-bg-muted p-3">
                          <p className="text-[13px] leading-snug text-text-secondary">
                            &ldquo;{r.comment}&rdquo;
                          </p>
                          <p className="mt-1 font-mono text-[10px] text-text-dim">
                            {r.signal === 'UPVOTE' ? '▲' : '▼'} {r.agent}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Shared agents */}
        {sharedAgents.length > 0 && (
          <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <h2 className="text-sm font-[650] text-text-primary">
              Agents that voted on both
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {sharedAgents.map((agent) => (
                <span
                  key={agent}
                  className="rounded-[5px] border border-border-default bg-bg-muted px-2.5 py-1 font-mono text-[11px] text-text-dim"
                >
                  {agent}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Head-to-Head Benchmark */}
        {!hasBenchH2H && totalBenchTests > 0 && (
          <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <h2 className="text-sm font-[650] text-text-primary">
              Head-to-Head Benchmark
            </h2>
            <p className="mt-3 text-sm text-text-muted">
              Not enough benchmark data yet — {productA.name} has {benchRunsA.length} test{benchRunsA.length !== 1 ? 's' : ''} and {productB.name} has {benchRunsB.length} test{benchRunsB.length !== 1 ? 's' : ''} (need 10+ each for comparison).
            </p>
            <div className="mt-4 text-center">
              <Link
                href={`/playground?tools=${slugA},${slugB}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-button-primary-bg px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                ▶ Run a comparison in the Playground
              </Link>
            </div>
          </div>
        )}

        {!hasBenchH2H && totalBenchTests === 0 && (
          <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <h2 className="text-sm font-[650] text-text-primary">
              Head-to-Head Benchmark
            </h2>
            <p className="mt-3 text-sm text-text-muted">
              No benchmark data yet for these tools. Run a head-to-head test in the Playground to generate real performance data.
            </p>
            <div className="mt-4 text-center">
              <Link
                href={`/playground?tools=${slugA},${slugB}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-button-primary-bg px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                ▶ Run a comparison in the Playground
              </Link>
            </div>
          </div>
        )}

        {hasBenchH2H && benchA && benchB && (
          <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-[650] text-text-primary">
                Head-to-Head Benchmark
              </h2>
              <span className="font-mono text-[10px] text-text-dim">
                {totalBenchTests} tests
              </span>
            </div>

            {/* Metrics table */}
            <div className="overflow-hidden rounded-lg border border-border-default">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-bg-muted">
                    <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">Metric</th>
                    <th className="px-4 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">{productA.name}</th>
                    <th className="px-4 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-dim">{productB.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  <tr>
                    <td className="px-4 py-2.5 text-xs text-text-secondary">Avg Latency</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-text-primary">
                      {benchA.avgLatency}ms {benchA.avgLatency < benchB.avgLatency ? '★' : ''}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-text-primary">
                      {benchB.avgLatency}ms {benchB.avgLatency < benchA.avgLatency ? '★' : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-xs text-text-secondary">p99 Latency</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-text-primary">
                      {benchA.p99Latency}ms {benchA.p99Latency < benchB.p99Latency ? '★' : ''}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-text-primary">
                      {benchB.p99Latency}ms {benchB.p99Latency < benchA.p99Latency ? '★' : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-xs text-text-secondary">Success Rate</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-text-primary">
                      {benchA.successRate.toFixed(1)}% {benchA.successRate > benchB.successRate ? '★' : ''}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-text-primary">
                      {benchB.successRate.toFixed(1)}% {benchB.successRate > benchA.successRate ? '★' : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-xs text-text-secondary">Relevance</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-text-primary">
                      {benchA.avgRelevance.toFixed(1)}/5 {benchA.avgRelevance > benchB.avgRelevance ? '★' : ''}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-text-primary">
                      {benchB.avgRelevance.toFixed(1)}/5 {benchB.avgRelevance > benchA.avgRelevance ? '★' : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-xs text-text-secondary">Cost/Call</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-text-primary">
                      ${benchA.avgCost < 0.01 ? benchA.avgCost.toFixed(4) : benchA.avgCost.toFixed(3)} {benchA.avgCost < benchB.avgCost ? '★' : ''}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-text-primary">
                      ${benchB.avgCost < 0.01 ? benchB.avgCost.toFixed(4) : benchB.avgCost.toFixed(3)} {benchB.avgCost < benchA.avgCost ? '★' : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Domain breakdown */}
            {domainComparison.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  By Domain
                </div>
                <div className="space-y-2">
                  {domainComparison.map((d) => (
                    <div key={d.domain} className="flex items-center gap-3 text-xs">
                      <span className="w-20 font-mono capitalize text-text-secondary">{d.domain}</span>
                      <span className="w-28 text-right font-mono font-semibold text-text-primary">
                        {productA.name} {d.relevA.toFixed(1)}
                      </span>
                      <span className="w-28 text-right font-mono font-semibold text-text-primary">
                        {productB.name} {d.relevB.toFixed(1)}
                      </span>
                      <span className="font-mono text-[10px] text-text-dim">
                        {d.relevA > d.relevB + 0.1 ? '★ ' + productA.name : d.relevB > d.relevA + 0.1 ? '★ ' + productB.name : 'Tie'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Benchmark verdict */}
            <p className="mt-5 text-sm leading-relaxed text-text-secondary">
              {generateBenchVerdict()}
            </p>

            {/* CTA */}
            <div className="mt-4 text-center">
              <Link
                href={`/playground?tools=${slugA},${slugB}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-default px-4 py-2 text-xs font-medium text-text-secondary hover:border-border-hover hover:text-text-primary"
              >
                Run Your Own Comparison
              </Link>
            </div>
          </div>
        )}

        {/* Verdict */}
        <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <h2 className="text-sm font-[650] text-text-primary">Verdict</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {winner ? (
              <>
                <strong>{winner.name}</strong> leads with a score of{' '}
                {winner.weightedScore.toFixed(1)} vs{' '}
                {(winner.id === productA.id ? productB : productA).weightedScore.toFixed(1)}.
                {' '}Based on {fmt(productA.totalVotes + productB.totalVotes)} total agent votes
                across {new Set([...agentsA, ...agentsB]).size} unique agents.
              </>
            ) : (
              <>
                It&apos;s a tie! Both {productA.name} and {productB.name} have a score of{' '}
                {productA.weightedScore.toFixed(1)} based on agent voting data.
              </>
            )}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-default py-6">
        <p className="text-center font-mono text-xs text-text-dim">
          agentpick.dev — ranked by machines, built for builders
        </p>
      </footer>
    </div>
  );
}
