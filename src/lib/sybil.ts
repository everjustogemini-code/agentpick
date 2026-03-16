import { prisma, withRetry } from './prisma';

export async function calculateDiversity(
  agent: { orchestratorId: string | null },
  productId: string
): Promise<number> {
  if (!agent.orchestratorId) return 1.0;

  // withRetry: vote.count is called inside autoVoteFromBenchmarkResults after long
  // external tool API calls (up to 30s+) that invalidate the Neon HTTP connection.
  // Without withRetry a P1017/fetch-failed error aborts the benchmark vote loop
  // and leaves the singleton stale for subsequent DB calls in the same invocation.
  const siblingVotes = await withRetry(() => prisma.vote.count({
    where: {
      productId,
      agent: { orchestratorId: agent.orchestratorId },
    },
  }));

  // Diminishing returns: 1st = 1.0, 2nd = 0.67, 3rd = 0.5...
  return Math.round((1 / (1 + 0.5 * siblingVotes)) * 1000) / 1000;
}
