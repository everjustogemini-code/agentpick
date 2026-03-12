import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

/**
 * R5v2 Trust Level Auto-Progression Cron
 *
 * Runs every 30 minutes. Checks products and auto-promotes:
 *   SUBMITTED/PENDING → SMOKE_TESTED: if website endpoint responds 2xx
 *   SMOKE_TESTED/APPROVED → BENCHMARKED: when benchmark count >= 30
 *   BENCHMARKED → LIVE_TELEMETRY: when external telemetry count > 100
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const promoted: { slug: string; from: string; to: string }[] = [];

  // 1. SUBMITTED/PENDING → SMOKE_TESTED (if endpoint responds 2xx)
  const unverified = await prisma.product.findMany({
    where: { status: { in: ['SUBMITTED', 'PENDING'] } },
    select: { id: true, slug: true, status: true, websiteUrl: true, apiBaseUrl: true },
  });

  for (const product of unverified) {
    const urlToCheck = product.apiBaseUrl || product.websiteUrl;
    if (!urlToCheck) continue;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(urlToCheck, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      if (resp.ok || resp.status === 405) {
        await prisma.product.update({
          where: { id: product.id },
          data: { status: 'SMOKE_TESTED' },
        });
        promoted.push({ slug: product.slug, from: product.status, to: 'SMOKE_TESTED' });
      }
    } catch {
      // URL not reachable — leave as-is
    }
  }

  // 2. SMOKE_TESTED/APPROVED → BENCHMARKED (when benchmarkCount >= 30)
  const tested = await prisma.product.findMany({
    where: { status: { in: ['SMOKE_TESTED', 'APPROVED'] } },
    select: { id: true, slug: true, status: true },
  });

  for (const product of tested) {
    const benchmarkCount = await prisma.benchmarkRun.count({
      where: { productId: product.id },
    });

    if (benchmarkCount >= 30) {
      await prisma.product.update({
        where: { id: product.id },
        data: { status: 'BENCHMARKED', benchmarkCount },
      });
      promoted.push({ slug: product.slug, from: product.status, to: 'BENCHMARKED' });
    }
  }

  // 3. BENCHMARKED → LIVE_TELEMETRY (when telemetryCount > 100)
  const benchmarked = await prisma.product.findMany({
    where: { status: 'BENCHMARKED' },
    select: { id: true, slug: true, telemetryCount: true },
  });

  for (const product of benchmarked) {
    if (product.telemetryCount > 100) {
      await prisma.product.update({
        where: { id: product.id },
        data: { status: 'LIVE_TELEMETRY' },
      });
      promoted.push({ slug: product.slug, from: 'BENCHMARKED', to: 'LIVE_TELEMETRY' });
    }
  }

  return NextResponse.json({
    status: 'ok',
    promoted: promoted.length,
    details: promoted,
  });
}
