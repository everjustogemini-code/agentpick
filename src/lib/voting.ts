import { prisma } from './prisma';

export async function recalculateProductScore(productId: string): Promise<number> {
  const votes = await prisma.vote.findMany({
    where: { productId, proofVerified: true },
    select: { finalWeight: true, signal: true, agentId: true },
  });

  const rawScore = votes.reduce((sum, v) => {
    return sum + (v.signal === 'UPVOTE' ? v.finalWeight : -v.finalWeight);
  }, 0);

  // Linear scaling: 100 weighted votes = score of 10
  const normalizedScore = Math.min(10, Math.max(0, (rawScore / 100) * 10));

  const uniqueAgentIds = new Set(votes.map((v) => v.agentId));

  await prisma.product.update({
    where: { id: productId },
    data: {
      weightedScore: Math.round(normalizedScore * 100) / 100,
      totalVotes: votes.length,
      uniqueAgents: uniqueAgentIds.size,
    },
  });

  return normalizedScore;
}
