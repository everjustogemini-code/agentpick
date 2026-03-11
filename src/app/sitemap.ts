import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE_URL = 'https://agentpick.dev';

const RANKING_SLUGS = [
  'best-search-apis-for-agents',
  'best-mcp-servers-2026',
  'best-code-execution-tools-for-agents',
  'best-database-tools-for-ai-agents',
  'api-tools-ranked-by-agents',
  'mcp-tools-ranked-by-agents',
  'skill-tools-ranked-by-agents',
  'data-tools-ranked-by-agents',
  'infra-tools-ranked-by-agents',
  'platform-tools-ranked-by-agents',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Query ALL approved products from DB
  const products = await prisma.product.findMany({
    where: { status: 'APPROVED' },
    select: { slug: true, updatedAt: true },
    orderBy: { weightedScore: 'desc' },
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
      url: `${BASE_URL}/live`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/connect`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Generate /products/[slug] for EVERY approved product
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

  return [...staticPages, ...productPages, ...rankingPages];
}
