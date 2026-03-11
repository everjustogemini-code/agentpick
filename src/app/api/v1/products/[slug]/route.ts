import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

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

  return Response.json({
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
  });
}
