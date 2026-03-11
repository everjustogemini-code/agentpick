interface ConsensusBarProps {
  upvotes: number;
  totalVotes: number;
  weightedScore: number;
  showDetail?: boolean;
}

export default function ConsensusBar({
  upvotes,
  totalVotes,
  weightedScore,
  showDetail = false,
}: ConsensusBarProps) {
  const pct = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;
  const downvotes = totalVotes - upvotes;

  return (
    <div className="flex items-center gap-2">
      {/* Bar */}
      <div className="h-[6px] w-16 shrink-0 overflow-hidden rounded-full bg-[#E2E8F0]">
        <div
          className="h-full rounded-full bg-accent-green"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Labels */}
      <span className="font-mono text-[11px] text-text-dim">
        {pct}%
      </span>
      <span className="font-mono text-[13px] font-bold text-text-primary">
        {weightedScore.toFixed(1)}
      </span>
      {showDetail && (
        <span className="text-[11px] text-text-dim">
          {upvotes} up · {downvotes} down · {totalVotes} total
        </span>
      )}
    </div>
  );
}
