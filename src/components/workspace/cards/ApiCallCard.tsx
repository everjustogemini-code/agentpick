'use client';

import type { ApiCallCardProps } from '@/types/workspace';

export default function ApiCallCard({ method = 'POST', url, body, waiting = true }: ApiCallCardProps) {
  return (
    <div className="animate-[slideUpCard_0.3s_ease-out]">
      <div className="rounded-xl border border-border-default bg-white p-5 shadow-sm">
        <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">
          API Call
        </div>
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-700">
            {method}
          </span>
          <span className="font-mono text-[12px] text-text-secondary">{url}</span>
        </div>

        {body && (
          <>
            <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">
              Request
            </div>
            <pre className="overflow-x-auto rounded-lg bg-[#F1F5F9] p-3 font-mono text-[12px] leading-relaxed text-text-secondary">
              {JSON.stringify(body, null, 2)}
            </pre>
          </>
        )}

        {waiting && (
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            <span className="text-[12px] text-text-dim">Waiting for response...</span>
          </div>
        )}
      </div>
    </div>
  );
}
