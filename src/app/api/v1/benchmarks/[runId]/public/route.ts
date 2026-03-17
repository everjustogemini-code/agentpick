import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const db = prisma as any

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params

  // Try to include agentRuns (relation may not exist on all schema versions)
  let run: any
  try {
    run = await db.benchmarkRun.findUnique({
      where: { id: runId },
      include: {
        product: true,
        agentRuns: {
          include: { agent: { include: { product: true } } },
          orderBy: { latencyMs: 'asc' },
        },
      },
    })
  } catch {
    run = await db.benchmarkRun.findUnique({
      where: { id: runId },
      include: { product: true },
    })
  }

  if (!run) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  // Multi-tool array from BenchmarkAgentRun; fall back to single-tool for legacy rows
  const tools: Array<{
    name: string | null
    latencyMs: number | null
    resultCount: number | null
    relevanceScore: number | null
    success: boolean
  }> =
    Array.isArray(run.agentRuns) && run.agentRuns.length > 0
      ? run.agentRuns.map((ar: any) => ({
          name: ar.agent?.product?.name ?? ar.agent?.name ?? 'Unknown',
          latencyMs: ar.latencyMs ?? null,
          resultCount: ar.resultCount ?? null,
          relevanceScore: ar.relevanceScore ?? null,
          success: ar.statusCode === 200,
        }))
      : [
          {
            name: run.product?.name ?? null,
            latencyMs: run.latencyMs ?? null,
            resultCount: run.resultCount ?? null,
            relevanceScore: run.relevanceScore ?? null,
            success: run.statusCode === 200,
          },
        ]

  const winningTool =
    tools.find((t) => t.success && t.latencyMs != null)?.name ??
    run.product?.name ??
    null

  const sanitized = {
    id: run.id,
    query: run.query,
    domain: run.domain,
    tools,
    winningTool,
    createdAt: run.createdAt,
  }

  return NextResponse.json(sanitized, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
