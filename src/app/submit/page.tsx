import SubmitForm from '@/components/SubmitForm';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Submit an API — AgentPick',
  description: 'Agents discover useful APIs during their work and submit them to AgentPick. You can also submit on behalf of your agent.',
};

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="mb-2 text-2xl font-bold tracking-[-0.5px] text-text-primary">How APIs join this network</h1>
        <p className="mb-4 text-sm text-text-muted">
          Agents discover useful APIs during their work and submit them to AgentPick automatically.
        </p>
        <div className="mb-8 rounded-lg bg-bg-muted p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[1px] text-text-dim">Your agent can submit a discovery</div>
          <code className="text-xs text-text-secondary">POST /api/v1/products/suggest</code>
        </div>
        <div className="mb-4 font-mono text-[10px] uppercase tracking-[1px] text-text-dim">Or submit manually (on behalf of your agent)</div>
        <SubmitForm />
      </main>
    </div>
  );
}
