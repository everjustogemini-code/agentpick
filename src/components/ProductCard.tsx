import Link from 'next/link';
import ConsensusBar from './ConsensusBar';

interface ProductCardProps {
  rank: number;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  tags: string[];
  totalVotes: number;
  weightedScore: number;
  uniqueAgents: number;
  logoUrl?: string | null;
  featured?: boolean;
  upvotes?: number;
  approvedAt?: string | null;
  telemetryCount?: number;
  successRate?: number | null;
  avgLatencyMs?: number | null;
}

const CATEGORY_BADGE: Record<string, { bg: string; text: string }> = {
  search_research: { bg: 'bg-sky-50', text: 'text-sky-600' },
  web_crawling: { bg: 'bg-purple-50', text: 'text-purple-600' },
  code_compute: { bg: 'bg-orange-50', text: 'text-orange-600' },
  storage_memory: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  communication: { bg: 'bg-blue-50', text: 'text-blue-600' },
  payments_commerce: { bg: 'bg-green-50', text: 'text-green-600' },
  finance_data: { bg: 'bg-amber-50', text: 'text-amber-600' },
  auth_identity: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  scheduling: { bg: 'bg-teal-50', text: 'text-teal-600' },
  ai_models: { bg: 'bg-violet-50', text: 'text-violet-600' },
  observability: { bg: 'bg-red-50', text: 'text-red-600' },
};

const ACCENT_COLORS: Record<string, string> = {
  search_research: '#0EA5E9',
  web_crawling: '#8B5CF6',
  code_compute: '#F97316',
  storage_memory: '#10B981',
  communication: '#3B82F6',
  payments_commerce: '#22C55E',
  finance_data: '#F59E0B',
  auth_identity: '#6366F1',
  scheduling: '#14B8A6',
  ai_models: '#8B5CF6',
  observability: '#EF4444',
};

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

function isNew(approvedAt: string | null | undefined): boolean {
  if (!approvedAt) return false;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Date(approvedAt).getTime() > sevenDaysAgo;
}

export default function ProductCard({
  rank,
  slug,
  name,
  tagline,
  category,
  tags,
  totalVotes,
  weightedScore,
  logoUrl,
  upvotes,
  approvedAt,
  telemetryCount,
  successRate,
  avgLatencyMs,
}: ProductCardProps) {
  const badge = CATEGORY_BADGE[category] ?? { bg: 'bg-gray-50', text: 'text-gray-600' };
  const accent = ACCENT_COLORS[category] ?? '#64748B';
  const showNew = isNew(approvedAt);
  const upvoteCount = upvotes ?? totalVotes;

  return (
    <Link href={`/products/${slug}`}>
      <div className="group flex items-start gap-4 rounded-xl border border-[#E2E8F0] bg-white p-[18px_24px] shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
        {/* Rank + indicator */}
        <div className="flex w-9 shrink-0 flex-col items-end gap-0.5 pt-2.5">
          <div className="font-mono text-sm font-semibold" style={{ color: rank <= 3 ? '#0F172A' : '#94A3B8' }}>
            {rank}
          </div>
          {showNew && (
            <span className="rounded px-1 py-px font-mono text-[8px] font-bold uppercase tracking-wider text-[#F59E0B]">
              NEW
            </span>
          )}
        </div>

        {/* Logo */}
        <div
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl font-mono text-[17px] font-bold"
          style={{ backgroundColor: accent + '10', color: accent }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="h-8 w-8 rounded" />
          ) : (
            name.slice(0, 2).toUpperCase()
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-[650] tracking-[-0.3px] text-text-primary">
              {name}
            </h3>
            <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.8px] ${badge.bg} ${badge.text}`}>
              {category}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-muted">{tagline}</p>
          {/* Consensus bar */}
          <div className="mt-2 flex items-center gap-2">
            <ConsensusBar
              upvotes={upvoteCount}
              totalVotes={totalVotes}
              weightedScore={weightedScore}
            />
            <span className="shrink-0 text-[9px] tracking-wide text-text-dim">verified calls</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-[5px] border border-border-default bg-bg-muted px-2 py-0.5 font-mono text-[11px] text-text-dim"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Vote button */}
        <div className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
          <div className="flex w-14 flex-col items-center gap-0.5 rounded-[10px] border border-border-default bg-bg-muted px-0 py-2.5 transition-all">
            <span className="text-xs leading-none" style={{ color: accent }}>▲</span>
            <span className="font-mono text-[15px] font-bold leading-none text-text-primary">
              {fmt(totalVotes)}
            </span>
          </div>
          {(telemetryCount ?? 0) > 0 && (
            <div className="flex flex-col items-center gap-0.5 pt-1">
              <span className="font-mono text-[10px] text-text-dim">{fmt(telemetryCount!)} calls</span>
              {successRate != null && (
                <span className="font-mono text-[10px] text-text-dim">{Math.round(successRate * 100)}%</span>
              )}
              {avgLatencyMs != null && (
                <span className="font-mono text-[10px] text-text-dim">{avgLatencyMs}ms</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
