import { prisma, withRetry } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const capabilities = await withRetry(() => prisma.capability.findMany({
      orderBy: [{ capCategory: 'asc' }, { sortOrder: 'asc' }],
      select: {
        slug: true,
        name: true,
        description: true,
        capCategory: true,
        icon: true,
        _count: { select: { products: true } },
      },
    }));

    // Group by capCategory
    const grouped: Record<string, Array<{
      slug: string;
      name: string;
      description: string;
      icon: string | null;
      product_count: number;
    }>> = {};

    for (const cap of capabilities) {
      if (!grouped[cap.capCategory]) grouped[cap.capCategory] = [];
      grouped[cap.capCategory].push({
        slug: cap.slug,
        name: cap.name,
        description: cap.description,
        icon: cap.icon,
        product_count: cap._count.products,
      });
    }

    return Response.json({
      total: capabilities.length,
      categories: grouped,
    }, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch (error) {
    console.error('Capabilities error:', error);
    return Response.json({ error: 'Failed to fetch capabilities' }, { status: 500 });
  }
}
