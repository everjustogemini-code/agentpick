import { prisma } from '@/lib/prisma';
import { calculateBlendedScore } from '@/lib/voting';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Get all approved products
  const products = await prisma.product.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, weightedScore: true },
  });

  let updated = 0;

  for (const product of products) {
    // Aggregate telemetry stats
    const stats = await prisma.telemetryEvent.aggregate({
      where: { productId: product.id },
      _count: true,
      _avg: { latencyMs: true, costUsd: true },
    });

    if (stats._count === 0) continue;

    const successCount = await prisma.telemetryEvent.count({
      where: { productId: product.id, success: true },
    });

    const telemetryCount = stats._count;
    const successRate = Math.round((successCount / telemetryCount) * 10000) / 10000;
    const avgLatencyMs = stats._avg.latencyMs ? Math.round(stats._avg.latencyMs) : null;
    const avgCostUsd = stats._avg.costUsd ? Math.round(stats._avg.costUsd * 10000) / 10000 : null;

    // Calculate blended score
    const blended = calculateBlendedScore({
      weightedScore: product.weightedScore,
      telemetryCount,
      successRate,
      avgLatencyMs,
      avgCostUsd,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        telemetryCount,
        successRate,
        avgLatencyMs,
        avgCostUsd,
        // Update weightedScore to blended score
        weightedScore: Math.round(blended * 100) / 100,
      },
    });

    updated++;
  }

  return Response.json({
    success: true,
    products_updated: updated,
    total_products: products.length,
  });
}
