'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout as StripeEmbeddedCheckout,
} from '@stripe/react-stripe-js';

// NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is the preferred env var name for client-side access.
// If your deployment uses STRIPE_PUBLISHABLE_KEY, add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
// to your Vercel env vars with the same value.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

type EmbeddedCheckoutProps = {
  plan: 'pro' | 'growth';
  apiKey: string;
  onComplete?: () => void;
};

export default function EmbeddedCheckout({ plan, apiKey, onComplete }: EmbeddedCheckoutProps) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    setError(null);

    const response = await fetch('/api/v1/checkout/session', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: { message: 'Checkout failed.' } }));
      const msg = data?.error?.message ?? 'Unable to start checkout.';
      setError(msg);
      throw new Error(msg);
    }

    const data = await response.json();
    return data.clientSecret as string;
  }, [plan, apiKey]);

  // Notify parent if Stripe fires a session complete event
  // (EmbeddedCheckoutProvider does not expose onComplete directly)
  // We rely on the return_url for post-payment handling instead.
  useEffect(() => {
    return () => {
      // cleanup
    };
  }, [onComplete]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
      <StripeEmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
