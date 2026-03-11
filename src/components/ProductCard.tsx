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
}

const CATEGORY_BADGE: Record<string, { bg: string; text: string }> = {
  api: { bg: 'bg-green-50', text: 'text-green-600' },
  mcp: { bg: 'bg-purple-50', text: 'text-purple-600' },
  skill: { bg: 'bg-orange-50', text: 'text-orange-600' },
  data: { bg: 'bg-amber-50', text: 'text-amber-600' },
  infra: { bg: 'bg-red-50', text: 'text-red-600' },
  platform: { bg: 'bg-blue-50', text: 'text-blue-600' },
};

const ACCENT_COLORS: Record<string, string> = {
  api: '#0EA5E9',
  mcp: '#8B5CF6',
  skill: '#F97316',
  data: '#10B981',
  infra: '#EF4444',
  platform: '#3B82F6',
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
          <div className="mt-2">
            <ConsensusBar
              upvotes={upvoteCount}
              totalVotes={totalVotes}
              weightedScore={weightedScore}
            />
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
        </div>
      </div>
    </Link>
  );
}
