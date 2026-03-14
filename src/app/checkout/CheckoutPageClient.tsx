'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { normalizeUpgradePlan } from '@/lib/router/plans';

export default function CheckoutPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planParam = normalizeUpgradePlan(searchParams.get('plan'));

  useEffect(() => {
    router.replace(`/pricing${planParam ? `?plan=${planParam}` : ''}`);
  }, [planParam, router]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-400/90">
          AgentPick Checkout
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-white">
          Redirecting to hosted checkout
        </h1>
        <p className="mt-2 text-sm text-white/45">
          {planParam
            ? `Sending your ${planParam === 'pro' ? 'Pro' : planParam === 'growth' ? 'Growth' : 'Scale'} selection through the hosted Stripe flow.`
            : 'Sending you back to pricing.'}
        </p>
      </div>

      <div className="mt-6 text-center text-sm text-white/45">
        <Link href="/pricing" className="font-medium text-orange-300 hover:text-orange-200">
          ← Back to pricing
        </Link>
      </div>
    </main>
  );
}
