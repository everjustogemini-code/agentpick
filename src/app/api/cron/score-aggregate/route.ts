import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { calculateScoreBreakdown } from '@/lib/score';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { status: 'APPROVED' },
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

    // Sandbox stats
    const sandboxRuns = await prisma.playgroundRun.findMany({
      where: { productId: product.id, relevanceScore: { not: null } },
      select: { relevanceScore: true },
    });
    const sandboxSessionCount = await prisma.playgroundRun.count({
      where: { productId: product.id },
    });
    const avgSandboxScore = sandboxRuns.length > 0
      ? sandboxRuns.reduce((s, r) => s + (r.relevanceScore ?? 0), 0) / sandboxRuns.length
      : null;

    const breakdown = calculateScoreBreakdown({
      avgBenchmarkRelevance,
      avgSandboxScore,
      benchmarkCount,
      sandboxSessionCount,
      telemetryCount: product.telemetryCount,
      successRate: product.successRate,
      avgLatencyMs: product.avgLatencyMs,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        avgBenchmarkRelevance,
        avgSandboxScore,
        benchmarkCount,
        sandboxSessionCount,
        scoreBreakdown: {
          benchmarkWeight: breakdown.benchmarkWeight,
          sandboxWeight: breakdown.sandboxWeight,
          usageWeight: breakdown.usageWeight,
          benchmarkScore: breakdown.benchmarkScore,
          sandboxScore: breakdown.sandboxScore,
          usageScore: breakdown.usageScore,
          blendedScore: breakdown.blendedScore,
        } as unknown as Prisma.InputJsonValue,
        weightedScore: breakdown.blendedScore,
      },
    });

    updated++;
  }

  return NextResponse.json({ status: 'ok', updated });
}
