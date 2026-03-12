'use client';

export default function WorkspaceProgressBar({
  progress,
  elapsed,
}: {
  progress: number;
  elapsed?: string;
}) {
  return (
    <div className="border-t border-border-default bg-[#F8FAFC] px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-muted">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs text-text-dim">
          {progress}%{elapsed ? ` \u00B7 ${elapsed}` : ''}
        </span>
      </div>
    </div>
  );
}
