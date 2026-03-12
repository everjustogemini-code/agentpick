import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { parseCode } from '@/lib/xray-parser';
import { RANKING_STATUSES } from '@/lib/product-status';
import type { Prisma } from '@/generated/prisma/client';

export const maxDuration = 30;

// Rate limit: 5 analyses per day per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 5 X-Ray analyses per day.' },
      { status: 429 },
    );
  }

  let body: { code?: string; format?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { code, format = 'text' } = body;

  if (!code || code.length < 5) {
    return NextResponse.json({ error: 'Code input is required (min 5 chars)' }, { status: 400 });
  }

  if (code.length > 10000) {
    return NextResponse.json({ error: 'Code input too long (max 10000 chars)' }, { status: 400 });
  }

  // Parse the code
  const parsed = parseCode(code, format);

  if (parsed.tools.length === 0) {
    return NextResponse.json({
      error: 'No tools detected. Try pasting your agent code, tool config, or a list of tool names.',
    }, { status: 400 });
  }

  // Look up each detected tool in our rankings
  const slugs = parsed.tools.map(t => t.slug).filter((s): s is string => s !== null);
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, status: { in: RANKING_STATUSES } },
    select: {
      slug: true,
      name: true,
      category: true,
      weightedScore: true,
      totalVotes: true,
      successRate: true,
      avgLatencyMs: true,
    },
  });

  const productMap = new Map(products.map(p => [p.slug, p]));

  // For each detected tool, get its rank and find top alternative
  const detectedTools: Array<{
    name: string;
    slug: string | null;
    category: string | null;
    rank: number | null;
    score: number | null;
    successRate: number | null;
    avgLatencyMs: number | null;
  }> = [];

  for (const tool of parsed.tools) {
    const product = tool.slug ? productMap.get(tool.slug) : null;
    let rank: number | null = null;

    if (product) {
      const higherRanked = await prisma.product.count({
        where: {
          status: { in: RANKING_STATUSES },
          category: product.category,
          weightedScore: { gt: product.weightedScore },
        },
      });
      rank = higherRanked + 1;
    }

    detectedTools.push({
      name: tool.name,
      slug: tool.slug,
      category: product?.category ?? null,
      rank,
      score: product?.weightedScore ?? null,
      successRate: product?.successRate ?? null,
      avgLatencyMs: product?.avgLatencyMs ?? null,
    });
  }

  // Generate issues and recommendations
  const issues: Array<{
    severity: 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string;
    impact: string;
  }> = [];

  const recommendations: Array<{
    from: string;
    to: string | null;
    toSlug: string | null;
    improvement: string;
  }> = [];

  // Check each tool for issues
  for (const tool of detectedTools) {
    if (!tool.slug || !tool.category) continue;

    // Find the #1 in the same category
    const topInCategory = await prisma.product.findFirst({
      where: {
        status: { in: RANKING_STATUSES },
        category: tool.category as 'search_research',
        slug: { not: tool.slug },
      },
      orderBy: { weightedScore: 'desc' },
      select: { name: true, slug: true, weightedScore: true, avgLatencyMs: true },
    });

    if (tool.rank && tool.rank > 3 && topInCategory) {
      const scoreDiff = topInCategory.weightedScore - (tool.score ?? 0);
      const pctBetter = tool.score ? Math.round((scoreDiff / tool.score) * 100) : 0;

      issues.push({
        severity: tool.rank > 5 ? 'high' : 'medium',
        title: `${tool.name} ranks #${tool.rank} in ${tool.category.replace('_', ' ')}`,
        description: `${topInCategory.name} (#1) has ${pctBetter}% higher score.`,
        impact: tool.rank > 5 ? 'High' : 'Medium',
      });

      recommendations.push({
        from: tool.name,
        to: topInCategory.name,
        toSlug: topInCategory.slug,
        improvement: `+${pctBetter}% quality score`,
      });
    }

    // Check latency
    if (tool.avgLatencyMs && tool.avgLatencyMs > 1500 && topInCategory?.avgLatencyMs) {
      const speedup = (tool.avgLatencyMs / topInCategory.avgLatencyMs).toFixed(1);
      if (Number(speedup) > 2) {
        issues.push({
          severity: 'low',
          title: `Slow: ${tool.name} avg ${tool.avgLatencyMs}ms`,
          description: `${topInCategory.name} does ${topInCategory.avgLatencyMs}ms (${speedup}x faster).`,
          impact: 'Low',
        });
      }
    }
  }

  // Check for missing fallback
  const categories = new Set(detectedTools.filter(t => t.category).map(t => t.category));
  for (const category of categories) {
    const toolsInCategory = detectedTools.filter(t => t.category === category);
    if (toolsInCategory.length === 1) {
      issues.push({
        severity: 'medium',
        title: `No fallback for ${category?.replace('_', ' ')}`,
        description: `If ${toolsInCategory[0].name} goes down, your agent has no backup.`,
        impact: 'High',
      });
    }
  }

  // Calculate health score
  let healthScore = 10;
  for (const issue of issues) {
    if (issue.severity === 'high') healthScore -= 2;
    else if (issue.severity === 'medium') healthScore -= 1.5;
    else if (issue.severity === 'low') healthScore -= 0.5;
  }
  // Bonus for using top-ranked tools
  for (const tool of detectedTools) {
    if (tool.rank && tool.rank <= 3) healthScore += 0.5;
  }
  healthScore = Math.max(0, Math.min(10, healthScore));
  healthScore = Math.round(healthScore * 10) / 10;

  // Save report
  const report = await prisma.xrayReport.create({
    data: {
      codeInput: code.slice(0, 5000),
      format,
      detectedTools: detectedTools as unknown as Prisma.InputJsonValue,
      framework: parsed.framework,
      inferredDomain: parsed.inferredDomain,
      healthScore,
      issues: issues as unknown as Prisma.InputJsonValue,
      recommendations: recommendations as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({
    report_id: report.id,
    url: `/xray/${report.id}`,
    health_score: healthScore,
    detected_tools: detectedTools,
    framework: parsed.framework,
    inferred_domain: parsed.inferredDomain,
    issues,
    recommendations,
  });
}
