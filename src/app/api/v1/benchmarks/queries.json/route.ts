import { prisma, withRetry } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const queries = await withRetry(() => prisma.benchmarkQuery.findMany({
    where: { isActive: true },
    select: {
      domain: true,
      complexity: true,
      query: true,
      intent: true,
    },
    orderBy: [{ domain: 'asc' }, { complexity: 'asc' }],
  }));

  // Group by domain
  const grouped: Record<string, { complexity: string; query: string; intent: string | null }[]> = {};
  for (const q of queries) {
    if (!grouped[q.domain]) grouped[q.domain] = [];
    grouped[q.domain].push({
      complexity: q.complexity,
      query: q.query,
      intent: q.intent,
    });
  }

  return NextResponse.json(
    {
      version: '1.0',
      generated: new Date().toISOString(),
      total: queries.length,
      domains: grouped,
    },
    {
      headers: {
        'Content-Disposition': 'attachment; filename="benchmark-queries.json"',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
}
