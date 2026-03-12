import { prisma } from '@/lib/prisma';
import { RANKING_STATUSES } from '@/lib/product-status';
import type { Category } from '@/generated/prisma/client';

const ACTIVE_CATEGORIES = [
  'search_research', 'web_crawling', 'code_compute', 'storage_memory',
  'communication', 'payments_commerce', 'finance_data', 'auth_identity',
  'scheduling', 'ai_models', 'observability',
];

export async function GET() {
  try {
    const perCategory = await Promise.all(
      ACTIVE_CATEGORIES.map(async (cat) => {
        const products = await prisma.product.findMany({
          where: {
            category: cat as Category,
            status: { in: RANKING_STATUSES },
          },
          orderBy: [{ weightedScore: 'desc' }, { totalVotes: 'desc' }],
          select: { id: true, name: true, category: true, status: true },
        });
        return { category: cat, count: products.length, names: products.map(p => p.name) };
      }),
    );

    const total = perCategory.reduce((s, c) => s + c.count, 0);

    return Response.json({ total, perCategory, rankingStatuses: RANKING_STATUSES });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
