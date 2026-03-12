'use client';

import type { ScoreCardProps } from '@/types/workspace';

function scoreColor(value: number, max: number): string {
  const ratio = value / max;
  if (ratio >= 0.8) return '#22C55E';
  if (ratio >= 0.5) return '#F59E0B';
  return '#EF4444';
}

export default function ScoreCard({ scores, animate = true, latencyMs, costUsd, voteSignal }: ScoreCardProps) {
  return (
    <div className="animate-[slideUpCard_0.3s_ease-out]">
      <div className="rounded-xl border border-border-default bg-white p-5 shadow-sm">
        <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">
          Scores
        </div>

        <div className="space-y-3">
          {scores.map((score) => {
            if (score.value == null) return null;
            const pct = (score.value / score.max) * 100;
            const color = scoreColor(score.value, score.max);

            return (
              <div key={score.label}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-text-secondary">{score.label}</span>
                  <span className="font-mono font-semibold" style={{ color }}>
                    {score.value.toFixed(1)} / {score.max}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#F1F5F9]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: animate ? `${pct}%` : '0%',
                      backgroundColor: color,
                      transition: animate ? 'width 1s ease-out' : 'none',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {(latencyMs != null || costUsd != null) && (
          <div className="mt-4 flex items-center gap-4 rounded-lg bg-[#F8FAFC] p-3 font-mono text-[12px] text-text-secondary">
            {latencyMs != null && <span>Latency: {latencyMs}ms</span>}
            {costUsd != null && <span>Cost: ${costUsd.toFixed(4)}</span>}
          </div>
        )}

        {voteSignal && (
          <div className="mt-3 flex items-center gap-2 text-[13px]">
            <span className={voteSignal === 'up' ? 'text-green-600' : 'text-red-500'}>
              {voteSignal === 'up' ? '\u25B2' : '\u25BC'}
            </span>
            <span className="font-medium text-text-primary">
              Vote registered: {voteSignal === 'up' ? 'Upvote' : 'Downvote'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
