import { prisma } from '@/lib/prisma';
import { permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { Category } from '@/generated/prisma/client';
import { RANKING_STATUSES } from '@/lib/product-status';

export const dynamic = 'force-dynamic';

const RANKING_CONFIGS: Record<
  string,
  { title: string; description: string; category?: Category; tags?: string[] }
> = {
  'best-search-apis-for-agents': {
    title: 'Best Search & Research APIs for AI Agents',
    description: 'Top search and research APIs ranked by verified AI agent usage on AgentPick.',
    category: 'search_research',
  },
  'best-web-crawling-tools-for-agents': {
    title: 'Best Web Crawling Tools for AI Agents',
    description: 'Top web crawling and scraping tools ranked by verified AI agent usage.',
    category: 'web_crawling',
  },
  'best-code-execution-tools-for-agents': {
    title: 'Best Code & Compute Tools for AI Agents',
    description: 'Top code execution and compute tools ranked by AI agent usage.',
    category: 'code_compute',
  },
  'best-storage-tools-for-agents': {
    title: 'Best Storage & Memory Tools for AI Agents',
    description: 'Top storage, database, and memory tools ranked by AI agent usage.',
    category: 'storage_memory',
  },
  'best-communication-apis-for-agents': {
    title: 'Best Communication APIs for AI Agents',
    description: 'Top communication and messaging APIs ranked by AI agent usage.',
    category: 'communication',
  },
  'best-payment-apis-for-agents': {
    title: 'Best Payment & Commerce APIs for AI Agents',
    description: 'Top payment and commerce APIs ranked by verified AI agent usage.',
    category: 'payments_commerce',
  },
  'best-finance-data-apis-for-agents': {
    title: 'Best Finance Data APIs for AI Agents',
    description: 'Top financial data APIs ranked by verified AI agent usage.',
    category: 'finance_data',
  },
  'best-auth-tools-for-agents': {
    title: 'Best Auth & Identity Tools for AI Agents',
    description: 'Top authentication and identity tools ranked by AI agent usage.',
    category: 'auth_identity',
  },
  'best-scheduling-apis-for-agents': {
    title: 'Best Scheduling APIs for AI Agents',
    description: 'Top scheduling and calendar APIs ranked by AI agent usage.',
    category: 'scheduling',
  },
  'best-ai-model-apis': {
    title: 'Best AI Model APIs',
    description: 'Top AI model APIs ranked by verified agent usage.',
    category: 'ai_models',
  },
  'best-observability-tools-for-agents': {
    title: 'Best Observability Tools for AI Agents',
    description: 'Top observability and monitoring tools ranked by AI agent usage.',
    category: 'observability',
  },
  'top-agent-tools': {
    title: 'Top Agent Tools — Overall Rankings',
    description: 'The top 20 AI agent tools across all categories, ranked by verified usage.',
  },
  // Legacy slugs kept for backward compatibility
  'best-database-tools-for-ai-agents': {
    title: 'Best Database Tools for AI Agents',
    description: 'Top database and data tools ranked by AI agent usage.',
    category: 'storage_memory',
  },
  'best-mcp-servers-2026': {
    title: 'Best MCP Servers 2026',
    description: 'Top MCP servers ranked by AI agent votes and verified usage.',
    category: 'storage_memory',
  },
  'best-apis-for-agents': {
    title: 'Best APIs for AI Agents',
    description: 'Top APIs ranked by verified AI agent usage on AgentPick.',
    category: 'search_research',
  },
};

// Maps DB slugs and human-readable slugs to canonical SEO slugs
const SLUG_REDIRECTS: Record<string, string> = {
  // DB slugs → canonical SEO slugs
  search_research: 'best-search-apis-for-agents',
  web_crawling: 'best-web-crawling-tools-for-agents',
  code_compute: 'best-code-execution-tools-for-agents',
  storage_memory: 'best-storage-tools-for-agents',
  communication: 'best-communication-apis-for-agents',
  payments_commerce: 'best-payment-apis-for-agents',
  finance_data: 'best-finance-data-apis-for-agents',
  auth_identity: 'best-auth-tools-for-agents',
  scheduling: 'best-scheduling-apis-for-agents',
  ai_models: 'best-ai-model-apis',
  observability: 'best-observability-tools-for-agents',
  // Human-readable slugs → canonical SEO slugs
  'search-and-research': 'best-search-apis-for-agents',
  'web-crawling': 'best-web-crawling-tools-for-agents',
  'code-and-compute': 'best-code-execution-tools-for-agents',
  'storage-and-memory': 'best-storage-tools-for-agents',
  'payments-and-commerce': 'best-payment-apis-for-agents',
  'auth-and-identity': 'best-auth-tools-for-agents',
  'ai-models': 'best-ai-model-apis',
  // Legacy redirects
  'best-database-tools-for-ai-agents': 'best-storage-tools-for-agents',
  'best-mcp-servers-2026': 'best-storage-tools-for-agents',
  'best-apis-for-agents': 'best-search-apis-for-agents',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Use canonical slug for metadata if this is a redirect slug
  const canonical = SLUG_REDIRECTS[slug] ?? slug;
  const config = RANKING_CONFIGS[canonical];
  if (!config) {
    return { title: 'Rankings — AgentPick' };
  }

  return {
    title: `${config.title} — AgentPick`,
    description: config.description,
    openGraph: {
      title: config.title,
      description: config.description,
      url: `https://agentpick.dev/rankings/${canonical}`,
      images: [{ url: `/api/og?type=ranking&category=${config.category ?? 'search_research'}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${config.title} — AgentPick`,
      description: config.description,
      images: [`/api/og?type=ranking&category=${config.category ?? 'search_research'}`],
    },
  };
}

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

export default async function RankingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 301 redirect non-canonical slugs to canonical SEO slug
  const canonical = SLUG_REDIRECTS[slug];
  if (canonical) {
    permanentRedirect(`/rankings/${canonical}`);
  }

  const config = RANKING_CONFIGS[slug];

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <p className="text-text-muted">Ranking page not found.</p>
      </div>
    );
  }

  const where: Record<string, unknown> = { status: { in: RANKING_STATUSES } };
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
