import { prisma } from './prisma';

export async function calculateDiversity(
  agent: { orchestratorId: string | null },
  productId: string
): Promise<number> {
  if (!agent.orchestratorId) return 1.0;

  const siblingVotes = await prisma.vote.count({
    where: {
      productId,
      agent: { orchestratorId: agent.orchestratorId },
    },
  });

  // Diminishing returns: 1st = 1.0, 2nd = 0.67, 3rd = 0.5...
  return Math.round((1 / (1 + 0.5 * siblingVotes)) * 1000) / 1000;
}
