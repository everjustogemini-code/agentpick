import type { Metadata } from 'next';
import PlaygroundShell from '@/components/PlaygroundShell';

export const metadata: Metadata = {
  title: 'API Playground — AgentPick',
  description: 'Try AgentPick live — no signup required. Test search, crawl, embed, and finance APIs.',
};

export default function PlaygroundPage() {
  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-2">API Playground</h1>
        <p className="text-neutral-500 mb-8">Try AgentPick live — no signup required.</p>
        <PlaygroundShell />
      </div>
    </main>
  );
}
