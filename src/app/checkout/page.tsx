import { Suspense } from 'react';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import CheckoutPageClient from './CheckoutPageClient';

export const metadata: Metadata = {
  title: 'Checkout | AgentPick',
  description: 'Subscribe to AgentPick Pro, Growth, or Scale — pay without leaving the site.',
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
