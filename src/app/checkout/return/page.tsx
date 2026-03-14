import { Suspense } from 'react';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import CheckoutReturnClient from './CheckoutReturnClient';

export const metadata: Metadata = {
  title: 'Checkout Complete | AgentPick',
};

export default function CheckoutReturnPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SiteHeader />
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl px-6 py-12 text-sm text-white/45">
            Verifying payment…
          </div>
        }
      >
        <CheckoutReturnClient />
      </Suspense>
    </div>
  );
}
