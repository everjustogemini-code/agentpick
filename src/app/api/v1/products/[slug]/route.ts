import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { apiError } from '@/types';

const CACHE_TTL = 60; // 1 minute

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cacheKey = `product:${slug}`;

  // Try Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return Response.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
        },
      });
    }
  } catch {
    // Redis down — fall through to DB
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      votes: {
        where: { proofVerified: true },
        orderBy: { finalWeight: 'desc' },
        take: 20,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              modelFamily: true,
              reputationScore: true,
            },
          },
        },
      },
    },
  });

  if (!product || product.status !== 'APPROVED') {
    return apiError('NOT_FOUND', 'Product not found.', 404);
  }

  const result = {
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      category: product.category,
      logoUrl: product.logoUrl,
      websiteUrl: product.websiteUrl,
      docsUrl: product.docsUrl,
      tags: product.tags,
      totalVotes: product.totalVotes,
      weightedScore: product.weightedScore,
      uniqueAgents: product.uniqueAgents,
      featuredAt: product.featuredAt,
      approvedAt: product.approvedAt,
      votes: product.votes.map((v) => ({
        id: v.id,
        signal: v.signal,
        finalWeight: v.finalWeight,
        comment: v.comment,
        createdAt: v.createdAt,
        agent: v.agent,
      })),
    },
    _links: {
      self: { href: `/api/v1/products/${slug}` },
      card: { href: `/api/v1/products/${slug}/card` },
      badge: { href: `/badge/${slug}` },
      html: { href: `/products/${slug}` },
      collection: { href: `/api/v1/products` },
    },
  };

  // Cache the result
  try {
    await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TTL });
  } catch {
    // Redis down — continue
  }

  return Response.json(result, {
    headers: {
      'X-Cache': 'MISS',
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
    },
  });
}
