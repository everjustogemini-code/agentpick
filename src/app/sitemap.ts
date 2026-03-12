import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { BROWSE_STATUSES } from '@/lib/product-status';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://agentpick.dev';

const DOMAIN_SLUGS = [
  'finance',
  'legal',
  'healthcare',
  'ecommerce',
  'devtools',
  'education',
  'news',
  'science',
  'general',
  'multilingual',
];

const RANKING_SLUGS = [
  'best-search-apis-for-agents',
  'best-web-crawling-tools-for-agents',
  'best-code-execution-tools-for-agents',
  'best-storage-tools-for-agents',
  'best-communication-apis-for-agents',
  'best-payment-apis-for-agents',
  'best-finance-data-apis-for-agents',
  'best-auth-tools-for-agents',
  'best-scheduling-apis-for-agents',
  'best-ai-model-apis',
  'best-observability-tools-for-agents',
  'top-agent-tools',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { status: { in: BROWSE_STATUSES } },
    select: { slug: true, updatedAt: true },
    orderBy: { weightedScore: 'desc' },
  });

  // Get recent replays
  const recentReplays = await prisma.benchmarkRun.findMany({
    where: { success: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, createdAt: true },
  });

  // Get recent arena sessions
  const arenaSessions = await prisma.playgroundSession.findMany({
    where: { status: 'completed' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, createdAt: true },
  });

  // Get recent xray reports
  const xrayReports = await prisma.xrayReport.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, createdAt: true },
  });

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/rankings`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/arena`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/xray`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/live`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/connect`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const rankingPages: MetadataRoute.Sitemap = RANKING_SLUGS.map((slug) => ({
    url: `${BASE_URL}/rankings/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  const benchmarkPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/benchmarks`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/playground`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/sdk`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    ...DOMAIN_SLUGS.map((d) => ({
      url: `${BASE_URL}/benchmarks/${d}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ];

  const replayPages: MetadataRoute.Sitemap = recentReplays.map((r) => ({
    url: `${BASE_URL}/replay/${r.id}`,
    lastModified: r.createdAt,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  const arenaPages: MetadataRoute.Sitemap = arenaSessions.map((s) => ({
    url: `${BASE_URL}/arena/${s.id}`,
    lastModified: s.createdAt,
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }));

  const xrayPages: MetadataRoute.Sitemap = xrayReports.map((r) => ({
    url: `${BASE_URL}/xray/${r.id}`,
    lastModified: r.createdAt,
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }));

  return [
    ...staticPages,
    ...productPages,
    ...rankingPages,
    ...benchmarkPages,
    ...replayPages,
    ...arenaPages,
    ...xrayPages,
  ];
}
