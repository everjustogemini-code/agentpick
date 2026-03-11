import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { callToolAPI, BENCHMARKABLE_SLUGS } from '@/lib/benchmark/adapters';
import { evaluateResult } from '@/lib/benchmark/evaluator';
import type { Prisma } from '@/generated/prisma/client';

export const maxDuration = 120;

// Rate limit: 2 sessions/day per IP (anonymous)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 2) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 2 playground sessions per day.' },
      { status: 429 },
    );
  }

  let body: {
    domain?: string;
    priorities?: string[];
    queries?: string[];
    tools?: string[];
    volume?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { domain, priorities, queries, tools, volume } = body;

  if (!domain || !queries?.length || !tools?.length) {
    return NextResponse.json(
      { error: 'Missing required fields: domain, queries, tools' },
      { status: 400 },
    );
  }

  if (queries.length > 5) {
    return NextResponse.json({ error: 'Maximum 5 queries per session' }, { status: 400 });
  }

  if (tools.length > 4) {
    return NextResponse.json({ error: 'Maximum 4 tools per session' }, { status: 400 });
  }

  // Validate tools are benchmarkable
  const validTools = tools.filter((t) => BENCHMARKABLE_SLUGS.includes(t));
  if (validTools.length === 0) {
    return NextResponse.json(
      { error: 'No valid tools selected. Available: ' + BENCHMARKABLE_SLUGS.join(', ') },
      { status: 400 },
    );
  }

  // Look up product IDs for each tool
  const products = await prisma.product.findMany({
    where: { slug: { in: validTools }, status: 'APPROVED' },
    select: { id: true, slug: true, name: true },
  });

  if (products.length === 0) {
    return NextResponse.json({ error: 'No matching products found' }, { status: 404 });
  }

  // Create session
  const session = await prisma.playgroundSession.create({
    data: {
      domain,
      config: { priorities: priorities ?? ['relevance'], volume: volume ?? 1000 },
      queries,
      tools: validTools,
      status: 'running',
    },
  });

  // Run all query × tool combinations
  const runs: Array<{
    productSlug: string;
    productName: string;
    query: string;
    queryIndex: number;
    latencyMs: number;
    resultCount: number;
    relevanceScore: number | null;
    success: boolean;
    costUsd: number;
  }> = [];

  for (let qi = 0; qi < queries.length; qi++) {
    const query = queries[qi];

    for (const product of products) {
      try {
        const result = await callToolAPI(product.slug, query);

        // Evaluate relevance
        let relevanceScore: number | null = null;
        let evaluatedBy: string | null = null;
        let evaluationReason: string | null = null;

        try {
          const evaluation = await evaluateResult(
            query,
            `Playground test for ${domain} domain`,
            result.response,
            'anthropic',
          );
          relevanceScore = evaluation.relevance;
          evaluatedBy = 'claude-haiku-4-5-20251001';
          evaluationReason = evaluation.reasoning;
        } catch {
          // LLM eval failed — skip scoring
        }

        // Store run
        await prisma.playgroundRun.create({
          data: {
            sessionId: session.id,
            productId: product.id,
            query,
            queryIndex: qi,
            statusCode: result.statusCode,
            latencyMs: result.latencyMs,
            resultCount: result.resultCount,
            rawResponse: truncateResponse(result.response) as Prisma.InputJsonValue,
            relevanceScore,
            evaluatedBy,
            evaluationReason,
            success: result.statusCode >= 200 && result.statusCode < 300,
            costUsd: result.costUsd,
          },
        });

        // Also store as TelemetryEvent
        await prisma.telemetryEvent.create({
          data: {
            agentId: await getPlaygroundAgentId(),
            productId: product.id,
            tool: product.slug,
            task: 'search',
            success: result.statusCode >= 200 && result.statusCode < 300,
            statusCode: result.statusCode,
            latencyMs: result.latencyMs,
            costUsd: result.costUsd,
            context: `playground:${domain}`,
          },
        });

        runs.push({
          productSlug: product.slug,
          productName: product.name,
          query,
          queryIndex: qi,
          latencyMs: result.latencyMs,
          resultCount: result.resultCount ?? 0,
          relevanceScore,
          success: result.statusCode >= 200 && result.statusCode < 300,
          costUsd: result.costUsd,
        });
      } catch {
        // Tool call failed entirely
        runs.push({
          productSlug: product.slug,
          productName: product.name,
          query,
          queryIndex: qi,
          latencyMs: 0,
          resultCount: 0,
          relevanceScore: null,
          success: false,
          costUsd: 0,
        });
      }
    }
  }

  // Aggregate results
  const toolSummaries: Record<string, {
    name: string;
    avgLatency: number;
    avgRelevance: number;
    successRate: number;
    totalCost: number;
    tests: number;
  }> = {};

  for (const run of runs) {
    if (!toolSummaries[run.productSlug]) {
      toolSummaries[run.productSlug] = {
        name: run.productName,
        avgLatency: 0,
        avgRelevance: 0,
        successRate: 0,
        totalCost: 0,
        tests: 0,
      };
    }
    const s = toolSummaries[run.productSlug];
    s.avgLatency += run.latencyMs;
    s.avgRelevance += run.relevanceScore ?? 0;
    s.successRate += run.success ? 1 : 0;
    s.totalCost += run.costUsd;
    s.tests++;
  }

  const rankings = Object.entries(toolSummaries)
    .map(([slug, s]) => ({
      slug,
      name: s.name,
      avgLatency: Math.round(s.avgLatency / s.tests),
      avgRelevance: s.tests > 0 ? s.avgRelevance / s.tests : 0,
      successRate: s.tests > 0 ? (s.successRate / s.tests) * 100 : 0,
      totalCost: s.totalCost,
      monthlyCost: s.totalCost * (volume ?? 1000) * 30,
      tests: s.tests,
    }))
    .sort((a, b) => b.avgRelevance - a.avgRelevance);

  // Update session with results
  await prisma.playgroundSession.update({
    where: { id: session.id },
    data: {
      status: 'completed',
      results: { rankings, runs },
      completedAt: new Date(),
    },
  });

  return NextResponse.json({
    session_id: session.id,
    status: 'completed',
    url: `/playground/${session.id}`,
    rankings,
    runs: runs.map((r) => ({
      tool: r.productSlug,
      toolName: r.productName,
      query: r.query,
      queryIndex: r.queryIndex,
      latencyMs: r.latencyMs,
      resultCount: r.resultCount,
      relevance: r.relevanceScore,
      success: r.success,
    })),
  });
}

function truncateResponse(response: unknown): Record<string, unknown> {
  const str = JSON.stringify(response);
  if (str.length > 2000) {
    return { truncated: str.slice(0, 2000) };
  }
  if (typeof response === 'object' && response !== null) {
    return response as Record<string, unknown>;
  }
  return { data: response };
}

// Get or create a shared "playground" agent for telemetry attribution
let playgroundAgentId: string | null = null;
async function getPlaygroundAgentId(): Promise<string> {
  if (playgroundAgentId) return playgroundAgentId;

  const existing = await prisma.agent.findFirst({
    where: { name: 'playground-agent' },
    select: { id: true },
  });

  if (existing) {
    playgroundAgentId = existing.id;
    return existing.id;
  }

  const agent = await prisma.agent.create({
    data: {
      apiKeyHash: 'playground-agent-internal',
      name: 'playground-agent',
      description: 'AgentPick Playground — user-initiated tool comparisons',
      orchestrator: 'agentpick-playground',
      tier: 0,
      reputationScore: 0.5,
      languages: ['en'],
    },
  });

  playgroundAgentId = agent.id;
  return agent.id;
}
