'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { normalizeUpgradePlan } from '@/lib/router/plans';

const STORAGE_KEY = 'agentpick_api_key';

export default function CheckoutPageClient() {
  const searchParams = useSearchParams();
  const planParam = normalizeUpgradePlan(searchParams.get('plan'));
  const [status, setStatus] = useState('Redirecting to Stripe...');

  useEffect(() => {
    if (!planParam) {
      setStatus('No plan selected.');
      return;
    }

    async function redirect() {
      let key: string | null = window.localStorage.getItem(STORAGE_KEY);

      // Auto-register if no key
      if (!key) {
        try {
          const res = await fetch('/api/v1/agents/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'checkout-' + Date.now() }),
          });
          const data = await res.json();
          if (data.api_key) {
            key = data.api_key;
            window.localStorage.setItem(STORAGE_KEY, key!);
          }
        } catch {}
      }

      if (!key) {
        setStatus('Unable to create account. Please try from the pricing page.');
        return;
      }

      // Get Stripe hosted checkout URL
      try {
        const res = await fetch('/api/v1/router/upgrade', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan: planParam }),
        });
        const data = await res.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
        setStatus(data?.error?.message || 'Unable to start checkout.');
      } catch {
        setStatus('Checkout failed. Please try again.');
      }
    }

    redirect();
  }, [planParam]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center">
      <p className="text-lg text-white">{status}</p>
      <Link href="/pricing" className="mt-6 inline-block text-sm text-orange-300 hover:text-orange-200">
        ← Back to pricing
      </Link>
    </main>
  );
}
