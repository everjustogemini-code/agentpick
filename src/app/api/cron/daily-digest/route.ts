import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  // Check if digest already exists for today
  const existing = await prisma.dailyDigest.findUnique({ where: { date: today } });
  if (existing) {
    return NextResponse.json({ status: 'already_exists', id: existing.id });
  }

  // Get today's votes
  const todayVotes = await prisma.vote.findMany({
    where: { createdAt: { gte: yesterday, lt: today } },
    include: { product: { select: { name: true, slug: true, category: true } } },
  });

  // Get products with score changes (compare current vs yesterday snapshot)
  const products = await prisma.product.findMany({
    where: { status: 'APPROVED' },
    orderBy: { weightedScore: 'desc' },
    select: { id: true, name: true, slug: true, weightedScore: true, totalVotes: true, category: true },
  });

  // Simple risers/fallers based on recent vote activity
  const votesByProduct = new Map<string, number>();
  for (const vote of todayVotes) {
    const count = votesByProduct.get(vote.productId) ?? 0;
    votesByProduct.set(vote.productId, count + (vote.signal === 'UPVOTE' ? 1 : -1));
  }

  const risers = [...votesByProduct.entries()]
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => {
      const p = products.find((p) => p.id === id);
      return { name: p?.name ?? id, slug: p?.slug ?? '', votes: count };
    });

  const fallers = [...votesByProduct.entries()]
    .filter(([, count]) => count < 0)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 5)
    .map(([id, count]) => {
      const p = products.find((p) => p.id === id);
      return { name: p?.name ?? id, slug: p?.slug ?? '', votes: count };
    });

  // New entries (products that got their first vote today)
  const newEntries = todayVotes
    .filter((v) => {
      const p = products.find((p) => p.id === v.productId);
      return p && p.totalVotes <= 5;
    })
    .map((v) => ({ name: v.product.name, slug: v.product.slug }))
    .filter((v, i, arr) => arr.findIndex((a) => a.slug === v.slug) === i)
    .slice(0, 5);

  // Benchmark stats
  const benchmarkTests = await prisma.benchmarkRun.count({
    where: { createdAt: { gte: yesterday, lt: today } },
  });

  // Playground stats
  const playgroundSessions = await prisma.playgroundSession.count({
    where: { createdAt: { gte: yesterday, lt: today }, status: 'completed' },
  });

  // Generate twitter draft
  const topRiser = risers[0];
  const twitterDraft = topRiser
    ? `Today on AgentPick: ${topRiser.name} gained ${topRiser.votes} agent votes. ${benchmarkTests} benchmark tests run. ${playgroundSessions} playground sessions. Full data: agentpick.dev`
    : `${todayVotes.length} agent votes cast today on AgentPick. ${benchmarkTests} benchmark tests. ${playgroundSessions} playground sessions. agentpick.dev`;

  const digest = await prisma.dailyDigest.create({
    data: {
      date: today,
      risers: risers as unknown as Prisma.InputJsonValue,
      fallers: fallers as unknown as Prisma.InputJsonValue,
      newEntries: newEntries as unknown as Prisma.InputJsonValue,
      benchmarkStats: { tests_today: benchmarkTests } as Prisma.InputJsonValue,
      playgroundStats: { sessions_today: playgroundSessions } as Prisma.InputJsonValue,
      twitterDraft,
      status: 'draft',
    },
  });

  return NextResponse.json({ status: 'created', id: digest.id, risers: risers.length, fallers: fallers.length });
}
