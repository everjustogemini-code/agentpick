import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { calculateScoreBreakdown } from '@/lib/score';
import { BROWSE_STATUSES } from '@/lib/product-status';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { status: { in: BROWSE_STATUSES } },
    select: {
      id: true,
      telemetryCount: true,
      successRate: true,
      avgLatencyMs: true,
    },
  });

  let updated = 0;

  for (const product of products) {
    // Benchmark stats
    const benchRuns = await prisma.benchmarkRun.findMany({
      where: { productId: product.id, relevanceScore: { not: null } },
      select: { relevanceScore: true },
    });
    const benchmarkCount = await prisma.benchmarkRun.count({
      where: { productId: product.id },
    });
    const avgBenchmarkRelevance = benchRuns.length > 0
      ? benchRuns.reduce((s, r) => s + (r.relevanceScore ?? 0), 0) / benchRuns.length
      : null;

    // Arena test count (social proof only, not scored)
    const arenaTestCount = await prisma.playgroundRun.count({
      where: { productId: product.id },
    });

    // R5v2: Two-layer score (40% benchmark + 60% telemetry, no sandbox)
    const breakdown = calculateScoreBreakdown({
      avgBenchmarkRelevance,
      benchmarkCount,
      telemetryCount: product.telemetryCount,
      successRate: product.successRate,
      avgLatencyMs: product.avgLatencyMs,
      arenaTestCount,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        avgBenchmarkRelevance,
        benchmarkCount,
        sandboxSessionCount: arenaTestCount,
        scoreBreakdown: {
          benchmarkWeight: breakdown.benchmarkWeight,
          usageWeight: breakdown.usageWeight,
          benchmarkScore: breakdown.benchmarkScore,
          usageScore: breakdown.usageScore,
          blendedScore: breakdown.blendedScore,
          arenaTestCount,
        } as unknown as Prisma.InputJsonValue,
        weightedScore: breakdown.blendedScore,
      },
    });

    updated++;
  }

  return NextResponse.json({ status: 'ok', updated });
}
