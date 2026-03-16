import { prisma, withRetry } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  // Pick a random interesting benchmark run (has evaluation, good relevance)
  const count = await withRetry(() => prisma.benchmarkRun.count({
    where: { success: true, relevanceScore: { gte: 3.0 } },
  }));

  if (count === 0) {
    return NextResponse.json({ error: 'No replays available' }, { status: 404 });
  }

  const skip = Math.floor(Math.random() * count);
  const run = await withRetry(() => prisma.benchmarkRun.findFirst({
    where: { success: true, relevanceScore: { gte: 3.0 } },
    skip,
    select: { id: true },
  }));

  if (!run) {
    return NextResponse.json({ error: 'No replays available' }, { status: 404 });
  }

  return NextResponse.json({ id: run.id, url: `/replay/${run.id}` });
}
