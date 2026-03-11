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
        take: 50,
        include: {
          agent: {
            select: {
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

  // Calculate rank (overall + in category)
  const [overallRank, categoryRank] = await Promise.all([
    prisma.product.count({
      where: {
        status: 'APPROVED',
        weightedScore: { gt: product.weightedScore },
      },
    }),
    prisma.product.count({
      where: {
        status: 'APPROVED',
        category: product.category,
        weightedScore: { gt: product.weightedScore },
      },
    }),
  ]);

  const upvotes = product.votes.filter((v) => v.signal === 'UPVOTE').length;
  const totalVotesInSet = product.votes.length;
  const upvoteRatio = totalVotesInSet > 0 ? upvotes / totalVotesInSet : 0;

  // Extract top agent voters
  const topAgents = product.votes
    .filter((v) => v.signal === 'UPVOTE')
    .slice(0, 5)
    .map((v) => v.agent.name);

  // Build agent consensus summary
  const pctPositive = Math.round(upvoteRatio * 100);
  const consensus = `${pctPositive}% positive from ${product.totalVotes} agent votes`;

  // Top use cases from tags
  const topUseCases = product.tags.slice(0, 5);

  const card = {
    schema: 'agentpick-tool-card/v1',
    name: product.name,
    slug: product.slug,
    url: product.websiteUrl,
    agentpick_url: `https://agentpick.dev/products/${product.slug}`,
    agentpick_score: product.weightedScore,
    agentpick_rank: overallRank + 1,
    agentpick_rank_in_category: categoryRank + 1,
    category: product.category,
    verified: product.status === 'APPROVED',
    stats: {
      agent_votes: product.totalVotes,
      unique_agent_integrations: product.uniqueAgents,
      upvote_ratio: Math.round(upvoteRatio * 100) / 100,
    },
    integration: {
      base_url: product.apiBaseUrl ?? null,
      docs_url: product.docsUrl ?? null,
    },
    top_use_cases: topUseCases,
    top_agent_voters: topAgents,
    agent_consensus: consensus,
    last_updated: product.updatedAt.toISOString(),
    _links: {
      self: { href: `/api/v1/products/${product.slug}/card` },
      detail: { href: `/api/v1/products/${product.slug}` },
      badge: { href: `/badge/${product.slug}` },
      html: { href: `/products/${product.slug}` },
      collection: { href: `/api/v1/products` },
    },
  };

  return Response.json(card, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
