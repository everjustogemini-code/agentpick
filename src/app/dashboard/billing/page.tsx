'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PlanCode = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

interface UsageData {
  plan: PlanCode;
  plan_label: string;
  monthlyLimit: number | null;
  callsThisMonth: number;
  daily_limit: number;
  daily_used: number;
}

const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  STARTER: 29,
  PRO: 99,
  ENTERPRISE: 0,
};

const UPGRADE_TARGETS: Record<string, { slug: string; label: string; price: number } | null> = {
  FREE: { slug: 'pro', label: 'Pro', price: 29 },
  STARTER: { slug: 'growth', label: 'Growth', price: 99 },
  PRO: null,
  ENTERPRISE: null,
};

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = localStorage.getItem('agentpick_api_key');
    if (!apiKey) {
      setError('No API key found. Set your key in the dashboard first.');
      setLoading(false);
      return;
    }

    fetch('/api/v1/router/usage', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setUsage(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load billing info.');
        setLoading(false);
      });
  }, []);

  async function handleUpgrade(plan: string) {
    const apiKey = localStorage.getItem('agentpick_api_key');
    if (!apiKey) return;

    setUpgrading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/router/upgrade', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.message ?? data.error ?? 'Upgrade failed.');
        setUpgrading(false);
      }
    } catch {
      setError('Upgrade request failed.');
      setUpgrading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">
            ← Dashboard
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white text-sm">Billing</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-8">Billing & Plan</h1>

        {loading && (
          <div className="text-gray-400 text-sm">Loading billing info…</div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {usage && !loading && (
          <>
            {/* Current Plan */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Current Plan</p>
                  <p className="text-2xl font-bold text-white">{usage.plan_label}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    ${PLAN_PRICES[usage.plan] ?? 0}/month
                  </p>
                </div>
                <span className="bg-cyan-400/10 text-cyan-400 text-xs px-3 py-1 rounded-full font-mono">
                  Active
                </span>
              </div>
            </div>

            {/* Usage Summary */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Usage This Month</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Calls This Month</p>
                  <p className="text-xl font-bold text-white font-mono">{usage.callsThisMonth.toLocaleString()}</p>
                  {usage.monthlyLimit && (
                    <p className="text-xs text-gray-500 mt-0.5">of {usage.monthlyLimit.toLocaleString()}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Today</p>
                  <p className="text-xl font-bold text-white font-mono">{usage.daily_used.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">of {usage.daily_limit.toLocaleString()} daily limit</p>
                </div>
              </div>
              {usage.monthlyLimit && (
                <div className="mt-4">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (usage.callsThisMonth / usage.monthlyLimit) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {((usage.callsThisMonth / usage.monthlyLimit) * 100).toFixed(1)}% used
                  </p>
                </div>
              )}
            </div>

            {/* Upgrade section */}
            {UPGRADE_TARGETS[usage.plan] && (
              <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 rounded-xl p-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Upgrade Plan</p>
                <p className="text-white font-semibold text-lg mb-1">
                  {UPGRADE_TARGETS[usage.plan]!.label} — ${UPGRADE_TARGETS[usage.plan]!.price}/mo
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  Unlock higher call limits and priority support.
                </p>
                <button
                  onClick={() => handleUpgrade(UPGRADE_TARGETS[usage.plan]!.slug)}
                  disabled={upgrading}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all"
                >
                  {upgrading ? 'Redirecting to Stripe…' : `Upgrade to ${UPGRADE_TARGETS[usage.plan]!.label}`}
                </button>
              </div>
            )}

            {(usage.plan === 'PRO' || usage.plan === 'ENTERPRISE') && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm">
                  You&apos;re on the {usage.plan_label} plan.{' '}
                  <a href="mailto:billing@agentpick.dev" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                    Contact us
                  </a>{' '}
                  for Enterprise pricing or custom limits.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
