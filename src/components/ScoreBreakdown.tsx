import Link from 'next/link';

interface ScoreBreakdownProps {
  slug: string;
  score: number;
  benchmarkWeight: number;
  usageWeight: number;
  benchmarkScore: number;
  usageScore: number;
  benchmarkCount: number;
  telemetryCount: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  arenaTestCount: number;
}

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg-muted">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function ScoreBreakdown({
  slug,
  score,
  benchmarkWeight,
  usageWeight,
  benchmarkScore,
  usageScore,
  benchmarkCount,
  telemetryCount,
  successRate,
  avgLatencyMs,
  arenaTestCount,
}: ScoreBreakdownProps) {
  return (
    <div className="mb-8 rounded-2xl border border-border-default bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[32px] font-bold leading-none text-text-primary">
              {score.toFixed(1)}
            </span>
            <span className="font-mono text-sm text-text-dim">/ 10</span>
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Agent Score
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
            How this score is calculated
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Official Benchmarks — 40% */}
        <div className="rounded-xl border border-border-default bg-bg-page p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-[650] text-text-primary">Official Benchmarks</span>
            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-purple-600">
              {Math.round(benchmarkWeight * 100)}%
            </span>
          </div>
          <div className="mb-2 flex items-center gap-3">
            <Bar value={benchmarkScore} max={5} color="#8B5CF6" />
            <span className="w-12 text-right font-mono text-[12px] font-bold text-text-primary">
              {benchmarkScore.toFixed(1)}/5
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-text-dim">
              {fmt(benchmarkCount)} tests{benchmarkCount >= 30 ? '' : ' (building...)'}
            </span>
            {benchmarkCount > 0 && (
              <Link
                href={`/products/${slug}/benchmarks`}
                className="font-mono text-[11px] font-medium text-purple-600 hover:underline"
              >
                Watch agent test this API &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Real Agent Usage — 60% */}
        <div className="rounded-xl border border-border-default bg-bg-page p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-[650] text-text-primary">Real Agent Usage</span>
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-green-600">
              {Math.round(usageWeight * 100)}%
            </span>
          </div>
          <div className="mb-2 flex items-center gap-3">
            <Bar value={usageScore} max={5} color="#10B981" />
            <span className="w-12 text-right font-mono text-[12px] font-bold text-text-primary">
              {usageScore.toFixed(1)}/5
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-text-dim">
              {successRate != null ? `${successRate.toFixed(0)}% success` : ''}
              {successRate != null && avgLatencyMs != null ? ' · ' : ''}
              {avgLatencyMs != null ? `avg ${avgLatencyMs}ms` : ''}
              {telemetryCount > 0 ? ` · ${fmt(telemetryCount)} API calls` : ''}
            </span>
            <Link
              href="/sdk"
              className="font-mono text-[11px] font-medium text-green-600 hover:underline"
            >
              View usage data &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Arena social proof (not scored) */}
      {arenaTestCount > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border-default bg-bg-muted px-4 py-2.5">
          <span className="font-mono text-[11px] text-text-secondary">
            Also: {fmt(arenaTestCount)} developers tested this in Arena
          </span>
          <Link
            href={`/playground?tools=${slug}`}
            className="font-mono text-[11px] font-medium text-indigo-600 hover:underline"
          >
            Test against your current stack &rarr;
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-center font-mono text-[10px] text-text-dim">
        Score = {Math.round(benchmarkWeight * 100)}% benchmark + {Math.round(usageWeight * 100)}% real usage.
        Arena/Playground data does not affect this score.
      </div>
    </div>
  );
}
