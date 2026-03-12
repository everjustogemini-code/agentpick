import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { RANKING_STATUSES } from '@/lib/product-status';

// Map capability to category
const CAPABILITY_MAP: Record<string, string> = {
  search: 'search_research',
  research: 'search_research',
  crawl: 'web_crawling',
  crawling: 'web_crawling',
  scrape: 'web_crawling',
  code: 'code_compute',
  compute: 'code_compute',
  storage: 'storage_memory',
  memory: 'storage_memory',
  communication: 'communication',
  email: 'communication',
  payment: 'payments_commerce',
  commerce: 'payments_commerce',
  finance: 'finance_data',
  auth: 'auth_identity',
  identity: 'auth_identity',
  scheduling: 'scheduling',
  ai: 'ai_models',
  llm: 'ai_models',
  observability: 'observability',
  monitoring: 'observability',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const capability = searchParams.get('capability');
  const domain = searchParams.get('domain');

  if (!capability) {
    return NextResponse.json(
      { error: 'Missing required parameter: capability' },
      { status: 400 },
    );
  }

  const category = CAPABILITY_MAP[capability.toLowerCase()] ?? capability;

  // Get top products in this category
  const products = await prisma.product.findMany({
    where: {
      status: { in: RANKING_STATUSES },
      category: category as 'search_research',
    },
    orderBy: { weightedScore: 'desc' },
    take: 5,
    select: {
      slug: true,
      name: true,
      weightedScore: true,
      successRate: true,
      avgLatencyMs: true,
      avgCostUsd: true,
    },
  });

  if (products.length === 0) {
    return NextResponse.json(
      { error: `No products found for capability: ${capability}` },
      { status: 404 },
    );
  }

  // If domain is specified, check if we have domain-specific benchmark data
  let domainReason = '';
  if (domain) {
    const benchmarkData = await prisma.benchmarkRun.groupBy({
      by: ['productId'],
      where: {
        domain,
        success: true,
        relevanceScore: { not: null },
        product: { slug: { in: products.map(p => p.slug) } },
      },
      _avg: { relevanceScore: true },
      _count: true,
    });

    if (benchmarkData.length > 0) {
      // Get product IDs to slugs mapping
      const productIdToSlug = new Map(
        (await prisma.product.findMany({
          where: { slug: { in: products.map(p => p.slug) } },
          select: { id: true, slug: true },
        })).map(p => [p.id, p.slug])
      );

      const domainScores = new Map(
        benchmarkData.map(d => [productIdToSlug.get(d.productId), {
          avgRelevance: d._avg.relevanceScore,
          tests: d._count,
        }])
      );

      const topForDomain = products[0];
      const domainScore = domainScores.get(topForDomain.slug);
      if (domainScore?.avgRelevance) {
        domainReason = ` (${domainScore.avgRelevance.toFixed(1)}/5 relevance, ${domainScore.tests} tests in ${domain})`;
      }
    }
  }

  const top = products[0];
  const alternatives = products.slice(1, 4).map(p => ({
    slug: p.slug,
    name: p.name,
    score: p.weightedScore,
    reason: buildReason(p, top),
  }));

  return NextResponse.json({
    recommended: top.slug,
    name: top.name,
    score: top.weightedScore,
    reason: `Highest ranked for ${capability}${domainReason}`,
    alternatives,
  });
}

function buildReason(
  p: { avgLatencyMs: number | null; avgCostUsd: number | null; weightedScore: number },
  top: { avgLatencyMs: number | null; weightedScore: number },
): string {
  const parts: string[] = [];

  if (p.avgLatencyMs && top.avgLatencyMs && p.avgLatencyMs < top.avgLatencyMs) {
    const faster = ((1 - p.avgLatencyMs / top.avgLatencyMs) * 100).toFixed(0);
    parts.push(`${faster}% faster`);
  }

  if (p.avgCostUsd != null && p.avgCostUsd < 0.001) {
    parts.push('cheapest option');
  }

  if (p.weightedScore < top.weightedScore) {
    const diff = ((top.weightedScore - p.weightedScore) / top.weightedScore * 100).toFixed(0);
    parts.push(`${diff}% lower score`);
  }

  return parts.length > 0 ? parts.join(', ') : 'Good alternative';
}
