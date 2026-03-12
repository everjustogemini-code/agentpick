import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { RANKING_STATUSES } from '@/lib/product-status';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const capability = await prisma.capability.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            product: {
              select: {
                slug: true,
                name: true,
                tagline: true,
                category: true,
                status: true,
                weightedScore: true,
                totalVotes: true,
                successRate: true,
                avgLatencyMs: true,
                telemetryCount: true,
              },
            },
          },
          orderBy: { strength: 'desc' },
        },
      },
    });

    if (!capability) {
      return Response.json({ error: `Capability "${slug}" not found` }, { status: 404 });
    }

    // Filter to ranking-eligible products and format
    const products = capability.products
      .filter((pc) => RANKING_STATUSES.includes(pc.product.status as any))
      .map((pc) => ({
        slug: pc.product.slug,
        name: pc.product.name,
        tagline: pc.product.tagline,
        category: pc.product.category,
        strength: pc.strength,
        notes: pc.notes,
        score: pc.product.weightedScore,
        votes: pc.product.totalVotes,
        success_rate: pc.product.successRate,
        avg_latency_ms: pc.product.avgLatencyMs,
        telemetry_calls: pc.product.telemetryCount,
      }));

    return Response.json({
      slug: capability.slug,
      name: capability.name,
      description: capability.description,
      category: capability.capCategory,
      icon: capability.icon,
      products,
      total_products: products.length,
    }, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch (error) {
    console.error('Capability detail error:', error);
    return Response.json({ error: 'Failed to fetch capability' }, { status: 500 });
  }
}
