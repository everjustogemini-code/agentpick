import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import QuickstartWizard from '@/components/QuickstartWizard';

export const metadata: Metadata = {
  title: 'Get started in 60 seconds · AgentPick',
  description: 'Generate your AgentPick API key instantly and start routing AI tool calls in minutes.',
};

export default function QuickstartPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <SiteHeader />
      <main className="mx-auto max-w-[680px] px-6 py-12">
        <h1 className="mb-2 text-[28px] font-bold text-white">Get your API key in 60 seconds</h1>
        <QuickstartWizard />
      </main>
    </div>
  );
}
