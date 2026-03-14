import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BROWSE_STATUSES } from '@/lib/product-status';
import { apiError } from '@/types';
import { CAPABILITY_TOOLS, TOOL_CHARACTERISTICS } from '@/lib/router/index';

const db = prisma as any;

const CAPABILITY_TO_CATEGORY: Record<string, string> = {
  search: 'search_research',
  crawl: 'web_crawling',
  embed: 'storage_memory',
  finance: 'finance_data',
};

export async function GET(request: NextRequest) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

    const url = new URL(request.url);
    const capability = url.searchParams.get('capability') ?? 'search';
    const category = CAPABILITY_TO_CATEGORY[capability];

    if (!category) {
      return apiError('VALIDATION_ERROR', `Unknown capability: ${capability}`, 400);
    }

    // Only include tools that the router can actually use for this capability
    const allowedSlugs = CAPABILITY_TOOLS[capability] ?? [];

    const products = await db.product.findMany({
      where: {
        category: category as any,
        status: { in: BROWSE_STATUSES },
        slug: { in: allowedSlugs },
      },
      select: {
        slug: true,
        name: true,
        weightedScore: true,
        avgLatencyMs: true,
        avgCostUsd: true,
        avgBenchmarkRelevance: true,
        successRate: true,
      },
      take: 10,
    });

    // Enrich products with hardcoded characteristics as fallback
    for (const product of products) {
      const chars = TOOL_CHARACTERISTICS[product.slug];
      if (chars) {
        if (product.avgLatencyMs == null) product.avgLatencyMs = chars.latency;
        if (product.avgCostUsd == null) product.avgCostUsd = chars.cost;
        if (product.weightedScore == null) product.weightedScore = chars.quality;
      }
    }

    const strategies = {
      BALANCED: [...products].sort((left, right) => (right.weightedScore ?? 0) - (left.weightedScore ?? 0)),
      FASTEST: [...products].sort((left, right) => (left.avgLatencyMs ?? 9999) - (right.avgLatencyMs ?? 9999)),
      CHEAPEST: [...products].sort((left, right) => (left.avgCostUsd ?? 9999) - (right.avgCostUsd ?? 9999)),
      MOST_ACCURATE: [...products].sort((left, right) => (right.avgBenchmarkRelevance ?? 0) - (left.avgBenchmarkRelevance ?? 0)),
    };

    const result: Record<
      string,
      {
        top_pick: string;
        top_3: Array<{ slug: string; name: string; score?: number; latency?: number; cost?: number; relevance?: number }>;
      }
    > = {};

    for (const [strategy, sorted] of Object.entries(strategies)) {
      result[strategy] = {
        top_pick: sorted[0]?.slug ?? 'none',
        top_3: sorted.slice(0, 3).map((product) => ({
          slug: product.slug,
          name: product.name,
          score: product.weightedScore ?? undefined,
          latency: product.avgLatencyMs ?? undefined,
          cost: product.avgCostUsd ?? undefined,
          relevance: product.avgBenchmarkRelevance ?? undefined,
        })),
      };
    }

    return Response.json({
      capability,
      category,
      strategies: result,
      recommendation: 'Use balanced for general use. Switch to most_stable for uptime, cheapest for batch jobs, best_performance for research.',
    });
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] GET /api/v1/router/compare-strategies error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
