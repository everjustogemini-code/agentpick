'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

type PlanCode = 'FREE' | 'STARTER' | 'PRO' | 'SCALE' | 'ENTERPRISE';

interface AccountData {
  plan: PlanCode;
  planLabel: string;
  usage: {
    monthlyLimit: number | null;
    monthlyUsed: number;
    monthlyRemaining: number | null;
    overageCalls: number;
    overageCostUsd: number;
  };
  monthlyBudgetUsd: number | null;
  spentThisMonth: number;
  totalCalls: number;
}

const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  STARTER: 29,
  PRO: 99,
  SCALE: 249,
  ENTERPRISE: 0,
};

const UPGRADE_TARGETS: Record<string, { slug: string; label: string; price: number } | null> = {
  FREE: { slug: 'pro', label: 'Pro', price: 29 },
  STARTER: { slug: 'growth', label: 'Growth', price: 99 },
  PRO: null,
  SCALE: null,
  ENTERPRISE: null,
};

export default function BillingPage() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noKey, setNoKey] = useState(false);

  useEffect(() => {
    const apiKey = localStorage.getItem('agentpick_api_key');
    if (!apiKey) {
      setNoKey(true);
      setLoading(false);
      return;
    }

    fetch('/api/v1/router/account', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setAccount(data.account);
        setLoading(false);
      })
      .catch((err) => {
        setError(`Failed to load billing info: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
        setError(data.error?.message ?? data.message ?? 'Upgrade failed.');
        setUpgrading(false);
      }
    } catch {
      setError('Upgrade request failed.');
      setUpgrading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gray-950 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-white text-sm">Billing</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-8">Billing &amp; Plan</h1>

          {loading && (
            <div className="text-gray-400 text-sm animate-pulse">Loading billing info…</div>
          )}

          {noKey && (
            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-6 text-center">
              <p className="text-yellow-300 text-sm mb-3">No API key found.</p>
              <p className="text-gray-400 text-sm mb-4">Connect your API key on the Dashboard first.</p>
              <Link
                href="/dashboard"
                className="inline-block bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Go to Dashboard →
              </Link>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {account && !loading && (
            <>
              {/* Current Plan */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Current Plan</p>
                    <p className="text-2xl font-bold text-white">{account.planLabel}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      ${PLAN_PRICES[account.plan] ?? 0}/month
                    </p>
                  </div>
                  <span className="bg-cyan-400/10 text-cyan-400 text-xs px-3 py-1 rounded-full font-mono">
                    Active
                  </span>
                </div>
              </div>

              {/* Usage Summary */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Usage This Billing Cycle</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Calls Used</p>
                    <p className="text-xl font-bold text-white font-mono">{account.usage.monthlyUsed.toLocaleString()}</p>
                    {account.usage.monthlyLimit && (
                      <p className="text-xs text-gray-500 mt-0.5">of {account.usage.monthlyLimit.toLocaleString()}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Calls (all time)</p>
                    <p className="text-xl font-bold text-white font-mono">{account.totalCalls.toLocaleString()}</p>
                  </div>
                </div>
                {account.usage.monthlyLimit && (
                  <div className="mt-4">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (account.usage.monthlyUsed / account.usage.monthlyLimit) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {((account.usage.monthlyUsed / account.usage.monthlyLimit) * 100).toFixed(1)}% used
                      {account.usage.monthlyRemaining !== null && (
                        <> &nbsp;·&nbsp; {account.usage.monthlyRemaining.toLocaleString()} remaining</>
                      )}
                    </p>
                  </div>
                )}
                {account.usage.overageCalls > 0 && (
                  <div className="mt-3 bg-orange-900/20 border border-orange-500/20 rounded-lg px-4 py-2 text-xs text-orange-300">
                    {account.usage.overageCalls.toLocaleString()} overage calls · ${account.usage.overageCostUsd.toFixed(4)} estimated cost
                  </div>
                )}
              </div>

              {/* Spend summary */}
              {(account.spentThisMonth > 0 || account.monthlyBudgetUsd !== null) && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Spend</p>
                  <div className="flex gap-8">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">This Month</p>
                      <p className="text-xl font-bold text-white font-mono">${account.spentThisMonth.toFixed(4)}</p>
                    </div>
                    {account.monthlyBudgetUsd !== null && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Budget Cap</p>
                        <p className="text-xl font-bold text-white font-mono">${account.monthlyBudgetUsd.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upgrade section */}
              {UPGRADE_TARGETS[account.plan] && (
                <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 rounded-xl p-6 mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Upgrade Plan</p>
                  <p className="text-white font-semibold text-lg mb-1">
                    {UPGRADE_TARGETS[account.plan]!.label} — ${UPGRADE_TARGETS[account.plan]!.price}/mo
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    Unlock higher call limits and priority support.
                  </p>
                  <button
                    onClick={() => handleUpgrade(UPGRADE_TARGETS[account.plan]!.slug)}
                    disabled={upgrading}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all"
                  >
                    {upgrading ? 'Redirecting to Stripe…' : `Upgrade to ${UPGRADE_TARGETS[account.plan]!.label}`}
                  </button>
                </div>
              )}

              {(account.plan === 'PRO' || account.plan === 'ENTERPRISE') && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <p className="text-gray-400 text-sm">
                    You&apos;re on the {account.planLabel} plan.{' '}
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
    </>
  );
}
