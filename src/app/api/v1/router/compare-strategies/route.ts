import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BROWSE_STATUSES } from '@/lib/product-status';
import { apiError } from '@/types';
import { CAPABILITY_TOOLS, TOOL_CHARACTERISTICS } from '@/lib/router/index';
import { escapeHtml } from '@/lib/sanitize';

const db = prisma as any;

const VALID_CAPABILITIES = Object.keys(CAPABILITY_TOOLS);

export async function GET(request: NextRequest) {
  try {
    const _authHeader = request.headers.get('authorization');
    let _urlForAuth: URL;
    try { _urlForAuth = new URL(request.url); } catch { return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401); }
    if (!_authHeader?.trim() && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
      return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
    }
    if (_authHeader && !_authHeader.trim().toLowerCase().startsWith('bearer ') && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
      return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
    }
    let agent: Awaited<ReturnType<typeof authenticateAgent>>;
    try { agent = await authenticateAgent(request); } catch { return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401); }
    if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

    const url = new URL(request.url);
    const capability = url.searchParams.get('capability') ?? 'search';

    if (!VALID_CAPABILITIES.includes(capability)) {
      return apiError('VALIDATION_ERROR', `Unknown capability: ${escapeHtml(capability)}. Valid: ${VALID_CAPABILITIES.join(', ')}`, 400);
    }

    // Only include tools that the router can actually use for this capability
    const allowedSlugs = CAPABILITY_TOOLS[capability] ?? [];

    // Build base list from TOOL_CHARACTERISTICS — ensures all router-eligible tools appear
    // even if they have no DB product record (e.g. brave-search which is cheapest at $0.0001)
    const baseMap = new Map<string, {
      slug: string;
      name: string;
      weightedScore: number;
      avgLatencyMs: number;
      avgCostUsd: number;
      avgBenchmarkRelevance: number;
      successRate: number;
    }>();
    for (const slug of allowedSlugs) {
      const chars = TOOL_CHARACTERISTICS[slug];
      if (!chars) continue;
      baseMap.set(slug, {
        slug,
        name: slug,
        weightedScore: chars.quality,
        avgLatencyMs: chars.latency,
        avgCostUsd: chars.cost,
        // Use quality as proxy for accuracy when no benchmark data exists
        avgBenchmarkRelevance: chars.quality,
        successRate: chars.stability,
      });
    }

    // Enrich with DB data — slug filter is sufficient; no category filter since
    // search tools are stored as 'ai_models' in the DB but CAPABILITY_TOOLS is authoritative
    const dbProducts = await db.product.findMany({
      where: {
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
      take: 20,
    });

    for (const dbProd of dbProducts) {
      const base = baseMap.get(dbProd.slug);
      if (base) {
        // DB data takes precedence over hardcoded characteristics
        baseMap.set(dbProd.slug, {
          ...base,
          name: dbProd.name || base.name,
          weightedScore: dbProd.weightedScore ?? base.weightedScore,
          avgLatencyMs: dbProd.avgLatencyMs ?? base.avgLatencyMs,
          avgCostUsd: dbProd.avgCostUsd ?? base.avgCostUsd,
          avgBenchmarkRelevance: dbProd.avgBenchmarkRelevance ?? base.avgBenchmarkRelevance,
          successRate: dbProd.successRate ?? base.successRate,
        });
      } else {
        // Tool in DB but missing from TOOL_CHARACTERISTICS — include it
        baseMap.set(dbProd.slug, {
          slug: dbProd.slug,
          name: dbProd.name,
          weightedScore: dbProd.weightedScore ?? 0,
          avgLatencyMs: dbProd.avgLatencyMs ?? 9999,
          avgCostUsd: dbProd.avgCostUsd ?? 9999,
          avgBenchmarkRelevance: dbProd.avgBenchmarkRelevance ?? 0,
          successRate: dbProd.successRate ?? 0,
        });
      }
    }

    const products = [...baseMap.values()];

    // Apply same quality floor as the real router's cheapest strategy
    const QUALITY_FLOOR = 3.0;
    const BALANCED_QUALITY_FLOOR = 4.0;
    const STABLE_QUALITY_FLOOR = 2.5;
    const strategies = {
      // BALANCED mirrors getRankedToolsForCapability('balanced'): quality floor 4.0,
      // then rank by cost-efficiency score (quality / (cost * latency)).
      BALANCED: [...products].sort((left, right) => {
        const lMeetsFloor = (left.weightedScore ?? 0) >= BALANCED_QUALITY_FLOOR;
        const rMeetsFloor = (right.weightedScore ?? 0) >= BALANCED_QUALITY_FLOOR;
        if (lMeetsFloor && !rMeetsFloor) return -1;
        if (rMeetsFloor && !lMeetsFloor) return 1;
        const scoreLeft = (left.weightedScore ?? 0) / (Math.max(left.avgCostUsd ?? 0.0001, 0.0001) * Math.max(left.avgLatencyMs ?? 1, 1));
        const scoreRight = (right.weightedScore ?? 0) / (Math.max(right.avgCostUsd ?? 0.0001, 0.0001) * Math.max(right.avgLatencyMs ?? 1, 1));
        return scoreRight - scoreLeft;
      }),
      // FASTEST mirrors getRankedToolsForCapability('most_stable'): highest successRate
      // first with a quality floor of 2.5 — NOT sorted by raw latency.
      FASTEST: [...products].sort((left, right) => {
        const lq = left.weightedScore ?? 0;
        const rq = right.weightedScore ?? 0;
        if (lq < STABLE_QUALITY_FLOOR && rq >= STABLE_QUALITY_FLOOR) return 1;
        if (rq < STABLE_QUALITY_FLOOR && lq >= STABLE_QUALITY_FLOOR) return -1;
        return (right.successRate ?? 0) - (left.successRate ?? 0);
      }),
      CHEAPEST: [...products].sort((left, right) => {
        const lq = left.weightedScore ?? 0;
        const rq = right.weightedScore ?? 0;
        if (lq < QUALITY_FLOOR && rq >= QUALITY_FLOOR) return 1;
        if (rq < QUALITY_FLOOR && lq >= QUALITY_FLOOR) return -1;
        return (left.avgCostUsd ?? 9999) - (right.avgCostUsd ?? 9999);
      }),
      MOST_ACCURATE: [...products].sort((left, right) => (right.avgBenchmarkRelevance ?? 0) - (left.avgBenchmarkRelevance ?? 0)),
    };

    const result: Record<
      string,
      {
        top_pick: string;
        top_3: Array<{ slug: string; name: string; score?: number; latency?: number; cost?: number; relevance?: number; successRate?: number }>;
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
          successRate: product.successRate ?? undefined,
        })),
      };
    }

    return Response.json({
      capability,
      strategies: result,
      recommendation: 'Use BALANCED for general use. Switch to FASTEST for uptime, CHEAPEST for batch jobs, MOST_ACCURATE for research.',
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'Vary': 'Authorization',
      },
    });
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] GET /api/v1/router/compare-strategies error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
