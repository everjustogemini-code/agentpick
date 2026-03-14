'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UPGRADE_PLAN_CONFIG, normalizeUpgradePlan } from '@/lib/router/plans';
import EmbeddedCheckout from '@/components/EmbeddedCheckout';

const STORAGE_KEY = 'agentpick_api_key';

export default function CheckoutPageClient() {
  const searchParams = useSearchParams();
  const planParam = normalizeUpgradePlan(searchParams.get('plan'));
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [registering, setRegistering] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        if (!cancelled) {
          setApiKey(saved);
          setRegistering(false);
        }
        return;
      }

      try {
        const response = await fetch('/api/v1/agents/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'checkout-' + Date.now() }),
        });
        const data = await response.json();

        if (!cancelled && data.api_key) {
          window.localStorage.setItem(STORAGE_KEY, data.api_key);
          setApiKey(data.api_key);
        }
      } catch {
      } finally {
        if (!cancelled) {
          setRegistering(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!planParam) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 text-center text-sm text-white/55">
        <p>No plan selected.</p>
        <Link href="/pricing" className="mt-4 inline-block font-medium text-orange-300">← Back to pricing</Link>
      </main>
    );
  }

  if (registering) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center text-white/55">
        Creating your account...
      </main>
    );
  }

  if (!apiKey) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 text-center text-sm text-white/55">
        <p>Unable to create account.</p>
        <Link href="/pricing" className="mt-4 inline-block font-medium text-orange-300">← Back to pricing</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-400/90">
          AgentPick Billing
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-white">
          Upgrade to {UPGRADE_PLAN_CONFIG[planParam].label}
        </h1>
      </div>
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4">
        <EmbeddedCheckout plan={planParam} apiKey={apiKey} />
      </div>
      <div className="mt-6 text-center text-sm text-white/45">
        <Link href="/pricing" className="font-medium text-orange-300 hover:text-orange-200">← Back to pricing</Link>
      </div>
    </main>
  );
}
