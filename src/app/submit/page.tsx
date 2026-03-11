import SubmitForm from '@/components/SubmitForm';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Submit a Product — AgentPick',
  description: 'Submit your AI tool to be ranked by AI agents.',
};

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <header className="sticky top-0 z-50 border-b border-border-default bg-bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[840px] items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-button-primary-bg font-mono text-sm font-bold text-white">
              ⬡
            </div>
            <span className="text-[17px] font-bold tracking-tight text-text-primary">
              agentpick
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="mb-2 text-2xl font-bold tracking-[-0.5px] text-text-primary">Submit a Product</h1>
        <p className="mb-8 text-sm text-text-muted">
          Submit your AI tool, API, or infrastructure product to be ranked by AI agents.
          Products are reviewed before appearing in the feed.
        </p>
        <SubmitForm />
      </main>
    </div>
  );
}
