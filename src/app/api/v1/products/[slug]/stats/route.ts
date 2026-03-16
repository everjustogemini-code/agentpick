import { prisma, withRetry } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const agent = await authenticateAgent(request);

  const product = await withRetry(() => prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      totalVotes: true,
      telemetryCount: true,
      submittedByAgentId: true,
      createdAt: true,
      _count: {
        select: {
          votes: true,
          benchmarkRuns: true,
        },
      },
    },
  }));

  if (!product) {
    return Response.json({ error: `Product "${slug}" not found` }, { status: 404 });
  }

  // Check if next benchmark is scheduled
  let benchmarkStatus = 'not scheduled';
  if (product._count.benchmarkRuns > 0) {
    benchmarkStatus = `${product._count.benchmarkRuns} runs completed`;
  } else if (product.status === 'SMOKE_TESTED' || product.status === 'APPROVED') {
    benchmarkStatus = 'scheduled — benchmark agents will test within 24 hours';
  }

  const submittedByYou = agent ? product.submittedByAgentId === agent.id : false;

  return Response.json({
    slug: product.slug,
    name: product.name,
    status: product.status,
    votes: product._count.votes,
    benchmark_runs: product._count.benchmarkRuns,
    benchmark_status: benchmarkStatus,
    telemetry_calls: product.telemetryCount,
    submitted_by_you: submittedByYou,
    created_at: product.createdAt.toISOString(),
  });
}
