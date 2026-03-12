'use client';

import type { ResponseCardProps } from '@/types/workspace';

export default function ResponseCard({ latencyMs, statusCode, success, resultCount, results = [] }: ResponseCardProps) {
  return (
    <div className="animate-[slideUpCard_0.3s_ease-out]">
      <div
        className="rounded-xl border border-border-default bg-white p-5 shadow-sm"
        style={{ borderTopColor: success ? '#10B981' : '#EF4444', borderTopWidth: '2px' }}
      >
        <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">
          Response
        </div>
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[12px] text-text-secondary">{latencyMs}ms</span>
          <span
            className={`rounded px-2 py-0.5 font-mono text-[11px] font-semibold ${
              success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {statusCode} {success ? 'OK' : 'ERR'}
          </span>
        </div>

        <div className="rounded-lg border border-border-default bg-[#F8FAFC] p-3">
          <div className="mb-2 font-mono text-[11px] font-semibold text-text-secondary">
            {resultCount} results
          </div>
          <div className="space-y-2">
            {results.slice(0, 5).map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 font-mono text-[11px] text-text-dim">{i + 1}.</span>
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-text-primary">{r.title}</div>
                  <div className="truncate font-mono text-[10px] text-blue-500">{r.url}</div>
                </div>
              </div>
            ))}
            {resultCount > 5 && (
              <div className="font-mono text-[11px] text-text-dim">+{resultCount - 5} more results</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
