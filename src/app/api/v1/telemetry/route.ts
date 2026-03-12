import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAgent } from '@/lib/auth';
import { checkRateLimit, telemetryLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';
import { BROWSE_STATUSES } from '@/lib/product-status';
import type { TelemetryRequest } from '@/types';

function validateEvent(body: TelemetryRequest): string | null {
  if (!body.tool || typeof body.tool !== 'string') return 'tool is required (string)';
  if (!body.task || typeof body.task !== 'string') return 'task is required (string)';
  if (typeof body.success !== 'boolean') return 'success is required (boolean)';
  if (body.status_code !== undefined && (!Number.isInteger(body.status_code) || body.status_code < 0))
    return 'status_code must be a positive integer';
  if (body.latency_ms !== undefined && (!Number.isInteger(body.latency_ms) || body.latency_ms <= 0 || body.latency_ms >= 300000))
    return 'latency_ms must be an integer > 0 and < 300000';
  if (body.cost_usd !== undefined && (typeof body.cost_usd !== 'number' || body.cost_usd < 0))
    return 'cost_usd must be a number >= 0';
  return null;
}

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const agent = await authenticateAgent(request);
  if (!agent) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  // 2. Rate limit
  const { limited, retryAfter } = await checkRateLimit(telemetryLimiter, agent.id);
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many telemetry events. Slow down.', 429, { retry_after: retryAfter });
  }

  // 3. Parse body
  let body: TelemetryRequest;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  const validationError = validateEvent(body);
  if (validationError) {
    return apiError('VALIDATION_ERROR', validationError, 400);
  }

  // 4. Resolve tool slug to product
  const product = await prisma.product.findUnique({
    where: { slug: body.tool },
    select: { id: true, slug: true, weightedScore: true, category: true, telemetryCount: true },
  });

  // 5. Determine if this is a benchmark contribution
  const hasQuery = typeof (body as any).query === 'string' && (body as any).query.length > 0;
  const hasResultCount = typeof (body as any).result_count === 'number';
  const isBenchmarkContribution = hasQuery && hasResultCount && body.latency_ms != null && typeof body.success === 'boolean';

  // Dedup: same agent + tool + query within 24h → not a new contribution
  let isDuplicate = false;
  if (isBenchmarkContribution && product) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.telemetryEvent.findFirst({
      where: {
        agentId: agent.id,
        tool: body.tool,
        query: (body as any).query,
        createdAt: { gte: twentyFourHoursAgo },
      },
      select: { id: true },
    });
    isDuplicate = !!existing;
  }

  // 5b. Create telemetry event
  const isActualBenchmark = isBenchmarkContribution && !isDuplicate;
  const event = await prisma.telemetryEvent.create({
    data: {
      agentId: agent.id,
      productId: product?.id ?? null,
      tool: body.tool,
      task: body.task,
      success: body.success,
      statusCode: body.status_code ?? null,
      latencyMs: body.latency_ms ?? null,
      costUsd: body.cost_usd ?? null,
      context: body.context ?? null,
      query: hasQuery ? (body as any).query : null,
      resultCount: hasResultCount ? (body as any).result_count : null,
      source: isActualBenchmark ? 'benchmark' : 'community',
      isBenchmarkContribution: isActualBenchmark,
    },
  });

  // 6. Increment product telemetry count (aggregation cron handles averages)
  if (product) {
    await prisma.product.update({
      where: { id: product.id },
      data: { telemetryCount: { increment: 1 } },
    });
  }

  // 7. Compute agent stats for response
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [todayStats, allTimeCount, topTool] = await Promise.all([
    prisma.telemetryEvent.aggregate({
      where: { agentId: agent.id, createdAt: { gte: startOfDay } },
      _count: true,
      _avg: { costUsd: true },
      _sum: { costUsd: true },
    }),
    prisma.telemetryEvent.count({ where: { agentId: agent.id } }),
    prisma.telemetryEvent.groupBy({
      by: ['tool'],
      where: { agentId: agent.id },
      _count: true,
      orderBy: { _count: { tool: 'desc' } },
      take: 1,
    }),
  ]);

  const todaySuccessCount = await prisma.telemetryEvent.count({
    where: { agentId: agent.id, createdAt: { gte: startOfDay }, success: true },
  });

  const todayToolsCount = await prisma.telemetryEvent.groupBy({
    by: ['tool'],
    where: { agentId: agent.id, createdAt: { gte: startOfDay } },
  });

  // 8. Build tool stats if product exists
  let toolStats = null;
  if (product) {
    const [rank, categoryRank, productTelemetry] = await Promise.all([
      prisma.product.count({
        where: { status: { in: BROWSE_STATUSES }, weightedScore: { gt: product.weightedScore } },
      }),
      prisma.product.count({
        where: { status: { in: BROWSE_STATUSES }, category: product.category, weightedScore: { gt: product.weightedScore } },
      }),
      prisma.telemetryEvent.aggregate({
        where: { productId: product.id },
        _avg: { latencyMs: true },
        _count: true,
      }),
    ]);

    const successCount = await prisma.telemetryEvent.count({
      where: { productId: product.id, success: true },
    });

    toolStats = {
      agent_score: Math.round(product.weightedScore * 10) / 10,
      rank: rank + 1,
      category_rank: categoryRank + 1,
      success_rate: productTelemetry._count > 0
        ? Math.round((successCount / productTelemetry._count) * 100) / 100
        : null,
      avg_latency_ms: productTelemetry._avg.latencyMs
        ? Math.round(productTelemetry._avg.latencyMs)
        : null,
    };
  }

  // 9. Check milestones and apply reputation boost
  let milestone: string | null = null;
  const MILESTONES: Record<number, string> = {
    10: '10 traces submitted — benchmark history unlocked for tools you\'ve tested',
    50: '50 traces — personalized recommendations now available',
    100: '100 traces — reputation upgraded, vote weight doubled',
  };

  for (const [threshold, msg] of Object.entries(MILESTONES)) {
    const t = Number(threshold);
    // Fire milestone when crossing the threshold
    if (allTimeCount >= t && allTimeCount - 1 < t) {
      milestone = msg;
      break;
    }
  }

  // At 100 traces, boost agent reputation
  if (allTimeCount >= 100 && allTimeCount - 1 < 100) {
    try {
      const currentAgent = await prisma.agent.findUnique({
        where: { id: agent.id },
        select: { reputationScore: true },
      });
      if (currentAgent && currentAgent.reputationScore < 0.5) {
        await prisma.agent.update({
          where: { id: agent.id },
          data: { reputationScore: Math.max(currentAgent.reputationScore * 2, 0.5) },
        });
      }
    } catch {
      // Non-critical — don't fail telemetry for reputation update errors
    }
  }

  const response: Record<string, unknown> = {
    recorded: true,
    event_id: event.id,
    tool_stats: toolStats,
    your_agent_stats: {
      total_calls_today: todayStats._count,
      total_calls_all_time: allTimeCount,
      top_tool: topTool[0]?.tool ?? null,
      tools_used_today: todayToolsCount.length,
      estimated_daily_cost_usd: todayStats._sum.costUsd
        ? Math.round(todayStats._sum.costUsd * 1000) / 1000
        : 0,
      success_rate_today: todayStats._count > 0
        ? Math.round((todaySuccessCount / todayStats._count) * 100) / 100
        : null,
    },
  };

  if (milestone) {
    response.milestone = milestone;
  }

  return Response.json(response);
}
