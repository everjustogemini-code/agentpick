'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export interface ActivityEvent {
  id: string;
  type: 'benchmark' | 'vote' | 'switch' | 'alert' | 'submission' | 'playground';
  agentName: string;
  description: string;
  detail: string | null;
  domain: string | null;
  linkHref: string | null;
  linkLabel: string;
  timestamp: string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return 'just now';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'just now';
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TYPE_CONFIG: Record<string, { emoji: string; color: string; bgColor: string }> = {
  benchmark: { emoji: '🔬', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  vote: { emoji: '🗳️', color: 'text-indigo-700', bgColor: 'bg-indigo-50' },
  switch: { emoji: '🔄', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  alert: { emoji: '⚠️', color: 'text-red-700', bgColor: 'bg-red-50' },
  submission: { emoji: '🆕', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  playground: { emoji: '⚗️', color: 'text-sky-700', bgColor: 'bg-sky-50' },
};

interface AgentActivityWallProps {
  initialEvents: ActivityEvent[];
  maxItems?: number;
}

export default function AgentActivityWall({
  initialEvents,
  maxItems = 12,
}: AgentActivityWallProps) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);

  // Poll for new events every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/v1/votes/recent');
        const data = await res.json();
        if (data.votes) {
          // Transform vote data into activity events
          const voteEvents: ActivityEvent[] = (data.votes as any[]).map((v: any) => ({
            id: v.id,
            type: 'vote' as const,
            agentName: v.agentName,
            description: `voted: ${v.productName}`,
            detail: v.comment,
            domain: null,
            linkHref: `/products/${v.productSlug}`,
            linkLabel: 'View',
            timestamp: v.createdAt,
          }));
          setEvents((prev) => {
            // Keep non-vote items from SSR
            const nonVote = prev.filter((e) => e.type !== 'vote');
            const merged = [...voteEvents, ...nonVote];
            merged.sort(
              (a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            return merged;
          });
        }
      } catch {
        // ignore polling errors
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  const displayEvents = events.slice(0, maxItems);

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-text-dim">
            Agent Activity
          </span>
        </div>
        <Link
          href="/live"
          className="font-mono text-[10px] uppercase tracking-[1px] text-text-dim hover:text-text-secondary"
        >
          View all →
        </Link>
      </div>

      {/* Event cards */}
      <div className="space-y-2">
        {displayEvents.map((event, i) => {
          const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.vote;
          return (
            <div
              key={event.id}
              className="flex items-start gap-3.5 rounded-xl border border-[#F1F5F9] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              style={{
                animation: i === 0 ? 'slideDownCard 0.3s ease-out' : undefined,
              }}
            >
              {/* Type badge */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bgColor} text-sm`}
              >
                {config.emoji}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[12px] font-semibold text-text-primary">
                    {event.agentName}
                  </span>
                  <span className="text-[13px] text-text-muted">
                    {event.description}
                  </span>
                </div>
                {event.detail && (
                  <p className="mt-0.5 text-[12px] leading-snug text-text-dim line-clamp-1">
                    {event.detail}
                  </p>
                )}
                {event.domain && (
                  <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-text-dim">
                    {event.domain}
                  </span>
                )}
              </div>

              {/* Right side: time + link */}
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-mono text-[10px] text-text-dim">
                  {timeAgo(event.timestamp)}
                </span>
                {event.linkHref && (
                  <Link
                    href={event.linkHref}
                    className="rounded-md bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-medium text-button-primary-bg hover:bg-slate-100"
                  >
                    {event.linkLabel}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
