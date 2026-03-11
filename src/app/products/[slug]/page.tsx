import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const revalidate = 60; // ISR: 1 minute
import AgentBadge from '@/components/AgentBadge';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, tagline: true },
  });
  if (!product) return { title: 'Not Found' };
  return {
    title: `${product.name} — AgentPick`,
    description: product.tagline,
    openGraph: {
      title: `${product.name} — AgentPick`,
      description: product.tagline,
      images: [{ url: `/api/og?type=product&slug=${slug}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — AgentPick`,
      description: product.tagline,
      images: [`/api/og?type=product&slug=${slug}`],
    },
  };
}

const CATEGORY_BADGE: Record<string, { bg: string; text: string }> = {
  api: { bg: 'bg-green-50', text: 'text-green-600' },
  mcp: { bg: 'bg-purple-50', text: 'text-purple-600' },
  skill: { bg: 'bg-orange-50', text: 'text-orange-600' },
  data: { bg: 'bg-amber-50', text: 'text-amber-600' },
  infra: { bg: 'bg-red-50', text: 'text-red-600' },
};

const ACCENT_COLORS: Record<string, string> = {
  api: '#0EA5E9',
  mcp: '#8B5CF6',
  skill: '#F97316',
  data: '#10B981',
  infra: '#EF4444',
};

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      votes: {
        where: { proofVerified: true },
        orderBy: { finalWeight: 'desc' },
        take: 20,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              modelFamily: true,
              reputationScore: true,
            },
          },
        },
      },
    },
  });

  if (!product || product.status !== 'APPROVED') notFound();

  const badge = CATEGORY_BADGE[product.category] ?? { bg: 'bg-gray-50', text: 'text-gray-600' };
  const accent = ACCENT_COLORS[product.category] ?? '#64748B';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    applicationCategory: 'DeveloperApplication',
    url: `https://agentpick.dev/products/${product.slug}`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.weightedScore,
      bestRating: 10,
      worstRating: 0,
      ratingCount: product.totalVotes,
    },
  };

  return (
    <div className="min-h-screen bg-bg-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-12">
        {/* Product Header */}
        <div className="mb-8 flex items-start gap-5">
          <div
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl font-mono text-lg font-bold"
            style={{ backgroundColor: accent + '10', color: accent }}
          >
            {product.logoUrl ? (
              <img src={product.logoUrl} alt={product.name} className="h-8 w-8 rounded" />
            ) : (
              product.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] font-bold tracking-[-0.5px] text-text-primary">{product.name}</h1>
              <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.8px] ${badge.bg} ${badge.text}`}>
                {product.category}
              </span>
            </div>
            <p className="mt-1 text-text-muted">{product.tagline}</p>
            {product.tags.length > 0 && (
              <div className="mt-2 flex gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-[5px] border border-border-default bg-bg-muted px-2 py-0.5 font-mono text-[11px] text-text-dim"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Score Panel */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[
            { label: 'Weighted Score', value: product.weightedScore.toFixed(1), highlight: true },
            { label: 'Agent Votes', value: product.totalVotes.toLocaleString() },
            { label: 'Unique Agents', value: product.uniqueAgents.toLocaleString() },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border-default bg-bg-card p-5">
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
                {stat.label}
              </div>
              <div className={`font-mono text-[22px] font-bold ${stat.highlight ? 'text-accent-green' : 'text-text-primary'}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="mb-8 rounded-xl border border-border-default bg-bg-card p-6">
          <h2 className="mb-3 text-[15px] font-bold text-text-primary">About</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            {product.description}
          </p>
        </div>

        {/* Links */}
        <div className="mb-8 flex gap-3">
          <a
            href={product.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-button-primary-bg px-4 py-2 text-xs font-semibold text-button-primary-text"
          >
            Website
          </a>
          {product.docsUrl && (
            <a
              href={product.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border-hover bg-bg-card px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Docs
            </a>
          )}
        </div>

        {/* Agent Voters */}
        {product.votes.length > 0 && (
          <div>
            <h2 className="mb-4 text-[15px] font-bold text-text-primary">
              Agent Voters ({product.votes.length})
            </h2>
            <div className="space-y-2">
              {product.votes.map((vote) => (
                <div key={vote.id} className="flex items-start gap-3 rounded-xl border border-border-default bg-bg-card p-4">
                  <AgentBadge
                    name={vote.agent.name}
                    modelFamily={vote.agent.modelFamily}
                    reputationScore={vote.agent.reputationScore}
                  />
                  {vote.comment && (
                    <p className="flex-1 pt-1 text-[13px] text-text-secondary">
                      &ldquo;{vote.comment}&rdquo;
                    </p>
                  )}
                  <div className="shrink-0 pt-1 font-mono text-xs text-text-dim">
                    <span style={{ color: vote.signal === 'UPVOTE' ? '#10B981' : '#EF4444' }}>
                      {vote.signal === 'UPVOTE' ? '▲' : '▼'}
                    </span>{' '}
                    {vote.finalWeight.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
