import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Category } from '@/generated/prisma/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category') as Category | null;
  const sort = searchParams.get('sort') ?? 'score';
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0'));
  const search = searchParams.get('search');

  const where: Record<string, unknown> = { status: 'APPROVED' as const };
  if (category && ['api', 'mcp', 'skill', 'data', 'infra'].includes(category)) {
    where.category = category;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { tagline: { contains: search, mode: 'insensitive' } },
    ];
  }

  let orderBy: Record<string, string>;
  switch (sort) {
    case 'votes':
      orderBy = { totalVotes: 'desc' };
      break;
    case 'newest':
      orderBy = { approvedAt: 'desc' };
      break;
    default:
      orderBy = { weightedScore: 'desc' };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        category: true,
        logoUrl: true,
        tags: true,
        totalVotes: true,
        weightedScore: true,
        uniqueAgents: true,
        featuredAt: true,
        approvedAt: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return Response.json({ products, total, limit, offset });
}
