'use client';

export default function ReplayControls({
  progress,
  elapsed,
  total,
  playing = false,
  speed = 1,
  onSeek,
  onPlayPause,
  onSpeedChange,
}: {
  progress: number;
  elapsed: string;
  total: string;
  playing?: boolean;
  speed?: number;
  onSeek?: (fraction: number) => void;
  onPlayPause?: () => void;
  onSpeedChange?: (speed: number) => void;
}) {
  function handleScrubberClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    onSeek?.(Math.max(0, Math.min(1, fraction)));
  }

  return (
    <div className="border-t border-border-default bg-[#F8FAFC] px-5 py-3">
      {/* Timeline scrubber */}
      <div
        className="mb-3 h-1.5 cursor-pointer rounded-full bg-gray-200"
        onClick={handleScrubberClick}
      >
        <div
          className="h-full rounded-full bg-button-primary-bg transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onPlayPause}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-button-primary-bg text-white hover:opacity-90"
          >
            {playing ? '\u23F8' : '\u25B6'}
          </button>
          <span className="font-mono text-[11px] text-text-dim">
            {elapsed} / {total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange?.(s)}
              className={`rounded px-2 py-0.5 font-mono text-[10px] font-medium transition-colors ${
                speed === s
                  ? 'bg-button-primary-bg text-white'
                  : 'bg-bg-muted text-text-dim hover:bg-gray-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
