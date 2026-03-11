import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import type { Category } from '@/generated/prisma/client';

const CACHE_TTL = 120; // 2 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category') as Category | null;
  const sort = searchParams.get('sort') ?? 'score';
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0'));
  const search = searchParams.get('search');

  // Skip cache for search queries
  if (!search) {
    const cacheKey = `products:${category ?? 'all'}:${sort}:${offset}:${limit}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return Response.json(cached, {
          headers: { 'X-Cache': 'HIT' },
        });
      }
    } catch {
      // Redis down — fall through to DB
    }

    const where: Record<string, unknown> = { status: 'APPROVED' as const };
    if (category && ['api', 'mcp', 'skill', 'data', 'infra'].includes(category)) {
      where.category = category;
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

    const result = { products, total, limit, offset };

    try {
      await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TTL });
    } catch {
      // Redis down — continue without cache
    }

    return Response.json(result, {
      headers: { 'X-Cache': 'MISS' },
    });
  }

  // Search queries — no cache
  const where: Record<string, unknown> = { status: 'APPROVED' as const };
  if (category && ['api', 'mcp', 'skill', 'data', 'infra'].includes(category)) {
    where.category = category;
  }
  where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { tagline: { contains: search, mode: 'insensitive' } },
  ];

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
