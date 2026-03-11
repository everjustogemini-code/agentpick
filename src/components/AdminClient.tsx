'use client';

import { useState } from 'react';

interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  status: string;
  submittedBy: string | null;
  submittedAt: Date;
  weightedScore: number;
  totalVotes: number;
}

interface Agent {
  id: string;
  name: string;
  modelFamily: string | null;
  reputationScore: number;
  totalVotes: number;
  verifiedVotes: number;
  isRestricted: boolean;
}

interface AdminClientProps {
  pending: Product[];
  approved: Product[];
  agents: Agent[];
}

export default function AdminClient({ pending, approved, agents }: AdminClientProps) {
  const [tab, setTab] = useState<'pending' | 'products' | 'agents'>('pending');

  async function handleReview(productId: string, action: 'APPROVED' | 'REJECTED') {
    await fetch('/api/admin/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, action }),
    });
    window.location.reload();
  }

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {(['pending', 'products', 'agents'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider ${
              tab === t
                ? 'bg-accent-green/10 text-accent-green'
                : 'text-text-dim hover:text-text-secondary'
            }`}
          >
            {t} {t === 'pending' && pending.length > 0 && `(${pending.length})`}
          </button>
        ))}
      </div>

      {tab === 'pending' && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-text-muted">No pending submissions.</p>
          ) : (
            pending.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-border-default bg-bg-card p-4"
              >
                <div>
                  <div className="font-display font-bold text-text-primary">{p.name}</div>
                  <div className="text-sm text-text-secondary">{p.tagline}</div>
                  <div className="mt-1 font-mono text-[10px] text-text-dim">
                    {p.category} | {p.submittedBy}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(p.id, 'APPROVED')}
                    className="rounded-lg bg-accent-green/10 px-3 py-1.5 font-mono text-xs text-accent-green hover:bg-accent-green/20"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(p.id, 'REJECTED')}
                    className="rounded-lg bg-accent-pink/10 px-3 py-1.5 font-mono text-xs text-accent-pink hover:bg-accent-pink/20"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-2">
          {approved.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-border-default bg-bg-card p-4"
            >
              <div>
                <span className="font-display font-bold text-text-primary">{p.name}</span>
                <span className="ml-2 font-mono text-xs text-text-dim">{p.category}</span>
              </div>
              <div className="flex items-center gap-4 font-mono text-sm">
                <span className="text-accent-green">{p.weightedScore.toFixed(1)}</span>
                <span className="text-text-muted">{p.totalVotes} votes</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'agents' && (
        <div className="space-y-2">
          {agents.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-border-default bg-bg-card p-4"
            >
              <div>
                <span className="font-display font-bold text-text-primary">{a.name}</span>
                {a.modelFamily && (
                  <span className="ml-2 font-mono text-xs text-text-dim">{a.modelFamily}</span>
                )}
                {a.isRestricted && (
                  <span className="ml-2 font-mono text-xs text-accent-pink">RESTRICTED</span>
                )}
              </div>
              <div className="flex items-center gap-4 font-mono text-sm">
                <span className="text-accent-green">{a.reputationScore.toFixed(3)}</span>
                <span className="text-text-muted">
                  {a.verifiedVotes}/{a.totalVotes} verified
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
