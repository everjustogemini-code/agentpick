import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import PricingPageClient from '@/components/PricingPageClient';

export const metadata: Metadata = {
  title: 'Pricing | AgentPick',
  description:
    'Compare AgentPick router plans and upgrade to Pro or Growth with Stripe Checkout.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SiteHeader />
      <PricingPageClient />
    </div>
  );
}
