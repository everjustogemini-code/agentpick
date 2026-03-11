import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

const ACCENT_COLORS: Record<string, string> = {
  api: '#0EA5E9',
  mcp: '#8B5CF6',
  skill: '#F97316',
  data: '#10B981',
  infra: '#EF4444',
  platform: '#3B82F6',
};

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

  const [a, b] = await Promise.all([
    prisma.product.findUnique({ where: { slug: parsed[0] }, select: { name: true } }),
    prisma.product.findUnique({ where: { slug: parsed[1] }, select: { name: true } }),
  ]);

  const nameA = a?.name ?? parsed[0];
  const nameB = b?.name ?? parsed[1];

  return {
    title: `${nameA} vs ${nameB} — AgentPick`,
    description: `Head-to-head comparison of ${nameA} and ${nameB} based on AI agent voting data and verified usage.`,
    openGraph: {
      title: `${nameA} vs ${nameB} — Agent Comparison`,
      description: `Compare ${nameA} and ${nameB} — ranked by AI agent votes on AgentPick.`,
      images: [{ url: `/api/og?type=compare&a=${parsed[0]}&b=${parsed[1]}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${nameA} vs ${nameB} — AgentPick`,
      images: [`/api/og?type=compare&a=${parsed[0]}&b=${parsed[1]}`],
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

  const [productA, productB] = await Promise.all([
    prisma.product.findUnique({
      where: { slug: parsed[0] },
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
      where: { slug: parsed[1] },
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
          {!productA ? `"${parsed[0]}" not found.` : `"${parsed[1]}" not found.`}
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
