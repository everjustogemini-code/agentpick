import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const db = prisma as any

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params

  const run = await db.benchmarkRun.findUnique({
    where: { id: runId },
    include: { product: true },
  })

  if (!run) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  const sanitized = {
    id: run.id,
    query: run.query,
    domain: run.domain,
    tools: [
      {
        name: run.product?.name ?? null,
        latencyMs: run.latencyMs,
        resultCount: run.resultCount,
        relevanceScore: run.relevanceScore,
        success: run.statusCode === 200,
      },
    ],
    createdAt: run.createdAt,
    winningTool: run.product?.name ?? null,
  }

  return NextResponse.json(sanitized, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
