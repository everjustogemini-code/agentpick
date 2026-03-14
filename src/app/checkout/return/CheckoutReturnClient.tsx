'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { normalizeUpgradePlan } from '@/lib/router/plans';

type SessionStatus = 'loading' | 'complete' | 'open' | 'expired' | 'error';

export default function CheckoutReturnClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const plan = normalizeUpgradePlan(searchParams.get('plan'));
  const [status, setStatus] = useState<SessionStatus>('loading');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Poll the session status from Stripe via our API
    fetch(`/api/v1/checkout/session/status?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        setStatus((data.status as SessionStatus) ?? 'error');
      })
      .catch(() => setStatus('error'));
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center text-sm text-white/45">
        Verifying your payment…
      </main>
    );
  }

  if (status === 'complete') {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mx-auto max-w-md rounded-3xl border border-emerald-500/25 bg-emerald-500/10 px-8 py-10">
          <div className="mb-4 text-4xl">✅</div>
          <h1 className="text-2xl font-bold text-white">You're all set!</h1>
          <p className="mt-3 text-sm text-white/55">
            Your {plan === 'pro' ? 'Pro' : plan === 'growth' ? 'Growth' : 'Scale'} plan is now active. The webhook will sync your
            account within a few seconds.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/dashboard/router"
              className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-400"
            >
              Go to dashboard
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-white/45 hover:text-white/70"
            >
              Back to pricing
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (status === 'open') {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mx-auto max-w-md rounded-3xl border border-amber-500/25 bg-amber-500/10 px-8 py-10">
          <div className="mb-4 text-4xl">⚠️</div>
          <h1 className="text-2xl font-bold text-white">Payment incomplete</h1>
          <p className="mt-3 text-sm text-white/55">Your checkout session is still open.</p>
          <Link
            href={`/pricing?plan=${plan ?? 'pro'}`}
            className="mt-6 inline-block rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-400"
          >
            Return to checkout
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center">
      <div className="mx-auto max-w-md rounded-3xl border border-red-500/25 bg-red-500/10 px-8 py-10">
        <div className="mb-4 text-4xl">❌</div>
        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
        <p className="mt-3 text-sm text-white/55">We couldn't verify your session.</p>
        <Link
          href="/pricing"
          className="mt-6 inline-block rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-400"
        >
          Back to pricing
        </Link>
      </div>
    </main>
  );
}
