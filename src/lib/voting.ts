import { prisma } from './prisma';

// --------------- Telemetry-based scoring ---------------

interface TelemetryFields {
  telemetryCount: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  avgCostUsd: number | null;
}

export function calculateTelemetryScore(product: TelemetryFields): number {
  if (!product.telemetryCount || product.telemetryCount === 0) return 0;

  // Usage frequency: log-normalized (0-1)
  const usageNorm = Math.min(1, Math.log10(product.telemetryCount + 1) / 5);

  // Success rate (0-1)
  const successNorm = product.successRate ?? 0.5;

  // Latency: lower is better (0-1)
  const latencyNorm = product.avgLatencyMs
    ? Math.min(1, 100 / product.avgLatencyMs)
    : 0.5;

  // Cost: lower is better (0-1)
  const costNorm = product.avgCostUsd
    ? Math.min(1, 0.001 / product.avgCostUsd)
    : 0.5;

  const raw = (
    usageNorm * 0.30 +
    successNorm * 0.30 +
    latencyNorm * 0.20 +
    costNorm * 0.20
  );

  return Math.round(raw * 100) / 10; // 0-10 scale
}

export function calculateBlendedScore(product: TelemetryFields & { weightedScore: number }): number {
  const telemetryScore = calculateTelemetryScore(product);
  const voteScore = product.weightedScore;

  // Blend: more telemetry → less vote weight
  // 0 telemetry events: 100% votes, 1000+ events: 100% telemetry
  const telemetryWeight = Math.min(1, (product.telemetryCount || 0) / 1000);

  return telemetryScore * telemetryWeight + voteScore * (1 - telemetryWeight);
}

// --------------- Vote-based scoring ---------------

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
