'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { normalizeUpgradePlan } from '@/lib/router/plans';
import EmbeddedCheckout from '@/components/EmbeddedCheckout';

const STORAGE_KEY = 'agentpick_api_key';

export default function CheckoutPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planParam = normalizeUpgradePlan(searchParams.get('plan'));
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setApiKey(saved);
    } else {
      // No API key — redirect to pricing so they load it first
      router.replace(`/pricing${planParam ? `?plan=${planParam}` : ''}`);
    }
  }, [planParam, router]);

  if (!planParam) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 text-center text-sm text-white/55">
        <p>No plan selected.</p>
        <Link href="/pricing" className="mt-4 inline-block font-medium text-orange-300 hover:text-orange-200">
          ← Back to pricing
        </Link>
      </main>
    );
  }

  if (!apiKey) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 text-sm text-white/55">
        Redirecting to pricing page…
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
          Upgrade to {planParam === 'pro' ? 'Pro' : 'Growth'}
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Complete your subscription below. You'll be back to building in minutes.
        </p>
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-glass backdrop-blur-sm">
        <EmbeddedCheckout plan={planParam} apiKey={apiKey} />
      </div>

      <div className="mt-6 text-center text-sm text-white/45">
        <Link href="/pricing" className="font-medium text-orange-300 hover:text-orange-200">
          ← Back to pricing
        </Link>
      </div>
    </main>
  );
}
