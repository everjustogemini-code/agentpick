import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { callToolAPI, BENCHMARKABLE_SLUGS } from '@/lib/benchmark/adapters';
import { evaluateResult } from '@/lib/benchmark/evaluator';
import type { Prisma } from '@/generated/prisma/client';

export const maxDuration = 120;

// Rate limit: 3 arena sessions/day per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

interface ArenaRequest {
  scenario: string;
  current_tools: string[];
  queries: string[];
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: 'Rate limit exceeded. Maximum 3 arena sessions per day.' },
      { status: 429 },
    );
  }

  let body: ArenaRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { scenario, current_tools, queries } = body;

  if (!scenario || !current_tools?.length || !queries?.length) {
    return Response.json(
      { error: 'Missing required fields: scenario, current_tools, queries' },
      { status: 400 },
    );
  }

  if (queries.length > 5) {
    return Response.json({ error: 'Maximum 5 queries' }, { status: 400 });
  }

  if (current_tools.length > 4) {
    return Response.json({ error: 'Maximum 4 tools' }, { status: 400 });
  }

  // Validate user's tools are benchmarkable
  const validUserTools = current_tools.filter((t) => BENCHMARKABLE_SLUGS.includes(t));
  if (validUserTools.length === 0) {
    return Response.json(
      { error: 'No valid tools selected. Available: ' + BENCHMARKABLE_SLUGS.join(', ') },
      { status: 400 },
    );
  }

  // Look up products for user's tools
  const userProducts = await prisma.product.findMany({
    where: { slug: { in: validUserTools } },
    select: { id: true, slug: true, name: true },
  });

  if (userProducts.length === 0) {
    return Response.json({ error: 'No matching products found' }, { status: 404 });
  }

  // Get optimal stack from benchmark cache
  const optimalTools = await getOptimalStack(scenario, validUserTools);

  // Create arena session
  const session = await prisma.playgroundSession.create({
    data: {
      domain: scenario,
      config: { type: 'arena', current_tools: validUserTools, optimal_tools: optimalTools.map(t => t.slug) },
      queries,
      tools: [...validUserTools, ...optimalTools.map(t => t.slug)],
      status: 'running',
    },
  });

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      try {
        // Step 1: Preparing
        send('step', { step: 'preparing', status: 'complete', message: 'Queries loaded' });
        send('step', { step: 'loading_context', status: 'complete', domain: scenario });

        // Step 2: Test user's stack
        send('step', { step: 'testing_user_stack', status: 'started', tools: validUserTools });

        const userResults: RunResult[] = [];

        for (let qi = 0; qi < queries.length; qi++) {
          const query = queries[qi];
          for (const product of userProducts) {
            try {
              const result = await callToolAPI(product.slug, query);
              let relevanceScore: number | null = null;
              let evaluationReason: string | null = null;

              try {
                const evaluation = await evaluateResult(
                  query, `Arena test for ${scenario}`, result.response, 'anthropic',
                );
                relevanceScore = evaluation.relevance;
                evaluationReason = evaluation.reasoning;
              } catch { /* skip */ }

              const runResult: RunResult = {
                tool: product.slug,
                toolName: product.name,
                query,
                queryIndex: qi,
                latencyMs: result.latencyMs,
                resultCount: result.resultCount ?? 0,
                relevance: relevanceScore,
                success: result.statusCode >= 200 && result.statusCode < 300,
                costUsd: result.costUsd,
              };

              userResults.push(runResult);

              send('result', {
                phase: 'user_stack',
                ...runResult,
              });

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
                  evaluatedBy: relevanceScore != null ? 'claude-haiku-4-5-20251001' : null,
                  evaluationReason,
                  success: result.statusCode >= 200 && result.statusCode < 300,
                  costUsd: result.costUsd,
                },
              });
            } catch {
              userResults.push({
                tool: product.slug,
                toolName: product.name,
                query,
                queryIndex: qi,
                latencyMs: 0,
                resultCount: 0,
                relevance: null,
                success: false,
                costUsd: 0,
              });
              send('result', {
                phase: 'user_stack',
                tool: product.slug,
                toolName: product.name,
                query,
                queryIndex: qi,
                latencyMs: 0,
                resultCount: 0,
                relevance: null,
                success: false,
              });
            }
          }
        }

        send('step', { step: 'testing_user_stack', status: 'complete' });

        // Step 3: Get optimal stack results (from cache or live)
        send('step', { step: 'testing_optimal', status: 'started', tools: optimalTools.map(t => t.slug) });

        const optimalResults: RunResult[] = [];

        for (let qi = 0; qi < queries.length; qi++) {
          const query = queries[qi];
          for (const tool of optimalTools) {
            // First try benchmark cache
            const cached = await prisma.benchmarkRun.findFirst({
              where: {
                productId: tool.id,
                domain: scenario,
                relevanceScore: { not: null },
              },
              orderBy: { createdAt: 'desc' },
              select: {
                latencyMs: true,
                resultCount: true,
                relevanceScore: true,
                success: true,
                costUsd: true,
              },
            });

            if (cached) {
              const cacheResult: RunResult = {
                tool: tool.slug,
                toolName: tool.name,
                query,
                queryIndex: qi,
                latencyMs: cached.latencyMs,
                resultCount: cached.resultCount ?? 0,
                relevance: cached.relevanceScore,
                success: cached.success,
                costUsd: cached.costUsd ?? 0,
                fromCache: true,
              };
              optimalResults.push(cacheResult);
              send('result', { phase: 'optimal_stack', ...cacheResult });
            } else {
              // No cache — call live
              try {
                const result = await callToolAPI(tool.slug, query);
                let relevanceScore: number | null = null;
                try {
                  const evaluation = await evaluateResult(
                    query, `Arena optimal test for ${scenario}`, result.response, 'anthropic',
                  );
                  relevanceScore = evaluation.relevance;
                } catch { /* skip */ }

                const liveResult: RunResult = {
                  tool: tool.slug,
                  toolName: tool.name,
                  query,
                  queryIndex: qi,
                  latencyMs: result.latencyMs,
                  resultCount: result.resultCount ?? 0,
                  relevance: relevanceScore,
                  success: result.statusCode >= 200 && result.statusCode < 300,
                  costUsd: result.costUsd,
                  fromCache: false,
                };
                optimalResults.push(liveResult);
                send('result', { phase: 'optimal_stack', ...liveResult });

                await prisma.playgroundRun.create({
                  data: {
                    sessionId: session.id,
                    productId: tool.id,
                    query,
                    queryIndex: qi,
                    statusCode: result.statusCode,
                    latencyMs: result.latencyMs,
                    resultCount: result.resultCount,
                    rawResponse: truncateResponse(result.response) as Prisma.InputJsonValue,
                    relevanceScore,
                    evaluatedBy: relevanceScore != null ? 'claude-haiku-4-5-20251001' : null,
                    success: result.statusCode >= 200 && result.statusCode < 300,
                    costUsd: result.costUsd,
                  },
                });
              } catch {
                optimalResults.push({
                  tool: tool.slug,
                  toolName: tool.name,
                  query,
                  queryIndex: qi,
                  latencyMs: 0,
                  resultCount: 0,
                  relevance: null,
                  success: false,
                  costUsd: 0,
                  fromCache: false,
                });
              }
            }
          }
        }

        send('step', { step: 'testing_optimal', status: 'complete' });

        // Step 4: Evaluate & compute
        send('step', { step: 'evaluating', status: 'complete' });

        // Compute summaries
        const userSummary = computeSummary(userResults);
        const optimalSummary = computeSummary(optimalResults);

        // Delta calculations: positive = optimal is better, negative = optimal is worse
        // Latency: lower is better, so (user - optimal) / user * 100 → positive means optimal is faster
        const latencyPct = userSummary.avgLatency > 0 && optimalSummary.avgLatency > 0
          ? Math.round(((userSummary.avgLatency - optimalSummary.avgLatency) / userSummary.avgLatency) * 100)
          : null;
        // Quality: higher is better, so (optimal - user) / user * 100 → positive means optimal has better quality
        const qualityPct = userSummary.avgRelevance > 0 && optimalSummary.avgRelevance > 0
          ? Math.round(((optimalSummary.avgRelevance - userSummary.avgRelevance) / userSummary.avgRelevance) * 100)
          : null;
        // Cost: lower is better, so (user - optimal) / user * 100 → positive means optimal saves money
        const costPct = userSummary.avgCost > 0 && optimalSummary.avgCost > 0
          ? Math.round(((userSummary.avgCost - optimalSummary.avgCost) / userSummary.avgCost) * 100)
          : null;

        const delta = {
          latencyPct,
          latencyDelta: latencyPct != null
            ? (latencyPct > 0 ? `${latencyPct}% faster` : latencyPct < 0 ? `${Math.abs(latencyPct)}% slower` : 'same speed')
            : '—',
          qualityPct,
          qualityDelta: qualityPct != null
            ? (qualityPct > 0 ? `${qualityPct}% better` : qualityPct < 0 ? `${Math.abs(qualityPct)}% worse` : 'same quality')
            : '—',
          costPct,
          costDelta: costPct != null
            ? (costPct > 0 ? `saves ${costPct}%` : costPct < 0 ? `costs ${Math.abs(costPct)}% more` : 'same cost')
            : '—',
        };

        send('step', { step: 'computing_savings', status: 'complete', delta });

        // Update session
        await prisma.playgroundSession.update({
          where: { id: session.id },
          data: {
            status: 'completed',
            results: {
              userSummary,
              optimalSummary,
              delta,
              userResults,
              optimalResults,
              optimalTools: optimalTools.map(t => ({ slug: t.slug, name: t.name })),
            } as unknown as Prisma.InputJsonValue,
            completedAt: new Date(),
          },
        });

        send('step', { step: 'generating_report', status: 'complete' });

        // Final complete event
        send('complete', {
          session_id: session.id,
          url: `/arena/${session.id}`,
          userSummary,
          optimalSummary,
          delta,
          optimalTools: optimalTools.map(t => ({ slug: t.slug, name: t.name })),
        });
      } catch (err) {
        send('error', { message: err instanceof Error ? err.message : 'Unknown error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

interface RunResult {
  tool: string;
  toolName: string;
  query: string;
  queryIndex: number;
  latencyMs: number;
  resultCount: number;
  relevance: number | null;
  success: boolean;
  costUsd: number;
  fromCache?: boolean;
}

function computeSummary(results: RunResult[]) {
  if (results.length === 0) {
    return { avgLatency: 0, avgRelevance: 0, avgCost: 0, successRate: 0, tests: 0 };
  }
  const totalLatency = results.reduce((s, r) => s + r.latencyMs, 0);
  const scored = results.filter(r => r.relevance != null);
  const totalRelevance = scored.reduce((s, r) => s + (r.relevance ?? 0), 0);
  const totalCost = results.reduce((s, r) => s + r.costUsd, 0);
  const successCount = results.filter(r => r.success).length;

  return {
    avgLatency: Math.round(totalLatency / results.length),
    avgRelevance: scored.length > 0 ? totalRelevance / scored.length : 0,
    avgCost: totalCost / results.length,
    successRate: Math.round((successCount / results.length) * 100),
    tests: results.length,
  };
}

/**
 * Get the optimal alternative tools for the user's scenario.
 * Picks the top-performing tool from benchmark data for each capability.
 */
async function getOptimalStack(
  domain: string,
  userTools: string[],
): Promise<{ id: string; slug: string; name: string }[]> {
  // Get all benchmarkable products EXCEPT user's current tools
  const candidates = await prisma.product.findMany({
    where: {
      slug: { in: BENCHMARKABLE_SLUGS.filter(s => !userTools.includes(s)) },
    },
    select: { id: true, slug: true, name: true },
  });

  if (candidates.length === 0) return [];

  // Score each candidate based on benchmark data for this domain
  const scored: { product: typeof candidates[0]; score: number }[] = [];

  for (const candidate of candidates) {
    const runs = await prisma.benchmarkRun.findMany({
      where: {
        productId: candidate.id,
        domain,
        relevanceScore: { not: null },
      },
      select: { relevanceScore: true, latencyMs: true, costUsd: true, success: true },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    if (runs.length === 0) {
      // No domain-specific data — get any benchmark data
      const anyRuns = await prisma.benchmarkRun.findMany({
        where: { productId: candidate.id, relevanceScore: { not: null } },
        select: { relevanceScore: true, latencyMs: true, costUsd: true, success: true },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      if (anyRuns.length > 0) {
        scored.push({ product: candidate, score: computeToolScore(anyRuns) * 0.7 }); // discount for non-domain data
      } else {
        scored.push({ product: candidate, score: 0.5 }); // default score
      }
    } else {
      scored.push({ product: candidate, score: computeToolScore(runs) });
    }
  }

  // Return top 2-3 tools
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(3, userTools.length + 1))
    .map(s => s.product);
}

function computeToolScore(
  runs: { relevanceScore: number | null; latencyMs: number; costUsd: number | null; success: boolean }[],
): number {
  const avgRelevance = runs.reduce((s, r) => s + (r.relevanceScore ?? 0), 0) / runs.length;
  const avgLatency = runs.reduce((s, r) => s + r.latencyMs, 0) / runs.length;
  const costs = runs.filter(r => r.costUsd != null).map(r => r.costUsd!);
  const avgCost = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0.001;
  const successRate = runs.filter(r => r.success).length / runs.length;

  // Score: relevance × 0.4 + (1/latency_normalized) × 0.2 + (1/cost_normalized) × 0.2 + success × 0.2
  const latencyScore = Math.max(0, 1 - Math.min(avgLatency, 5000) / 5000);
  const costScore = Math.max(0, 1 - Math.min(avgCost, 0.01) / 0.01);

  return (avgRelevance / 5) * 0.4 + latencyScore * 0.2 + costScore * 0.2 + successRate * 0.2;
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
