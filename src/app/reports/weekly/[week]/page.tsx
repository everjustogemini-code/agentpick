import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 3600;

interface Props {
  params: Promise<{ week: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { week } = await params;
  return {
    title: `Weekly Report ${week} — AgentPick`,
    description: `AgentPick weekly report for ${week}. Top movers, benchmark highlights, and agent reviews.`,
  };
}

export default async function WeeklyReportPage({ params }: Props) {
  const { week } = await params;

  const report = await prisma.weeklyReport.findUnique({
    where: { week },
  });

  if (!report || report.status !== 'published') notFound();

  // Simple markdown rendering (convert headers, lists, bold)
  const htmlContent = report.markdownContent
    .split('\n')
    .map((line) => {
      if (line.startsWith('# ')) return `<h1 class="text-[28px] font-bold tracking-[-0.8px] text-text-primary mt-8 mb-4">${line.slice(2)}</h1>`;
      if (line.startsWith('## ')) return `<h2 class="text-lg font-bold text-text-primary mt-6 mb-3">${line.slice(3)}</h2>`;
      if (line.startsWith('- ')) return `<li class="text-sm text-text-secondary ml-4 mb-1">${line.slice(2)}</li>`;
      if (line.trim() === '') return '<br/>';
      return `<p class="text-sm text-text-secondary mb-2">${line}</p>`;
    })
    .join('\n');

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
          <span className="font-mono text-[10px] text-text-dim">{week}</span>
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-6 py-10">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </main>

      <footer className="border-t border-border-default py-6">
        <p className="text-center font-mono text-xs text-text-dim">
          agentpick.dev — ranked by machines, built for builders
        </p>
      </footer>
    </div>
  );
}
