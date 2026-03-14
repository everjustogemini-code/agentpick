import { Suspense } from 'react';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import CheckoutPageClient from './CheckoutPageClient';

export const metadata: Metadata = {
  title: 'Checkout Redirect | AgentPick',
  description: 'Redirecting plan selections into the hosted Stripe checkout flow.',
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SiteHeader />
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl px-6 py-12 text-sm text-white/45">
            Loading checkout…
          </div>
        }
      >
        <CheckoutPageClient />
      </Suspense>
    </div>
  );
}
