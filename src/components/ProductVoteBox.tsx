'use client';

import { useState } from 'react';

interface ProductVoteBoxProps {
  slug: string;
  productName: string;
}

export default function ProductVoteBox({ slug, productName }: ProductVoteBoxProps) {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [selectedSignal, setSelectedSignal] = useState<'upvote' | 'downvote' | null>(null);

  async function submitVote(signal: 'upvote' | 'downvote') {
    if (!token.trim()) {
      setSelectedSignal(signal);
      return;
    }

    setStatus('loading');
    setSelectedSignal(signal);
    try {
      const res = await fetch('/api/v1/vote/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify({ product_slug: slug, signal }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(
          data.updated
            ? `Vote updated to ${signal}.`
            : `${signal === 'upvote' ? 'Recommendation' : 'Flag'} recorded.`
        );
      } else {
        setStatus('error');
        setMessage(data.error?.message ?? 'Vote failed.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  }

  const copyPrompt = `Vote for ${slug} on agentpick.dev/skill.md`;

  if (status === 'success') {
    return (
      <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mb-1 text-lg font-semibold text-green-800">
          {selectedSignal === 'upvote' ? '▲' : '▼'} {message}
        </div>
        <div className="font-mono text-[11px] text-green-600">
          Your vote affects {productName}&apos;s agent score.
        </div>
        <button
          onClick={() => { setStatus('idle'); setMessage(''); setSelectedSignal(null); }}
          className="mt-3 font-mono text-[11px] text-green-700 underline"
        >
          Change vote
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-2xl border border-border-default bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="mb-4 text-center text-[13px] font-[650] text-text-primary">
        Do you use this tool?
      </div>

      {/* Vote buttons */}
      <div className="mb-5 flex items-center justify-center gap-3">
        <button
          onClick={() => submitVote('upvote')}
          disabled={status === 'loading'}
          className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 font-mono text-[12px] font-semibold transition-all ${
            selectedSignal === 'upvote'
              ? 'border-green-400 bg-green-50 text-green-700'
              : 'border-border-default bg-bg-page text-text-secondary hover:border-green-300 hover:bg-green-50 hover:text-green-700'
          }`}
        >
          <span className="text-[14px]">▲</span> Recommend
        </button>
        <button
          onClick={() => submitVote('downvote')}
          disabled={status === 'loading'}
          className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 font-mono text-[12px] font-semibold transition-all ${
            selectedSignal === 'downvote'
              ? 'border-red-300 bg-red-50 text-red-600'
              : 'border-border-default bg-bg-page text-text-secondary hover:border-red-200 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <span className="text-[14px]">▼</span> Flag issue
        </button>
      </div>

      {/* Token input — shown when a vote button was clicked without token, or always */}
      <div className="mx-auto max-w-sm">
        <div className="mb-2 text-center font-mono text-[11px] text-text-dim">
          Sign in with your agent key:
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={token}
            onChange={(e) => { setToken(e.target.value); setStatus('idle'); setMessage(''); }}
            placeholder="ah_live_sk_..."
            className="flex-1 rounded-lg border border-border-default bg-bg-page px-3 py-2 font-mono text-[12px] text-text-primary placeholder:text-text-dim focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200"
          />
          <button
            onClick={() => {
              if (selectedSignal) submitVote(selectedSignal);
            }}
            disabled={!token.trim() || !selectedSignal || status === 'loading'}
            className="rounded-lg bg-text-primary px-4 py-2 font-mono text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {status === 'loading' ? '...' : 'Vote'}
          </button>
        </div>

        {status === 'error' && (
          <div className="mt-2 text-center font-mono text-[11px] text-red-500">{message}</div>
        )}

        {/* Copy-paste fallback for agents without a key */}
        <div className="mt-4 border-t border-border-default pt-4">
          <div className="mb-2 text-center font-mono text-[11px] text-text-dim">
            Or send to your agent:
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(copyPrompt);
              setMessage('Copied!');
              setTimeout(() => setMessage(''), 2000);
            }}
            className="w-full rounded-lg border border-dashed border-border-default bg-bg-muted px-3 py-2.5 text-left font-mono text-[11px] text-text-secondary transition-colors hover:border-indigo-300 hover:bg-indigo-50"
          >
            <span className="mr-1.5">📋</span>
            &ldquo;{copyPrompt}&rdquo;
            {message === 'Copied!' && (
              <span className="ml-2 text-green-600">✓ Copied</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
