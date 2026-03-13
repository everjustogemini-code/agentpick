import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * GET /api/v1/router/latest
 * Public (no auth) — returns the most recent RouterCall for the homepage live routing example.
 * Strips developer-identifying data. Cached for 15s.
 */
export async function GET() {
  try {
    const call = await prisma.routerCall.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        query: true,
        toolUsed: true,
        latencyMs: true,
        costUsd: true,
        capability: true,
        aiClassification: true,
        strategyUsed: true,
        fallbackUsed: true,
        success: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { call: call ?? null },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
        },
      },
    );
  } catch {
    return NextResponse.json({ call: null }, { status: 200 });
  }
}
