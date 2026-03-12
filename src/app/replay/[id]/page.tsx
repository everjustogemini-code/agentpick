import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import BenchmarkReplay from '@/components/BenchmarkReplay';
import type { ReplayData } from '@/components/BenchmarkReplay';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const run = await prisma.benchmarkRun.findUnique({
    where: { id },
    select: { query: true, domain: true, product: { select: { name: true } } },
  });
  if (!run) return { title: 'Not Found' };

  const desc = `Watch an AI agent test ${run.product.name} — "${run.query}" (${run.domain} domain). Full benchmark replay on AgentPick.`;
  return {
    title: `Benchmark Replay — ${run.product.name} — AgentPick`,
    description: desc,
    openGraph: {
      title: `Benchmark Replay — ${run.product.name}`,
      description: desc,
      images: [{ url: `/api/og?type=replay&id=${id}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Benchmark Replay — ${run.product.name}`,
      images: [`/api/og?type=replay&id=${id}`],
    },
  };
}

export default async function ReplayPage({ params }: Props) {
  const { id } = await params;

  const run = await prisma.benchmarkRun.findUnique({
    where: { id },
    include: {
      product: { select: { name: true, slug: true } },
    },
  });

  if (!run) notFound();

  // Get benchmark agent info
  const benchAgent = await prisma.benchmarkAgent.findUnique({
    where: { id: run.benchmarkAgentId },
    include: { agent: { select: { name: true } } },
  });

  // Parse raw response for results
  const rawResponse = run.rawResponse as Record<string, unknown> | null;
  const results: { title: string; url: string }[] = [];
  if (rawResponse?.results && Array.isArray(rawResponse.results)) {
    for (const r of rawResponse.results.slice(0, 5)) {
      const item = r as Record<string, unknown>;
      results.push({
        title: (item.title as string) ?? 'Untitled',
        url: (item.url as string) ?? '',
      });
    }
  }

  const toolConfig = run.toolConfig as Record<string, unknown> | null;

  const replayData: ReplayData = {
    id: run.id,
    agentName: benchAgent?.agent.name ?? 'benchmark-agent',
    domain: run.domain,
    complexity: run.complexity,
    tool: run.product.slug,
    query: run.query,
    config: {
      depth: (toolConfig?.depth as string) ?? 'basic',
      maxResults: (toolConfig?.maxResults as number) ?? 10,
    },
    latencyMs: run.latencyMs,
    statusCode: run.statusCode,
    resultCount: run.resultCount ?? 0,
    results,
    relevanceScore: run.relevanceScore,
    freshnessScore: run.freshnessScore,
    completenessScore: run.completenessScore,
    evaluatedBy: run.evaluatedBy,
    evaluationReason: run.evaluationReason,
    costUsd: run.costUsd,
    success: run.success,
  };

  return (
    <div className="min-h-screen bg-[#0C0F1A]">
      <header className="border-b border-[#1E293B] py-3">
        <div className="mx-auto flex max-w-[840px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-indigo-600 font-mono text-sm font-bold text-white">
              ⬡
            </div>
            <span className="text-[17px] font-bold tracking-tight text-white">
              agentpick
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/products/${run.product.slug}`}
              className="font-mono text-[11px] text-[#64748B] hover:text-white"
            >
              {run.product.name}
            </Link>
            <Link
              href={`/playground?tools=${run.product.slug}`}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Run this test yourself
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-8">
        <BenchmarkReplay data={replayData} />

        {/* Actions */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            href={`/playground?tools=${run.product.slug}&domain=${run.domain}`}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Run this same test yourself
          </Link>
          <Link
            href={`/products/${run.product.slug}`}
            className="rounded-lg border border-[#1E293B] px-4 py-2 text-sm font-medium text-[#94A3B8] hover:border-[#334155] hover:text-white"
          >
            View {run.product.name} page
          </Link>
        </div>
      </main>
    </div>
  );
}
