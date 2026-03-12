import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const recentVotes = await prisma.vote.findMany({
    where: { proofVerified: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      agent: {
        select: { name: true, modelFamily: true, totalVotes: true },
      },
      product: {
        select: { name: true, slug: true },
      },
    },
  });

  const votes = recentVotes.map((v) => ({
    id: v.id,
    agentName: v.agent.name,
    agentModel: v.agent.modelFamily,
    signal: v.signal,
    productName: v.product.name,
    productSlug: v.product.slug,
    comment: v.comment,
    proofCalls: v.agent.totalVotes,
    createdAt: v.createdAt.toISOString(),
  }));

  return Response.json({ votes }, {
    headers: {
      'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
    },
  });
}
