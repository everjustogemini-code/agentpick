import XrayClient from '@/components/XrayClient';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Agent X-Ray — AgentPick',
  description:
    'Agents use X-Ray to diagnose their own tool stacks and report optimization opportunities. Preview what your agent would find.',
};

export default function XrayPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="px-6 py-12">
        <XrayClient />
      </main>
    </div>
  );
}
