'use client';

import type { FormEvent } from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PRICING_CARD_PLANS,
  getRouterPlanLabel,
  isPlanAtLeast,
  normalizeUpgradePlan,
  type RouterPlanCode,
  type UpgradePlanSlug,
} from '@/lib/router/plans';

const STORAGE_KEY = 'agentpick_api_key';

type BillingAccount = {
  id: string;
  email: string | null;
  plan: RouterPlanCode;
  planLabel?: string;
  billingCycleStart: string;
};

// Unused: kept for reference (old hosted checkout)
// type UpgradeResponse = { checkoutUrl: string; };

export default function PricingPageClient() {
  const searchParams = useSearchParams();
  const [draftKey, setDraftKey] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [account, setAccount] = useState<BillingAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutPlan, setCheckoutPlan] = useState<UpgradePlanSlug | null>(null);

  useEffect(() => {
    const savedKey = window.localStorage.getItem(STORAGE_KEY);
    if (!savedKey) return;

    setDraftKey(savedKey);
    void loadAccount(savedKey, false);
  }, []);

  async function loadAccount(key: string, persist = true) {
    setAccountLoading(true);
    setAccountError('');
    setCheckoutError('');

    try {
      const response = await fetch('/api/v1/router/account', {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid API key.');
      }

      const data = await response.json();
      setApiKey(key);
      setAccount(data.account);

      if (persist) {
        window.localStorage.setItem(STORAGE_KEY, key);
      }
    } catch (error) {
      setAccount(null);
      setApiKey('');
      setAccountError(error instanceof Error ? error.message : 'Unable to load billing account.');
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setAccountLoading(false);
    }
  }

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftKey.trim()) {
      setAccountError('Paste your AgentPick API key first.');
      return;
    }

    await loadAccount(draftKey.trim(), true);
  }

  function handleCheckout(plan: UpgradePlanSlug) {
    if (!apiKey || !account) {
      setCheckoutError('Load your AgentPick API key before starting checkout.');
      return;
    }
    // Navigate to the embedded checkout page (stays on agentpick.dev)
    window.location.assign(`/checkout?plan=${plan}`);
  }

  const checkoutState = searchParams.get('checkout');
  const checkoutPlanFromUrl = normalizeUpgradePlan(searchParams.get('plan'));
  const currentPlanLabel = account?.planLabel ?? (account ? getRouterPlanLabel(account.plan) : null);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-400/90">
          Router Billing
        </p>
        <h1 className="text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
          Pick the plan that matches your agent traffic
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
          Billing is tied to your AgentPick router API key. Load the key you use in the dashboard,
          then send that account through Stripe Checkout.
        </p>
      </div>

      {checkoutState === 'success' && checkoutPlanFromUrl && (
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          Stripe checkout completed for {checkoutPlanFromUrl === 'pro' ? 'Pro' : 'Growth'}.
          The webhook should sync your plan in a few seconds.
        </div>
      )}

      {checkoutState === 'cancelled' && checkoutPlanFromUrl && (
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-amber-500/25 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          Stripe checkout was cancelled. Your account is unchanged.
        </div>
      )}

      <section className="mx-auto mt-8 max-w-3xl rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-glass backdrop-blur-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
              Billing Account
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">Load your router API key</h2>
            <p className="mt-2 text-sm text-white/45">
              The pricing page uses the same API key stored by the router dashboard.
            </p>
          </div>

          {currentPlanLabel && (
            <div className="rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-2 text-sm text-orange-200">
              Current plan: {currentPlanLabel}
            </div>
          )}
        </div>

        <form className="mt-5 flex flex-col gap-3 md:flex-row" onSubmit={handleAccountSubmit}>
          <input
            type="password"
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder="ah_live_sk_..."
            className="min-w-0 flex-1 rounded-2xl border border-white/[0.08] bg-[#050507] px-4 py-3 text-sm font-mono text-white placeholder:text-white/20 focus:border-orange-500/45 focus:outline-none"
          />
          <button
            type="submit"
            disabled={accountLoading}
            className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {accountLoading ? 'Loading account...' : 'Load account'}
          </button>
        </form>

        {!apiKey && !accountLoading && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-white/40">Don't have a key?</span>
            <button
              type="button"
              onClick={async () => {
                setAccountLoading(true);
                setAccountError('');
                try {
                  const res = await fetch('/api/v1/agents/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: `web-${Date.now()}` }),
                  });
                  const data = await res.json();
                  if (data.api_key) {
                    setDraftKey(data.api_key);
                    // Copy key to clipboard
                    try { await navigator.clipboard.writeText(data.api_key); } catch {}
                    await loadAccount(data.api_key);
                  } else {
                    setAccountError('Registration failed. Try again.');
                  }
                } catch {
                  setAccountError('Registration failed. Try again.');
                } finally {
                  setAccountLoading(false);
                }
              }}
              className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition-colors hover:bg-orange-500/20"
            >
              Get a free API key instantly →
            </button>
          </div>
        )}

        {apiKey && account && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <span className="text-sm text-emerald-400">✓ Key active</span>
            <code className="flex-1 truncate font-mono text-xs text-white/60">{apiKey.slice(0, 20)}...{apiKey.slice(-6)}</code>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(apiKey); }}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/50 hover:bg-white/5 hover:text-white/80"
            >
              Copy
            </button>
          </div>
        )}

        {account?.email && (
          <div className="mt-4 space-y-1 text-sm text-white/55">
            <p>
              Billing email: <span className="font-medium text-white">{account.email}</span>
            </p>
            <p>
              Billing cycle started:{' '}
              <span className="font-medium text-white">
                {new Date(account.billingCycleStart).toLocaleDateString()}
              </span>
            </p>
          </div>
        )}

        {accountError && <p className="mt-4 text-sm text-red-400">{accountError}</p>}
        {checkoutError && <p className="mt-4 text-sm text-red-400">{checkoutError}</p>}
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        {PRICING_CARD_PLANS.map((plan) => {
          const upgradePlan = plan.slug === 'free' ? null : plan.slug;
          const isPaidPlan = plan.slug === 'pro' || plan.slug === 'growth';
          const exactMatch = account ? account.plan === plan.routerPlan : false;
          const higherPlan =
            account && isPaidPlan ? isPlanAtLeast(account.plan, plan.routerPlan) && !exactMatch : false;
          const isBusy = upgradePlan ? checkoutPlan === upgradePlan : false;

          return (
            <article
              key={plan.slug}
              className={`flex flex-col rounded-3xl border p-7 backdrop-blur-sm ${
                plan.slug === 'growth'
                  ? 'border-orange-500/30 bg-gradient-to-b from-orange-500/15 to-white/[0.05]'
                  : 'border-white/[0.08] bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-white">{plan.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">{plan.description}</p>
                </div>
                {plan.slug === 'growth' && (
                  <span className="rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">
                    Most headroom
                  </span>
                )}
              </div>

              <div className="mt-8 flex items-end gap-1">
                <span className="text-5xl font-bold tracking-[-0.05em] text-white">
                  {plan.monthlyPriceUsd === 0 ? '$0' : `$${plan.monthlyPriceUsd}`}
                </span>
                <span className="pb-2 text-sm text-white/40">
                  {plan.monthlyPriceUsd === 0 ? '' : '/month'}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white/55">
                <div>{plan.monthlyCalls.toLocaleString()} routed calls / month</div>
                <div className="mt-1">{plan.dailyCalls.toLocaleString()} calls / day</div>
              </div>

              <ul className="mt-6 flex-1 space-y-3 text-sm text-white/70">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-0.5 text-orange-300">+</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.slug === 'free' ? (
                <Link
                  href="/dashboard/router"
                  className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.05] px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
                >
                  {exactMatch ? 'Current plan' : plan.ctaLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (upgradePlan) {
                      void handleCheckout(upgradePlan);
                    }
                  }}
                  disabled={isBusy || !account || exactMatch || higherPlan}
                  className="mt-8 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isBusy && 'Opening checkout…'}
                  {!isBusy && exactMatch && 'Current plan'}
                  {!isBusy && higherPlan && `Included in ${currentPlanLabel}`}
                  {!isBusy && !exactMatch && !higherPlan && !account && 'Load API key to upgrade'}
                  {!isBusy && !exactMatch && !higherPlan && account && plan.ctaLabel}
                </button>
              )}
            </article>
          );
        })}
      </section>

      <div className="mt-10 text-center text-sm text-white/45">
        Need a key first?{' '}
        <Link href="/dashboard/router" className="font-medium text-orange-300 hover:text-orange-200">
          Create a free router account
        </Link>
        .
      </div>
    </main>
  );
}
