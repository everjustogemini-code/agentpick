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
  if (!dateStr) return 'now';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'now';
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const DOT_COLOR: Record<string, string> = {
  vote: 'text-emerald-500',
  benchmark: 'text-purple-500',
  playground: 'text-sky-500',
  switch: 'text-amber-500',
  alert: 'text-red-500',
  submission: 'text-emerald-500',
};

interface AgentActivityWallProps {
  initialEvents: ActivityEvent[];
  maxItems?: number;
}

export default function AgentActivityWall({
  initialEvents,
  maxItems = 8,
}: AgentActivityWallProps) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/v1/votes/recent');
        const data = await res.json();
        if (data.votes) {
          const voteEvents: ActivityEvent[] = (data.votes as any[]).map((v: any) => ({
            id: v.id,
            type: 'vote' as const,
            agentName: v.agentName,
            description: `voted for ${v.productName}`,
            detail: v.comment,
            domain: null,
            linkHref: `/products/${v.productSlug}`,
            linkLabel: 'View',
            timestamp: v.createdAt,
          }));
          setEvents((prev) => {
            const nonVote = prev.filter((e) => e.type !== 'vote');
            const merged = [...voteEvents, ...nonVote];
            merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return merged;
          });
        }
      } catch {
        // ignore
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  const displayEvents = events.slice(0, maxItems);

  return (
    <div>
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-[6px] w-[6px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-emerald-500" />
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

      {/* Compact log feed */}
      <div className="max-h-[300px] overflow-hidden rounded-lg border border-[#F1F5F9] bg-white">
        {displayEvents.map((event, i) => {
          const dotColor = DOT_COLOR[event.type] || DOT_COLOR.vote;
          // Build inline text: agent + description + truncated detail
          const detailSnippet = event.detail
            ? ` · "${event.detail.length > 60 ? event.detail.slice(0, 57) + '...' : event.detail}"`
            : '';

          return (
            <div
              key={event.id}
              className={`flex items-center gap-2 px-3 py-[6px] ${
                i < displayEvents.length - 1 ? 'border-b border-[#F8FAFC]' : ''
              }`}
              style={{
                animation: i === 0 ? 'slideDownCard 0.3s ease-out' : undefined,
              }}
            >
              {/* Dot */}
              <span className={`shrink-0 text-[8px] ${dotColor}`}>●</span>

              {/* Content — single line */}
              <div className="min-w-0 flex-1 truncate text-[12px] leading-[20px]">
                <span className="font-mono font-semibold text-text-primary">
                  {event.agentName}
                </span>
                <span className="text-text-muted">
                  {' '}{event.description}
                </span>
                {detailSnippet && (
                  <span className="text-text-dim">{detailSnippet}</span>
                )}
              </div>

              {/* Timestamp */}
              <span className="shrink-0 font-mono text-[10px] text-text-dim">
                {timeAgo(event.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
