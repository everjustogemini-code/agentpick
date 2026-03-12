import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { RANKING_STATUSES } from '@/lib/product-status';
import { hashApiKey } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
  }

  // Find agent by API key hash
  const hash = hashApiKey(apiKey);
  const agent = await prisma.agent.findFirst({
    where: { apiKeyHash: hash },
    select: { id: true, name: true },
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  // Get agent's telemetry — which tools they've been using
  const telemetry = await prisma.telemetryEvent.findMany({
    where: { agentId: agent.id, productId: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: {
      product: { select: { slug: true, name: true, category: true, weightedScore: true } },
    },
  });

  if (telemetry.length === 0) {
    return NextResponse.json({
      agent: agent.name,
      message: 'No telemetry data found. Start using tools to get a self-diagnosis.',
      tools_used: [],
      issues: [],
      recommendations: [],
    });
  }

  // Aggregate tool usage
  const toolUsage = new Map<string, {
    slug: string;
    name: string;
    category: string;
    score: number;
    calls: number;
    successes: number;
    totalLatency: number;
  }>();

  for (const event of telemetry) {
    if (!event.product) continue;
    const key = event.product.slug;
    const existing = toolUsage.get(key) ?? {
      slug: event.product.slug,
      name: event.product.name,
      category: event.product.category,
      score: event.product.weightedScore,
      calls: 0,
      successes: 0,
      totalLatency: 0,
    };
    existing.calls++;
    if (event.success) existing.successes++;
    existing.totalLatency += event.latencyMs ?? 0;
    toolUsage.set(key, existing);
  }

  const toolsUsed = [...toolUsage.values()].map(t => ({
    ...t,
    successRate: t.calls > 0 ? (t.successes / t.calls) * 100 : 0,
    avgLatency: t.calls > 0 ? Math.round(t.totalLatency / t.calls) : 0,
  }));

  // For each tool, find the top alternative
  const issues: Array<{ severity: string; title: string; description: string }> = [];
  const recommendations: Array<{ from: string; to: string; toSlug: string; improvement: string }> = [];

  for (const tool of toolsUsed) {
    const topInCategory = await prisma.product.findFirst({
      where: {
        status: { in: RANKING_STATUSES },
        category: tool.category as 'search_research',
        slug: { not: tool.slug },
      },
      orderBy: { weightedScore: 'desc' },
      select: { name: true, slug: true, weightedScore: true },
    });

    if (topInCategory && topInCategory.weightedScore > tool.score + 1) {
      const diff = Math.round(((topInCategory.weightedScore - tool.score) / tool.score) * 100);
      issues.push({
        severity: diff > 30 ? 'high' : 'medium',
        title: `${tool.name} is not the top choice in ${tool.category.replace('_', ' ')}`,
        description: `${topInCategory.name} scores ${diff}% higher in benchmarks.`,
      });
      recommendations.push({
        from: tool.name,
        to: topInCategory.name,
        toSlug: topInCategory.slug,
        improvement: `+${diff}% quality`,
      });
    }

    if (tool.successRate < 95) {
      issues.push({
        severity: 'high',
        title: `Low success rate for ${tool.name}: ${tool.successRate.toFixed(1)}%`,
        description: `${tool.calls - tool.successes} failed calls out of ${tool.calls} total.`,
      });
    }
  }

  return NextResponse.json({
    agent: agent.name,
    tools_used: toolsUsed,
    total_calls: telemetry.length,
    issues,
    recommendations,
  });
}
