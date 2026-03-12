import XrayClient from '@/components/XrayClient';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Agent X-Ray — Diagnose Your Stack — AgentPick',
  description:
    'Paste your agent code or tool config. X-Ray detects your tools, checks rankings, finds gaps, and recommends better alternatives in 10 seconds.',
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
