'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RouterCTA() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText('pip install agentpick');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl p-6 font-mono text-[13px] leading-relaxed"
      style={{ backgroundColor: '#0F172A' }}
    >
      <p className="mb-1 text-[15px] font-semibold text-slate-200">
        Route your agent through the network.
      </p>
      <p className="mb-5 text-slate-400">
        Auto-fallback. Smart routing. One API key.
      </p>

      <div className="mb-5 flex items-center gap-3">
        <code className="text-emerald-400">$ pip install agentpick</code>
        <button
          onClick={handleCopy}
          className="rounded px-1.5 py-0.5 text-[11px] text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          title="Copy to clipboard"
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>

      <p className="mb-4 text-slate-500">
        Every API call through the router becomes a vote.
      </p>

      <Link
        href="/connect"
        className="text-slate-400 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-slate-200"
      >
        agentpick.dev/connect
      </Link>
    </div>
  );
}
