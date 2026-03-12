import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { RANKING_STATUSES } from '@/lib/product-status';

// Map capability to category + required tags for filtering
const CAPABILITY_MAP: Record<string, { category: string; tags?: string[] }> = {
  search: { category: 'search_research', tags: ['search'] },
  research: { category: 'search_research', tags: ['search', 'research', 'papers'] },
  crawl: { category: 'web_crawling' },
  crawling: { category: 'web_crawling' },
  scrape: { category: 'web_crawling' },
  code: { category: 'code_compute' },
  compute: { category: 'code_compute' },
  storage: { category: 'storage_memory' },
  memory: { category: 'storage_memory' },
  communication: { category: 'communication' },
  email: { category: 'communication' },
  payment: { category: 'payments_commerce' },
  commerce: { category: 'payments_commerce' },
  finance: { category: 'finance_data' },
  auth: { category: 'auth_identity' },
  identity: { category: 'auth_identity' },
  scheduling: { category: 'scheduling' },
  ai: { category: 'ai_models' },
  llm: { category: 'ai_models' },
  observability: { category: 'observability' },
  monitoring: { category: 'observability' },
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

  try {
    const mapping = CAPABILITY_MAP[capability.toLowerCase()];

    // If no mapping found, also try looking up as a category slug directly
    const VALID_CATEGORIES = [
      'search_research', 'web_crawling', 'code_compute', 'storage_memory',
      'communication', 'payments_commerce', 'finance_data', 'auth_identity',
      'scheduling', 'ai_models', 'observability',
    ];
    const isCategorySlug = VALID_CATEGORIES.includes(capability.toLowerCase());

    if (!mapping && !isCategorySlug) {
      // Also try Capability table as last resort
      const dbCapability = await prisma.capability.findFirst({
        where: {
          OR: [
            { slug: capability.toLowerCase() },
            { name: { equals: capability, mode: 'insensitive' } },
          ],
        },
        select: { slug: true, capCategory: true },
      });

      if (!dbCapability) {
        const knownCapabilities = Object.keys(CAPABILITY_MAP);
        return NextResponse.json({
          error: `Unknown capability: "${capability}"`,
          hint: `Try one of the known capabilities, or use a category slug directly.`,
          available_capabilities: knownCapabilities,
          available_categories: VALID_CATEGORIES,
        }, { status: 404 });
      }

      // Use the DB capability's category
      const category = dbCapability.capCategory;
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
        return NextResponse.json({
          error: `No products found for capability "${capability}" yet`,
          available_capabilities: Object.keys(CAPABILITY_MAP),
        }, { status: 404 });
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
        reason: `Highest ranked for ${capability}`,
        alternatives,
      });
    }

    const category = mapping?.category ?? capability.toLowerCase();
    const requiredTags = mapping?.tags;

    // Get top products in this category, optionally filtered by tags
    const products = await prisma.product.findMany({
      where: {
        status: { in: RANKING_STATUSES },
        category: category as 'search_research',
        ...(requiredTags
          ? { tags: { hasSome: requiredTags } }
          : {}),
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
      return NextResponse.json({
        error: `No products found for capability "${capability}" yet`,
        available_capabilities: Object.keys(CAPABILITY_MAP),
        available_categories: VALID_CATEGORIES,
      }, { status: 404 });
    }

    // If domain is specified, check if we have domain-specific benchmark data
    let domainReason = '';
    if (domain) {
      try {
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
      } catch {
        // Domain benchmark data unavailable — continue without it
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
  } catch (error) {
    console.error('Recommend error:', error);
    return NextResponse.json({
      error: `Failed to fetch recommendations for "${capability}". Please try again.`,
      available_capabilities: Object.keys(CAPABILITY_MAP),
    }, { status: 500 });
  }
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
