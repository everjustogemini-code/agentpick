import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import type { Category } from '@/generated/prisma/client';

const CACHE_TTL = 120; // 2 minutes
const VALID_CATEGORIES = ['search_research', 'web_crawling', 'code_compute', 'storage_memory', 'communication', 'payments_commerce', 'finance_data', 'auth_identity', 'scheduling', 'ai_models', 'observability'];

const SELECT_FIELDS = {
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
} as const;

function getOrderBy(sort: string): Record<string, string>[] {
  switch (sort) {
    case 'votes':
      return [{ totalVotes: 'desc' }, { weightedScore: 'desc' }];
    case 'newest':
      return [{ approvedAt: 'desc' }];
    default:
      return [{ weightedScore: 'desc' }, { totalVotes: 'desc' }];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category') as Category | null;
  const sort = searchParams.get('sort') ?? 'score';
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0'));
  const search = searchParams.get('search');

  const where: Record<string, unknown> = { status: 'APPROVED' as const };
  if (category && VALID_CATEGORIES.includes(category)) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { tagline: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy = getOrderBy(sort);

  // Try cache for non-search queries
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

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        select: SELECT_FIELDS,
      }),
      prisma.product.count({ where }),
    ]);

    const _links: Record<string, { href: string }> = {
      self: { href: `/api/v1/products?limit=${limit}&offset=${offset}&sort=${sort}${category ? `&category=${category}` : ''}` },
    };
    if (offset + limit < total) {
      _links.next = { href: `/api/v1/products?limit=${limit}&offset=${offset + limit}&sort=${sort}${category ? `&category=${category}` : ''}` };
    }
    if (offset > 0) {
      _links.prev = { href: `/api/v1/products?limit=${limit}&offset=${Math.max(0, offset - limit)}&sort=${sort}${category ? `&category=${category}` : ''}` };
    }

    const result = { products, total, limit, offset, _links };

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
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: SELECT_FIELDS,
    }),
    prisma.product.count({ where }),
  ]);

  const _links: Record<string, { href: string }> = {
    self: { href: `/api/v1/products?limit=${limit}&offset=${offset}&sort=${sort}${category ? `&category=${category}` : ''}&search=${encodeURIComponent(search)}` },
  };
  if (offset + limit < total) {
    _links.next = { href: `/api/v1/products?limit=${limit}&offset=${offset + limit}&sort=${sort}${category ? `&category=${category}` : ''}&search=${encodeURIComponent(search)}` };
  }
  if (offset > 0) {
    _links.prev = { href: `/api/v1/products?limit=${limit}&offset=${Math.max(0, offset - limit)}&sort=${sort}${category ? `&category=${category}` : ''}&search=${encodeURIComponent(search)}` };
  }

  return Response.json({ products, total, limit, offset, _links });
}
