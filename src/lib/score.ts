/**
 * R6 Four-source scoring.
 * Sources ranked by trust:
 *   Router traces:     weight 1.0 (verified, real production data)
 *   Official benchmark: weight 0.8 (controlled but synthetic)
 *   Community telemetry: weight 0.5 (self-reported, less trustworthy)
 *   Simple votes:       weight 0.2 (opinion, no proof)
 */

export const SOURCE_WEIGHTS = {
  router: 1.0,
  benchmark: 0.8,
  community: 0.5,
  vote: 0.2,
} as const;

export interface SourceCounts {
  routerCount: number;
  benchmarkCount: number;
  communityCount: number;
  voteCount: number;
}

export interface ScoreBreakdown {
  // Per-source scores (0-5 each)
  routerScore: number;
  benchmarkScore: number;
  communityScore: number;
  voteScore: number;
  // Per-source weights (sum to 1.0)
  routerWeight: number;
  benchmarkWeight: number;
  communityWeight: number;
  voteWeight: number;
  // Blended
  blendedScore: number;     // 0-10
  // Counts
  routerCount: number;
  benchmarkCount: number;
  communityCount: number;
  voteCount: number;
  // Aggregate stats
  successRate: number | null;
  avgLatencyMs: number | null;
  arenaTestCount: number;
}

export function calculateUsageScore(
  successRate: number | null,
  avgLatencyMs: number | null,
  telemetryCount: number,
): number {
  if (telemetryCount === 0) return 0;

  // Success rate component (0-2.5)
  const successComponent = successRate != null ? (successRate / 100) * 2.5 : 1.25;

  // Latency component (0-1.5) — lower is better, capped at 5000ms
  let latencyComponent = 1.0;
  if (avgLatencyMs != null) {
    latencyComponent = Math.max(0, 1.5 * (1 - Math.min(avgLatencyMs, 5000) / 5000));
  }

  // Volume component (0-1.0) — log scale, capped at 10K
  const volumeComponent = Math.min(1.0, Math.log10(Math.max(1, telemetryCount)) / 4);

  return Math.min(5, successComponent + latencyComponent + volumeComponent);
}

export function calculateScoreBreakdown(input: {
  avgBenchmarkRelevance: number | null;
  benchmarkCount: number;
  telemetryCount: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  arenaTestCount?: number;
  // R6: per-source data
  routerCount?: number;
  routerSuccessRate?: number | null;
  routerAvgLatencyMs?: number | null;
  communityCount?: number;
  communitySuccessRate?: number | null;
  communityAvgLatencyMs?: number | null;
  voteScore?: number;
  voteCount?: number;
}): ScoreBreakdown {
  const routerCount = input.routerCount ?? 0;
  const communityCount = input.communityCount ?? (input.telemetryCount - routerCount);
  const benchmarkCount = input.benchmarkCount;
  const voteCount = input.voteCount ?? 0;

  // Calculate per-source scores (0-5)
  const routerScore = calculateUsageScore(
    input.routerSuccessRate ?? input.successRate,
    input.routerAvgLatencyMs ?? input.avgLatencyMs,
    routerCount,
  );
  const benchmarkScore = input.avgBenchmarkRelevance ?? 0;
  const communityScore = calculateUsageScore(
    input.communitySuccessRate ?? input.successRate,
    input.communityAvgLatencyMs ?? input.avgLatencyMs,
    communityCount > 0 ? communityCount : 0,
  );
  const voteScoreVal = Math.min(5, (input.voteScore ?? 0));

  // Calculate dynamic weights based on data availability
  // Base weights from SOURCE_WEIGHTS, but only for sources that have data
  const rawWeights: Record<string, number> = {};
  if (routerCount > 0) rawWeights.router = SOURCE_WEIGHTS.router;
  if (benchmarkCount > 0) rawWeights.benchmark = SOURCE_WEIGHTS.benchmark;
  if (communityCount > 0) rawWeights.community = SOURCE_WEIGHTS.community;
  if (voteCount > 0) rawWeights.vote = SOURCE_WEIGHTS.vote;

  const totalWeight = Object.values(rawWeights).reduce((s, w) => s + w, 0) || 1;

  const routerWeight = (rawWeights.router ?? 0) / totalWeight;
  const benchmarkWeight = (rawWeights.benchmark ?? 0) / totalWeight;
  const communityWeight = (rawWeights.community ?? 0) / totalWeight;
  const voteWeight = (rawWeights.vote ?? 0) / totalWeight;

  // Blend: each source contributes its score * its normalized weight
  // Scores are 0-5, we multiply by 2 to get 0-10 scale
  const raw = (
    routerScore * routerWeight +
    benchmarkScore * benchmarkWeight +
    communityScore * communityWeight +
    voteScoreVal * voteWeight
  );
  const blendedScore = Math.round(raw * 20) / 10; // 0-5 → 0-10

  return {
    routerScore,
    benchmarkScore,
    communityScore,
    voteScore: voteScoreVal,
    routerWeight,
    benchmarkWeight,
    communityWeight,
    voteWeight,
    blendedScore: Math.min(10, Math.max(0, blendedScore)),
    routerCount,
    benchmarkCount,
    communityCount: Math.max(0, communityCount),
    voteCount,
    successRate: input.successRate,
    avgLatencyMs: input.avgLatencyMs,
    arenaTestCount: input.arenaTestCount ?? 0,
  };
}
