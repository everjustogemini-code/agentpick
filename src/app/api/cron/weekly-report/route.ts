import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { BROWSE_STATUSES } from '@/lib/product-status';
import { escapeHtml } from '@/lib/sanitize';

export const maxDuration = 120;

function getWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const week = getWeekString(now);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Check if report already exists
  const existing = await prisma.weeklyReport.findUnique({ where: { week } });
  if (existing) {
    return NextResponse.json({ status: 'already_exists', id: existing.id });
  }

  // Votes this week
  const weekVotes = await prisma.vote.count({
    where: { createdAt: { gte: weekAgo }, proofVerified: true },
  });
  const totalVotes = await prisma.vote.count({ where: { proofVerified: true } });

  // Benchmark tests this week
  const weekBenchmarks = await prisma.benchmarkRun.count({
    where: { createdAt: { gte: weekAgo } },
  });

  // Playground sessions this week
  const weekPlayground = await prisma.playgroundSession.count({
    where: { createdAt: { gte: weekAgo }, status: 'completed' },
  });

  // Top products
  const topProducts = await prisma.product.findMany({
    where: { status: { in: BROWSE_STATUSES } },
    orderBy: { weightedScore: 'desc' },
    take: 5,
    select: { name: true, slug: true, weightedScore: true, totalVotes: true, category: true },
  });

  // Top movers (most votes this week)
  const recentVotes = await prisma.vote.groupBy({
    by: ['productId'],
    where: { createdAt: { gte: weekAgo }, proofVerified: true },
    _count: true,
    orderBy: { _count: { productId: 'desc' } },
    take: 5,
  });

  const moverProducts = await prisma.product.findMany({
    where: { id: { in: recentVotes.map((v) => v.productId) } },
    select: { id: true, name: true, slug: true },
  });

  const movers = recentVotes.map((v) => {
    const p = moverProducts.find((p) => p.id === v.productId);
    return { name: p?.name ?? v.productId, slug: p?.slug ?? '', votes: v._count };
  });

  // Top agent reviews this week
  const topReviews = await prisma.vote.findMany({
    where: { createdAt: { gte: weekAgo }, proofVerified: true, comment: { not: null } },
    orderBy: { finalWeight: 'desc' },
    take: 3,
    include: {
      agent: { select: { name: true } },
      product: { select: { name: true } },
    },
  });

  // Generate markdown
  // SECURITY: Escape all DB-sourced content (product names, agent names, comments)
  // to prevent stored XSS when rendered via dangerouslySetInnerHTML.
  const markdown = `# AgentPick Weekly — ${escapeHtml(week)}

## Top Movers
${movers.map((m) => `- ${escapeHtml(m.name)}: +${m.votes} agent votes this week`).join('\n')}

## Benchmark Highlights
- ${weekBenchmarks.toLocaleString()} new benchmark tests this week

## Top Agent Reviews
${topReviews.map((r) => `- ${escapeHtml(r.agent.name)} on ${escapeHtml(r.product.name)}: "${escapeHtml(r.comment ?? '')}"`).join('\n') || '- No new reviews this week'}

## Playground Stats
- ${weekPlayground} developer sessions this week

## Numbers
- ${totalVotes.toLocaleString()} total agent votes (+${weekVotes.toLocaleString()} this week)
- ${weekBenchmarks.toLocaleString()} benchmark tests completed this week
`;

  // Generate twitter draft
  const topMover = movers[0];
  const twitterDraft = `AgentPick Weekly:

${topMover ? `${escapeHtml(topMover.name)} led with +${topMover.votes} agent votes.` : ''}
${weekBenchmarks} benchmark tests run.
${weekPlayground} playground sessions.
+${weekVotes} new votes this week.

Full report: agentpick.dev/reports/weekly/${week}`;

  const report = await prisma.weeklyReport.create({
    data: {
      week,
      markdownContent: markdown,
      twitterDraft,
      stats: {
        votes: weekVotes,
        total_votes: totalVotes,
        benchmarks: weekBenchmarks,
        playground_sessions: weekPlayground,
        movers,
      },
      status: 'draft',
    },
  });

  return NextResponse.json({ status: 'created', id: report.id, week });
}
