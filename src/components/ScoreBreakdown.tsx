import Link from 'next/link';

interface ScoreBreakdownProps {
  slug: string;
  score: number;
  // R6: four-source data
  routerScore?: number;
  routerWeight?: number;
  routerCount?: number;
  benchmarkScore?: number;
  benchmarkWeight?: number;
  benchmarkCount?: number;
  communityScore?: number;
  communityWeight?: number;
  communityCount?: number;
  voteScore?: number;
  voteWeight?: number;
  voteCount?: number;
  // Aggregate
  successRate?: number | null;
  avgLatencyMs?: number | null;
  arenaTestCount?: number;
  // Legacy compat (ignored if R6 fields present)
  usageScore?: number;
  usageWeight?: number;
  telemetryCount?: number;
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

function SourceRow({
  label,
  tag,
  tagColor,
  tagBg,
  score,
  weight,
  count,
  color,
  detail,
  link,
  linkText,
}: {
  label: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  score: number;
  weight: number;
  count: number;
  color: string;
  detail?: string;
  link?: string;
  linkText?: string;
}) {
  if (weight === 0 && count === 0) return null;
  return (
    <div className="rounded-xl border border-border-default bg-bg-page p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-[650] text-text-primary">{label}</span>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold"
            style={{ color: tagColor, backgroundColor: tagBg }}
          >
            {tag}
          </span>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold"
          style={{ color: tagColor, backgroundColor: tagBg }}
        >
          {Math.round(weight * 100)}%
        </span>
      </div>
      <div className="mb-2 flex items-center gap-3">
        <Bar value={score} max={5} color={color} />
        <span className="w-12 text-right font-mono text-[12px] font-bold text-text-primary">
          {score.toFixed(1)}/5
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-text-dim">
          {fmt(count)} {count === 1 ? 'data point' : 'data points'}
          {detail ? ` · ${detail}` : ''}
        </span>
        {link && linkText && (
          <Link
            href={link}
            className="font-mono text-[11px] font-medium hover:underline"
            style={{ color: tagColor }}
          >
            {linkText} &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ScoreBreakdown(props: ScoreBreakdownProps) {
  const {
    slug,
    score,
    routerScore = 0,
    routerWeight = 0,
    routerCount = 0,
    benchmarkScore = 0,
    benchmarkWeight = 0,
    benchmarkCount = 0,
    communityScore = 0,
    communityWeight = 0,
    communityCount = 0,
    voteScore = 0,
    voteWeight = 0,
    voteCount = 0,
    successRate,
    avgLatencyMs,
    arenaTestCount = 0,
  } = props;

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

      <div className="space-y-3">
        {/* Router — highest trust (green) */}
        <SourceRow
          label="Router Traces"
          tag="Verified ✓"
          tagColor="#059669"
          tagBg="#ECFDF5"
          score={routerScore}
          weight={routerWeight}
          count={routerCount}
          color="#10B981"
          detail={successRate != null && routerCount > 0 ? `${successRate.toFixed(0)}% success` : undefined}
          link="/sdk"
          linkText="Route your calls"
        />

        {/* Benchmark — high trust (blue) */}
        <SourceRow
          label="Official Benchmarks"
          tag="Benchmark"
          tagColor="#2563EB"
          tagBg="#EFF6FF"
          score={benchmarkScore}
          weight={benchmarkWeight}
          count={benchmarkCount}
          color="#3B82F6"
          detail={benchmarkCount >= 30 ? undefined : 'building...'}
          link={benchmarkCount > 0 ? `/products/${slug}/benchmarks` : undefined}
          linkText="Watch agent test this API"
        />

        {/* Community telemetry — medium trust (gray) */}
        <SourceRow
          label="Community Telemetry"
          tag="Community"
          tagColor="#6B7280"
          tagBg="#F3F4F6"
          score={communityScore}
          weight={communityWeight}
          count={communityCount}
          color="#9CA3AF"
          detail={avgLatencyMs != null ? `avg ${avgLatencyMs}ms` : undefined}
          link="/sdk"
          linkText="Submit telemetry"
        />

        {/* Votes — lowest trust (light gray) */}
        <SourceRow
          label="Agent Votes"
          tag="Vote"
          tagColor="#9CA3AF"
          tagBg="#F9FAFB"
          score={voteScore}
          weight={voteWeight}
          count={voteCount}
          color="#D1D5DB"
        />
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
        Score ={' '}
        {[
          routerWeight > 0 && `${Math.round(routerWeight * 100)}% router`,
          benchmarkWeight > 0 && `${Math.round(benchmarkWeight * 100)}% benchmark`,
          communityWeight > 0 && `${Math.round(communityWeight * 100)}% community`,
          voteWeight > 0 && `${Math.round(voteWeight * 100)}% votes`,
        ]
          .filter(Boolean)
          .join(' + ')}
        . Arena data does not affect this score.
      </div>
    </div>
  );
}
