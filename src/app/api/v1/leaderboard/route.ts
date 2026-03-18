import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { leaderboardLimiter, checkRateLimit } from '@/lib/rate-limit';

// 5-minute in-memory cache
interface CacheEntry {
  data: LeaderboardResponse;
  expiresAt: number;
}

interface LeaderboardTool {
  rank: number;
  slug: string;
  name: string;
  score: number;
  latency_p50_ms: number;
  success_rate: number;
  best_for: string[];
  domains: string[];
}

interface LeaderboardResponse {
  updated_at: string;
  tools: LeaderboardTool[];
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCacheKey(domain?: string, task?: string, limit?: number) {
  return `${domain ?? ''}:${task ?? ''}:${limit ?? 10}`;
}

async function fetchLeaderboardData(
  domain?: string,
  task?: string,
  limit = 10
): Promise<LeaderboardResponse> {
  // Clamp limit to 1-50
  const clampedLimit = Math.min(Math.max(limit, 1), 50);

  // Query approved products with benchmark data
  const products = await prisma.product.findMany({
    where: {
      status: 'APPROVED',
      benchmarkCount: { gt: 0 },
    },
    select: {
      slug: true,
      name: true,
      weightedScore: true,
      avgLatencyMs: true,
      successRate: true,
      tags: true,
      benchmarkRuns: {
        select: {
          domain: true,
          complexity: true,
          latencyMs: true,
          success: true,
          relevanceScore: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      },
    },
  });

  // Compute per-product stats from benchmark runs
  type ToolData = {
    slug: string;
    name: string;
    score: number;
    latency_p50_ms: number;
    success_rate: number;
    best_for: string[];
    domains: string[];
  };

  const toolDataList: ToolData[] = [];

  for (const product of products) {
    const runs = product.benchmarkRuns;
    if (runs.length === 0) continue;

    // Collect domains from runs
    const domainSet = new Set(runs.map((r) => r.domain));
    const productDomains = Array.from(domainSet);

    // Apply domain filter
    if (domain && !domainSet.has(domain)) continue;

    // Apply task filter (using complexity as proxy for task type)
    // task param: research|realtime|simple maps to complexity: complex|medium|simple
    if (task) {
      const taskToComplexity: Record<string, string> = {
        research: 'complex',
        realtime: 'medium',
        simple: 'simple',
      };
      const complexityFilter = taskToComplexity[task];
      if (complexityFilter) {
        const hasMatchingRun = runs.some((r) => r.complexity === complexityFilter);
        if (!hasMatchingRun) continue;
      }
    }

    // Compute p50 latency
    const latencies = runs.map((r) => r.latencyMs).sort((a, b) => a - b);
    const p50Index = Math.floor(latencies.length * 0.5);
    const latency_p50_ms = latencies[p50Index] ?? product.avgLatencyMs ?? 0;

    // Compute success rate
    const successCount = runs.filter((r) => r.success).length;
    const success_rate = runs.length > 0 ? successCount / runs.length : 0;

    // Compute best_for: top task types by avg relevance score per complexity
    const complexityScores: Record<string, { total: number; count: number }> = {};
    for (const run of runs) {
      if (run.relevanceScore !== null && run.relevanceScore !== undefined) {
        if (!complexityScores[run.complexity]) {
          complexityScores[run.complexity] = { total: 0, count: 0 };
        }
        complexityScores[run.complexity].total += run.relevanceScore;
        complexityScores[run.complexity].count += 1;
      }
    }

    const complexityToTask: Record<string, string> = {
      complex: 'research',
      medium: 'realtime',
      simple: 'simple',
    };

    const sortedComplexities = Object.entries(complexityScores)
      .map(([complexity, s]) => ({ complexity, avg: s.total / s.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)
      .map((c) => complexityToTask[c.complexity] ?? c.complexity);

    const best_for = sortedComplexities.length > 0 ? sortedComplexities : ['general'];

    toolDataList.push({
      slug: product.slug,
      name: product.name,
      score: product.weightedScore,
      latency_p50_ms,
      success_rate,
      best_for,
      domains: productDomains,
    });
  }

  // Sort by score descending and assign ranks
  toolDataList.sort((a, b) => b.score - a.score);

  const tools: LeaderboardTool[] = toolDataList
    .slice(0, clampedLimit)
    .map((t, idx) => ({ rank: idx + 1, ...t }));

  // Find the most recent benchmark run timestamp
  const latestRun = await prisma.benchmarkRun.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  return {
    updated_at: (latestRun?.createdAt ?? new Date()).toISOString(),
    tools,
  };
}

export async function GET(request: NextRequest) {
  // Rate limit by IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  const { limited, retryAfter } = await checkRateLimit(leaderboardLimiter, ip);
  if (limited) {
    return NextResponse.json(
      { error: 'rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter ?? 60),
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain') ?? undefined;
  const task = searchParams.get('task') ?? undefined;
  const limitParam = parseInt(searchParams.get('limit') ?? '10', 10);
  const limit = isNaN(limitParam) ? 10 : limitParam;

  const cacheKey = getCacheKey(domain, task, limit);
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    const data = await fetchLeaderboardData(domain, task, limit);
    cache.set(cacheKey, { data, expiresAt: now + CACHE_TTL_MS });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS',
      },
    });
  } catch (err) {
    console.error('[leaderboard] error:', err);
    return NextResponse.json(
      { error: 'internal server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
