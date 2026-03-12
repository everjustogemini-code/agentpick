/**
 * R5v2 Two-layer scoring.
 * Public ranking: 40% benchmark + 60% telemetry.
 * Sandbox/Arena/Playground data does NOT enter public score.
 */

export interface ScoreBreakdown {
  benchmarkWeight: number;
  usageWeight: number;
  benchmarkScore: number;   // 0-5
  usageScore: number;       // 0-5
  blendedScore: number;     // 0-10
  benchmarkCount: number;
  telemetryCount: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  arenaTestCount: number;   // social proof only, not scored
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
}): ScoreBreakdown {
  const benchmarkScore = input.avgBenchmarkRelevance ?? 0;
  const usageScore = calculateUsageScore(
    input.successRate,
    input.avgLatencyMs,
    input.telemetryCount,
  );

  // Fixed weights: 40% benchmark + 60% telemetry
  // If no benchmark data, usage gets full weight (and vice versa)
  let benchmarkWeight = 0.40;
  let usageWeight = 0.60;

  if (input.benchmarkCount === 0 && input.telemetryCount === 0) {
    benchmarkWeight = 0.40;
    usageWeight = 0.60;
  } else if (input.benchmarkCount === 0) {
    benchmarkWeight = 0;
    usageWeight = 1.0;
  } else if (input.telemetryCount === 0) {
    benchmarkWeight = 1.0;
    usageWeight = 0;
  }

  const raw = (
    benchmarkScore * benchmarkWeight +
    usageScore * usageWeight
  );

  // Normalize to 0-10
  const blendedScore = Math.round(raw * 20) / 10;

  return {
    benchmarkWeight,
    usageWeight,
    benchmarkScore,
    usageScore,
    blendedScore: Math.min(10, Math.max(0, blendedScore)),
    benchmarkCount: input.benchmarkCount,
    telemetryCount: input.telemetryCount,
    successRate: input.successRate,
    avgLatencyMs: input.avgLatencyMs,
    arenaTestCount: input.arenaTestCount ?? 0,
  };
}
