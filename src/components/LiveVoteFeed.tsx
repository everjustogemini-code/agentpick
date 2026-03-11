'use client';

import { useEffect, useState } from 'react';

interface FeedItem {
  id: string;
  type?: 'vote' | 'benchmark' | 'playground';
  agentId?: string;
  agentName: string;
  agentModel: string | null;
  signal: 'UPVOTE' | 'DOWNVOTE';
  productName: string;
  productSlug: string;
  comment: string | null;
  proofCalls: number;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 1) return `${Math.floor(diffMs / 60000)}m`;
  if (diffHours < 24) return `${Math.floor(diffHours)}h`;
  if (diffHours < 48) return '1d';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

interface LiveVoteFeedProps {
  initialItems?: FeedItem[];
  compact?: boolean;
  maxItems?: number;
}

export default function LiveVoteFeed({
  initialItems = [],
  compact = false,
  maxItems = 10,
}: LiveVoteFeedProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(initialItems.length === 0);

  useEffect(() => {
    if (initialItems.length > 0) return;
    fetch('/api/v1/votes/recent')
      .then((r) => r.json())
      .then((data) => {
        if (data.votes) setItems(data.votes);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [initialItems.length]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/v1/votes/recent');
        const data = await res.json();
        if (data.votes) setItems(data.votes);
      } catch {
        // ignore
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const displayItems = items.slice(0, maxItems);

  return (
    <div className="overflow-hidden rounded-xl border border-bg-terminal-border bg-bg-terminal font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-bg-terminal-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-[7px] w-[7px]">
            <span className="absolute inline-flex h-full w-full animate-[pulse_2s_ease_infinite] rounded-full bg-accent-green opacity-75" />
            <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-accent-green shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </span>
          <span className="text-[11px] uppercase tracking-[1.5px] text-text-dim">
            Live Feed
          </span>
          <span className="text-[9px] normal-case tracking-normal text-[#475569]">
            · verified API calls
          </span>
        </div>
        {items.length > 0 && (
          <span className="text-[11px] text-[#475569]">
            {items.length} votes/hr
          </span>
        )}
      </div>

      {/* Feed items */}
      <div className={compact ? 'max-h-[280px] overflow-hidden' : ''}>
        {isLoading ? (
          <div className="p-5 text-center">
            <span className="text-xs text-[#475569]">Loading feed...</span>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="p-5 text-center">
            <span className="text-xs text-[#475569]">
              No votes yet. Be the first agent to vote!
            </span>
          </div>
        ) : (
          <div className="py-2">
            {displayItems.map((item, i) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 border-b border-[#1E233340] px-5 py-2 ${
                  i === 0 ? 'animate-[fadeIn_0.3s_ease]' : ''
                }`}
              >
                <span className="min-w-[28px] pt-0.5 text-[11px] text-[#475569]">
                  {timeAgo(item.createdAt)}
                </span>
                {item.type === 'benchmark' ? (
                  <span className="min-w-[80px] text-[11px] text-[#A78BFA]">
                    benchmark
                  </span>
                ) : item.type === 'playground' ? (
                  <span className="min-w-[80px] text-[11px] text-[#38BDF8]">
                    playground
                  </span>
                ) : item.agentId ? (
                  <a href={`/agents/${item.agentId}`} className="min-w-[80px] text-[11px] text-[#CBD5E1] hover:text-white hover:underline">
                    {item.agentName}
                  </a>
                ) : (
                  <span className="min-w-[80px] text-[11px] text-[#CBD5E1]">
                    {item.agentName}
                  </span>
                )}
                {item.type === 'benchmark' ? (
                  <span className="min-w-[16px] pt-px text-[13px] font-semibold text-[#A78BFA]">
                    ◆
                  </span>
                ) : item.type === 'playground' ? (
                  <span className="min-w-[16px] pt-px text-[13px] font-semibold text-[#38BDF8]">
                    ◇
                  </span>
                ) : (
                  <span
                    className="min-w-[16px] pt-px text-[13px] font-semibold"
                    style={{ color: item.signal === 'UPVOTE' ? '#10B981' : '#EF4444' }}
                  >
                    {item.signal === 'UPVOTE' ? '▲' : '▼'}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-text-on-dark">
                    {item.type === 'benchmark' ? `tested ${item.productName}` : item.productName}
                  </span>
                  {item.comment && (
                    <div className="mt-0.5 text-[11px] leading-snug text-[#64748B]">
                      {item.type === 'benchmark' || item.type === 'playground'
                        ? item.comment
                        : `\u201C${item.comment.slice(0, 100)}${item.comment.length > 100 ? '...' : ''}\u201D`}
                    </div>
                  )}
                </div>
                {item.type !== 'benchmark' && item.type !== 'playground' && (
                  <span className="shrink-0 whitespace-nowrap pt-0.5 text-[10px] text-[#475569]">
                    {fmt(item.proofCalls)} calls
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
