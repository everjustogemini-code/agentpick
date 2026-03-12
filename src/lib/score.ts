/**
 * R5 Three-source score calculation.
 * Blends: official benchmarks, sandbox (playground) tests, and real agent usage.
 * Weights adapt based on data availability.
 */

export interface ScoreBreakdown {
  benchmarkWeight: number;
  sandboxWeight: number;
  usageWeight: number;
  benchmarkScore: number;   // 0-5
  sandboxScore: number;     // 0-5
  usageScore: number;       // 0-5
  blendedScore: number;     // 0-10
  benchmarkCount: number;
  sandboxSessionCount: number;
  telemetryCount: number;
  successRate: number | null;
  avgLatencyMs: number | null;
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
  avgSandboxScore: number | null;
  benchmarkCount: number;
  sandboxSessionCount: number;
  telemetryCount: number;
  successRate: number | null;
  avgLatencyMs: number | null;
}): ScoreBreakdown {
  const benchmarkScore = input.avgBenchmarkRelevance ?? 0;
  const sandboxScore = input.avgSandboxScore ?? 0;
  const usageScore = calculateUsageScore(
    input.successRate,
    input.avgLatencyMs,
    input.telemetryCount,
  );

  // Adaptive weights based on data availability
  const benchmarkWeight = input.benchmarkCount >= 30 ? 0.32 : input.benchmarkCount >= 10 ? 0.15 : 0.05;
  const sandboxWeight = input.sandboxSessionCount >= 10 ? 0.18 : input.sandboxSessionCount >= 3 ? 0.08 : 0.02;
  const usageWeight = 1 - benchmarkWeight - sandboxWeight;

  const raw = (
    benchmarkScore * benchmarkWeight +
    sandboxScore * sandboxWeight +
    usageScore * usageWeight
  );

  // Normalize to 0-10
  const blendedScore = Math.round(raw * 20) / 10;

  return {
    benchmarkWeight,
    sandboxWeight,
    usageWeight,
    benchmarkScore,
    sandboxScore,
    usageScore,
    blendedScore: Math.min(10, Math.max(0, blendedScore)),
    benchmarkCount: input.benchmarkCount,
    sandboxSessionCount: input.sandboxSessionCount,
    telemetryCount: input.telemetryCount,
    successRate: input.successRate,
    avgLatencyMs: input.avgLatencyMs,
  };
}
