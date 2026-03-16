import { prisma, withRetry } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { calculateScoreBreakdown } from '@/lib/score';
import { BROWSE_STATUSES } from '@/lib/product-status';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

async function getSourceStats(productId: string, source: string) {
  const events = await withRetry(() => prisma.telemetryEvent.aggregate({
    where: { productId, source },
    _count: true,
    _avg: { latencyMs: true },
  }));
  const successCount = await withRetry(() => prisma.telemetryEvent.count({
    where: { productId, source, success: true },
  }));
  const count = events._count;
  return {
    count,
    successRate: count > 0 ? Math.round((successCount / count) * 100) : null,
    avgLatencyMs: events._avg.latencyMs ? Math.round(events._avg.latencyMs) : null,
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const products = await withRetry(() => prisma.product.findMany({
    where: { status: { in: BROWSE_STATUSES } },
    select: {
      id: true,
      telemetryCount: true,
      successRate: true,
      avgLatencyMs: true,
      weightedScore: true,
      totalVotes: true,
    },
  }));

  let updated = 0;

  for (const product of products) {
    // Benchmark stats
    const benchRuns = await withRetry(() => prisma.benchmarkRun.findMany({
      where: { productId: product.id, relevanceScore: { not: null } },
      select: { relevanceScore: true },
    }));
    const benchmarkCount = await withRetry(() => prisma.benchmarkRun.count({
      where: { productId: product.id },
    }));
    const avgBenchmarkRelevance = benchRuns.length > 0
      ? benchRuns.reduce((s, r) => s + (r.relevanceScore ?? 0), 0) / benchRuns.length
      : null;

    // Arena test count (social proof only)
    const arenaTestCount = await withRetry(() => prisma.playgroundRun.count({
      where: { productId: product.id },
    }));

    // Per-source telemetry stats
    const [routerStats, communityStats] = await Promise.all([
      getSourceStats(product.id, 'router'),
      getSourceStats(product.id, 'community'),
    ]);

    // Vote score (linear: 100 weighted votes = score of 5)
    const voteScore = Math.min(5, Math.max(0, (product.weightedScore / 10) * 5));

    // R6: Four-source score
    const breakdown = calculateScoreBreakdown({
      avgBenchmarkRelevance,
      benchmarkCount,
      telemetryCount: product.telemetryCount,
      successRate: product.successRate,
      avgLatencyMs: product.avgLatencyMs,
      arenaTestCount,
      routerCount: routerStats.count,
      routerSuccessRate: routerStats.successRate,
      routerAvgLatencyMs: routerStats.avgLatencyMs,
      communityCount: communityStats.count,
      communitySuccessRate: communityStats.successRate,
      communityAvgLatencyMs: communityStats.avgLatencyMs,
      voteScore,
      voteCount: product.totalVotes,
    });

    await withRetry(() => prisma.product.update({
      where: { id: product.id },
      data: {
        avgBenchmarkRelevance,
        benchmarkCount,
        sandboxSessionCount: arenaTestCount,
        scoreBreakdown: {
          routerScore: breakdown.routerScore,
          benchmarkScore: breakdown.benchmarkScore,
          communityScore: breakdown.communityScore,
          voteScore: breakdown.voteScore,
          routerWeight: breakdown.routerWeight,
          benchmarkWeight: breakdown.benchmarkWeight,
          communityWeight: breakdown.communityWeight,
          voteWeight: breakdown.voteWeight,
          routerCount: breakdown.routerCount,
          benchmarkCount: breakdown.benchmarkCount,
          communityCount: breakdown.communityCount,
          voteCount: breakdown.voteCount,
          arenaTestCount,
        } as unknown as Prisma.InputJsonValue,
        weightedScore: breakdown.blendedScore,
      },
    }));

    updated++;
  }

  return NextResponse.json({ status: 'ok', updated });
}
