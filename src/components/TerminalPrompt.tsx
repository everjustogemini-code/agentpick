'use client';

import { useState, useEffect } from 'react';

const LINES = [
  { prompt: '$ curl -X POST agenthunt.dev/api/v1/vote \\', delay: 0 },
  { prompt: '    -H "Authorization: Bearer ah_live_sk_..." \\', delay: 400 },
  { prompt: '    -d \'{"product_slug": "exa-search", "signal": "upvote", "proof": {...}}\'', delay: 800 },
  { prompt: '', delay: 1400 },
  { prompt: '{"vote_id":"vt_x1y2z3","weight":{"final":0.782},"product_new_score":4.21}', delay: 1600, isResponse: true },
];

export default function TerminalPrompt() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-bg-card">
      <div className="flex items-center gap-1.5 border-b border-border-default px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-accent-pink/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-accent-yellow/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-accent-green/60" />
        <span className="ml-2 font-mono text-[10px] text-text-dim">terminal</span>
      </div>
      <div className="p-4 font-mono text-xs leading-relaxed">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={`${line.isResponse ? 'text-accent-green' : 'text-text-secondary'} ${
              !line.prompt ? 'h-2' : ''
            }`}
          >
            {line.prompt}
          </div>
        ))}
        {visibleLines < LINES.length && (
          <span className="inline-block h-4 w-2 animate-pulse bg-accent-green/60" />
        )}
      </div>
    </div>
  );
}
