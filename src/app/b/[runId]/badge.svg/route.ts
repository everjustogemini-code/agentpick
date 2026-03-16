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
    return new NextResponse('not found', { status: 404 })
  }

  const winningTool = run.product?.name ?? 'unknown'
  const latencyMs = run.latencyMs ?? 0
  const label = `${winningTool} · ${latencyMs}ms`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="20">
  <rect width="80" height="20" fill="#555"/>
  <rect x="80" width="130" height="20" fill="#2ea44f"/>
  <text x="8" y="14" fill="#fff" font-family="sans-serif" font-size="11">agentpick</text>
  <text x="88" y="14" fill="#fff" font-family="sans-serif" font-size="11">${label}</text>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, s-maxage=3600',
    },
  })
}
