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
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  // Generate compare pages for same-category product pairs with 5+ votes
  const compareCandidates = products.filter((p) => {
    // We only have slugs here, so include all approved products
    return true;
  });

  // We'd need category info for proper compare page generation,
  // but for now include top product pairs
  const comparePages: MetadataRoute.Sitemap = [];
  // Compare pages are generated on-demand via URL pattern, not pre-listed

  return [...staticPages, ...productPages, ...rankingPages, ...comparePages];
}
