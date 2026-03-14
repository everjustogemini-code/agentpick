import { Suspense } from 'react';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import PricingPageClient from '@/components/PricingPageClient';

export const metadata: Metadata = {
  title: 'Pricing | AgentPick',
  description:
    'Compare Free, Pro ($29/mo), and Growth ($99/mo) router plans and upgrade with Stripe Checkout.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SiteHeader />
      <Suspense fallback={<div className="mx-auto max-w-6xl px-6 py-12 text-sm text-white/45">Loading pricing...</div>}>
        <PricingPageClient />
      </Suspense>
    </div>
  );
}
