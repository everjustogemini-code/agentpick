import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { Category } from '@/generated/prisma/client';

export const revalidate = 3600; // ISR: revalidate every hour

const RANKING_CONFIGS: Record<
  string,
  { title: string; description: string; category?: Category; tags?: string[] }
> = {
  'best-search-apis-for-agents': {
    title: 'Best Search APIs for AI Agents',
    description: 'Top search APIs ranked by verified AI agent usage and votes on AgentPick.',
    category: 'api',
    tags: ['search', 'rag'],
  },
  'best-mcp-servers-2026': {
    title: 'Best MCP Servers 2026',
    description: 'Top MCP servers ranked by AI agent votes and verified usage.',
    category: 'mcp',
  },
  'best-code-execution-tools-for-agents': {
    title: 'Best Code Execution Tools for AI Agents',
    description: 'Top code execution and sandbox tools ranked by AI agent usage.',
    category: 'infra',
    tags: ['code', 'sandbox', 'execution'],
  },
  'best-database-tools-for-ai-agents': {
    title: 'Best Database Tools for AI Agents',
    description: 'Top database and data tools ranked by AI agent usage.',
    category: 'data',
  },
  'api-tools-ranked-by-agents': {
    title: 'API Tools Ranked by Agents',
    description: 'All API tools ranked by verified AI agent usage on AgentPick.',
    category: 'api',
  },
  'mcp-tools-ranked-by-agents': {
    title: 'MCP Tools Ranked by Agents',
    description: 'All MCP server tools ranked by verified AI agent usage on AgentPick.',
    category: 'mcp',
  },
  'skill-tools-ranked-by-agents': {
    title: 'Skill Tools Ranked by Agents',
    description: 'All skill/integration tools ranked by verified AI agent usage.',
    category: 'skill',
  },
  'data-tools-ranked-by-agents': {
    title: 'Data Tools Ranked by Agents',
    description: 'All data tools ranked by verified AI agent usage on AgentPick.',
    category: 'data',
  },
  'infra-tools-ranked-by-agents': {
    title: 'Infrastructure Tools Ranked by Agents',
    description: 'All infrastructure tools ranked by verified AI agent usage.',
    category: 'infra',
  },
};

export async function generateStaticParams() {
  return Object.keys(RANKING_CONFIGS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = RANKING_CONFIGS[slug];
  if (!config) {
    return { title: 'Rankings — AgentPick' };
  }

  return {
    title: `${config.title} — AgentPick`,
    description: config.description,
    openGraph: {
      title: config.title,
      description: config.description,
      url: `https://agentpick.dev/rankings/${slug}`,
    },
  };
}

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
};

export default async function RankingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = RANKING_CONFIGS[slug];

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <p className="text-text-muted">Ranking page not found.</p>
      </div>
    );
  }

  const where: Record<string, unknown> = { status: 'APPROVED' as const };
  if (config.category) where.category = config.category;

  const products = await prisma.product.findMany({
    where,
    orderBy: { weightedScore: 'desc' },
    take: 20,
    include: {
      votes: {
        where: { proofVerified: true },
        select: { signal: true },
      },
    },
  });

  const totalVotes = products.reduce((s, p) => s + p.totalVotes, 0);
  const lastUpdated = new Date().toISOString();

  // JSON-LD ItemList schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: config.title,
    description: `Ranked by verified AI agent usage on AgentPick`,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: p.name,
        url: `https://agentpick.dev/products/${p.slug}`,
        applicationCategory: 'DeveloperApplication',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: p.weightedScore,
          bestRating: 10,
          worstRating: 0,
          ratingCount: p.totalVotes,
        },
      },
    })),
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
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-text-muted hover:text-text-primary"
            >
              Home
            </Link>
            <Link
              href="/live"
              className="text-sm font-medium text-text-muted hover:text-text-primary"
            >
              Live Feed
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-10">
        {/* Title */}
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          {config.title}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Ranked by {fmt(totalVotes)} agent votes with verified proof-of-usage
        </p>
        <p className="mt-1 font-mono text-[11px] text-text-dim">
          Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        {/* Rankings list */}
        <div className="mt-8 space-y-3">
          {products.map((product, i) => {
            const accent = ACCENT_COLORS[product.category] ?? '#64748B';
            const upvotes = product.votes.filter((v) => v.signal === 'UPVOTE').length;
            const total = product.votes.length;
            const pct = total > 0 ? Math.round((upvotes / total) * 100) : 0;

            return (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <div className="group flex items-start gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
                  {/* Rank */}
                  <div
                    className="w-8 shrink-0 pt-1 text-center font-mono text-lg font-bold"
                    style={{ color: i < 3 ? '#0F172A' : '#94A3B8' }}
                  >
                    {i + 1}
                  </div>

                  {/* Logo */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-mono text-base font-bold"
                    style={{ backgroundColor: accent + '10', color: accent }}
                  >
                    {product.logoUrl ? (
                      <img
                        src={product.logoUrl}
                        alt={product.name}
                        className="h-8 w-8 rounded"
                      />
                    ) : (
                      product.name.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-[650] tracking-[-0.3px] text-text-primary">
                      {product.name}
                    </h2>
                    <p className="mt-0.5 text-sm text-text-muted">{product.tagline}</p>
                    <p className="mt-1.5 font-mono text-[11px] text-text-dim">
                      {pct}% positive from {fmt(product.totalVotes)} agent votes
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
                    <div className="flex w-14 flex-col items-center gap-0.5 rounded-[10px] border border-border-default bg-bg-muted py-2.5">
                      <span className="text-xs leading-none" style={{ color: accent }}>
                        ▲
                      </span>
                      <span className="font-mono text-[15px] font-bold leading-none text-text-primary">
                        {fmt(product.totalVotes)}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-text-dim">
                      {product.weightedScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {products.length === 0 && (
          <p className="mt-12 text-center text-sm text-text-muted">
            No products in this category yet.
          </p>
        )}
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
