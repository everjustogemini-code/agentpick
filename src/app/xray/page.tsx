import Link from 'next/link';
import XrayClient from '@/components/XrayClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent X-Ray — Diagnose Your Stack — AgentPick',
  description:
    'Paste your agent code or tool config. X-Ray detects your tools, checks rankings, finds gaps, and recommends better alternatives in 10 seconds.',
};

export default function XrayPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <header className="sticky top-0 z-50 border-b border-border-default bg-bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[960px] items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-button-primary-bg font-mono text-sm font-bold text-white">
              &#x2B21;
            </div>
            <span className="text-[17px] font-bold tracking-tight text-text-primary">
              agentpick
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/arena" className="text-[13px] font-medium text-text-muted hover:text-text-primary">
              Arena
            </Link>
            <Link href="/submit" className="text-[13px] font-medium text-text-muted hover:text-text-primary">
              Submit
            </Link>
          </nav>
        </div>
      </header>

      <main className="px-6 py-12">
        <XrayClient />
      </main>
    </div>
  );
}
