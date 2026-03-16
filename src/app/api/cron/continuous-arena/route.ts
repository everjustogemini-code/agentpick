import { prisma, withRetry } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { callToolAPI, BENCHMARKABLE_SLUGS } from '@/lib/benchmark/adapters';
import { RANKING_STATUSES } from '@/lib/product-status';

export const maxDuration = 120;

// Rotating query set for continuous monitoring
const MONITOR_QUERIES = [
  'latest AI research papers 2026',
  'SEC filings for NVDA',
  'best restaurants in San Francisco',
  'how to implement OAuth 2.0',
  'climate change impact on agriculture',
  'machine learning model deployment best practices',
  'cryptocurrency market analysis',
  'remote work productivity tools comparison',
];

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get top 5 benchmarkable products per category
  const categories = await withRetry(() => prisma.product.groupBy({
    by: ['category'],
    where: {
      status: { in: RANKING_STATUSES },
      slug: { in: BENCHMARKABLE_SLUGS },
    },
  }));

  const results: Array<{
    slug: string;
    category: string;
    latencyMs: number;
    success: boolean;
    statusCode: number;
  }> = [];

  // Pick a random query
  const query = MONITOR_QUERIES[Math.floor(Math.random() * MONITOR_QUERIES.length)];

  for (const { category } of categories) {
    const products = await withRetry(() => prisma.product.findMany({
      where: {
        status: { in: RANKING_STATUSES },
        category,
        slug: { in: BENCHMARKABLE_SLUGS },
      },
      orderBy: { weightedScore: 'desc' },
      take: 5,
      select: { id: true, slug: true },
    }));

    for (const product of products) {
      try {
        const result = await callToolAPI(product.slug, query);

        // Store as telemetry
        const playgroundAgent = await withRetry(() => prisma.agent.findFirst({
          where: { name: 'playground-agent' },
          select: { id: true },
        }));

        if (playgroundAgent) {
          await withRetry(() => prisma.telemetryEvent.create({
            data: {
              agentId: playgroundAgent.id,
              productId: product.id,
              tool: product.slug,
              task: 'continuous-monitor',
              success: result.statusCode >= 200 && result.statusCode < 300,
              statusCode: result.statusCode,
              latencyMs: result.latencyMs,
              costUsd: result.costUsd,
              context: 'continuous-arena',
            },
          }));
        }

        results.push({
          slug: product.slug,
          category,
          latencyMs: result.latencyMs,
          success: result.statusCode >= 200 && result.statusCode < 300,
          statusCode: result.statusCode,
        });
      } catch {
        results.push({
          slug: product.slug,
          category,
          latencyMs: 0,
          success: false,
          statusCode: 0,
        });
      }
    }
  }

  return NextResponse.json({
    monitored: results.length,
    query,
    results,
    timestamp: new Date().toISOString(),
  });
}
