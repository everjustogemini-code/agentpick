import { prisma } from '@/lib/prisma';
import { callToolAPI, BENCHMARKABLE_SLUGS, DOMAIN_TO_TASK } from '@/lib/benchmark/adapters';
import { evaluateResult } from '@/lib/benchmark/evaluator';
import { BROWSE_STATUSES } from '@/lib/product-status';

export const maxDuration = 300; // 5 min max for Vercel

function verifySecret(request: Request) {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    throw new Error('Unauthorized');
  }
}

function truncateJson(data: unknown, maxLen: number): unknown {
  const str = JSON.stringify(data);
  if (str.length <= maxLen) return data;
  return JSON.parse(str.slice(0, maxLen - 1) + '}');
}

export async function GET(request: Request) {
  try {
    verifySecret(request);
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Pick 5 random active benchmark agents (varied domains)
    const allAgents = await prisma.benchmarkAgent.findMany({
      where: { isActive: true },
      include: { agent: { select: { id: true, name: true } } },
    });

    // Shuffle and pick 5 from different domains
    const shuffled = allAgents.sort(() => Math.random() - 0.5);
    const seenDomains = new Set<string>();
    const agents: typeof shuffled = [];
    for (const a of shuffled) {
      if (agents.length >= 5) break;
      if (!seenDomains.has(a.domain)) {
        agents.push(a);
        seenDomains.add(a.domain);
      }
    }
    // Fill remaining slots if fewer than 5 unique domains
    for (const a of shuffled) {
      if (agents.length >= 5) break;
      if (!agents.includes(a)) agents.push(a);
    }

    // Get benchmarkable products
    const products = await prisma.product.findMany({
      where: {
        status: { in: BROWSE_STATUSES },
        slug: { in: BENCHMARKABLE_SLUGS },
      },
      select: { id: true, slug: true },
    });

    if (products.length === 0) {
      return Response.json({ error: 'No benchmarkable products found', tests_run: 0 });
    }

    let totalTests = 0;
    const errors: string[] = [];

    for (const agent of agents) {
      // 2. Pick 2 random queries from this agent's domain (varied complexity)
      const queries = await prisma.benchmarkQuery.findMany({
        where: { domain: agent.domain, isActive: true },
      });

      const shuffledQueries = queries.sort(() => Math.random() - 0.5);
      // Pick 1 simple/medium and 1 medium/complex for variety
      const selectedQueries = shuffledQueries.slice(0, 2);

      for (const query of selectedQueries) {
        // 3. Test against up to 4 random tools
        const shuffledProducts = products.sort(() => Math.random() - 0.5).slice(0, 4);

        for (const product of shuffledProducts) {
          try {
            // Execute the actual API call
            const result = await callToolAPI(product.slug, query.query);

            // Evaluate relevance with LLM
            const evaluation = await evaluateResult(
              query.query,
              query.intent,
              result.response,
              agent.modelProvider,
            );

            const success = result.statusCode >= 200 && result.statusCode < 300;

            // Store benchmark run
            await prisma.benchmarkRun.create({
              data: {
                benchmarkAgentId: agent.id,
                queryId: query.id,
                productId: product.id,
                query: query.query,
                statusCode: result.statusCode,
                latencyMs: result.latencyMs,
                resultCount: result.resultCount,
                rawResponse: truncateJson(result.response, 2000) as object,
                relevanceScore: evaluation.relevance,
                freshnessScore: evaluation.freshness,
                completenessScore: evaluation.completeness,
                evaluatedBy: 'claude-haiku-4',
                evaluationReason: evaluation.reasoning,
                domain: agent.domain,
                complexity: query.complexity,
                success,
                costUsd: result.costUsd,
              },
            });

            // Also store as TelemetryEvent (feeds existing ranking)
            await prisma.telemetryEvent.create({
              data: {
                agentId: agent.agent.id,
                productId: product.id,
                tool: product.slug,
                task: DOMAIN_TO_TASK[agent.domain] || 'search',
                success,
                statusCode: result.statusCode,
                latencyMs: result.latencyMs,
                costUsd: result.costUsd,
                context: `benchmark:${agent.domain}:${query.complexity}`,
              },
            });

            totalTests++;
          } catch (error) {
            const msg = `${product.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(msg);
          }
        }
      }

      // Update agent stats
      await prisma.benchmarkAgent.update({
        where: { id: agent.id },
        data: {
          lastRunAt: new Date(),
          totalTests: { increment: totalTests },
        },
      });
    }

    return Response.json({
      tests_run: totalTests,
      agents_used: agents.length,
      products_tested: products.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });
  } catch (error) {
    console.error('Benchmark run failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Benchmark run failed' },
      { status: 500 },
    );
  }
}
