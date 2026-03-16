import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma, withRetry } from '@/lib/prisma';
import { callToolAPI, BENCHMARKABLE_SLUGS, resolveProductSlug } from '@/lib/benchmark/adapters';
import { evaluateResult } from '@/lib/benchmark/evaluator';
import { BROWSE_STATUSES } from '@/lib/product-status';
import { recalculateProductScore } from '@/lib/voting';
import { createBenchmarkRunRecords } from '@/lib/ops/runner';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let body: { secret?: string; domain?: string; query?: string; tools?: string[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { secret, domain, query, tools } = body;

  // Auth
  const benchmarkSecret = process.env.BENCHMARK_SECRET;
  if (!benchmarkSecret || secret !== benchmarkSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!domain || !query) {
    return NextResponse.json(
      { error: 'Missing required fields: domain, query' },
      { status: 400 },
    );
  }

  const batchId = randomUUID();

  // Resolve tool slugs: use provided list (resolving aliases) or fall back to all benchmarkable products
  const toolSlugs = tools && tools.length > 0 ? tools.map((s: string) => resolveProductSlug(s)) : BENCHMARKABLE_SLUGS;

  // withRetry: Neon connection may be stale on first use in a warm serverless instance.
  const products = await withRetry(() => prisma.product.findMany({
    where: { slug: { in: toolSlugs }, status: { in: BROWSE_STATUSES } },
    select: { id: true, slug: true, name: true },
  }));

  if (products.length === 0) {
    return NextResponse.json({ error: 'No matching benchmarkable products found' }, { status: 404 });
  }

  const probeResults: Array<{
    query: string;
    tool: string;
    success: boolean;
    latencyMs: number | null;
    relevance: number;
    freshness: number;
    completeness: number;
    status: number;
    meta: Record<string, unknown>;
  }> = [];

  const responseResults: Array<{
    tool: string;
    latency: number;
    resultCount: number;
    relevance: number;
    freshness: number;
    completeness: number;
    success: boolean;
  }> = [];

  for (const product of products) {
    try {
      const result = await callToolAPI(product.slug, query);
      const success = result.statusCode >= 200 && result.statusCode < 300;

      let relevance = 0;
      let freshness = 0;
      let completeness = 0;

      try {
        const evaluation = await evaluateResult(
          query,
          `Benchmark for ${domain} domain`,
          result.response,
          'anthropic',
        );
        relevance = evaluation.relevance;
        freshness = evaluation.freshness;
        completeness = evaluation.completeness;
      } catch {
        // LLM evaluation failed — leave scores at 0
      }

      probeResults.push({
        query,
        tool: product.slug,
        success,
        latencyMs: result.latencyMs,
        relevance,
        freshness,
        completeness,
        status: result.statusCode,
        meta: { results: result.resultCount ?? 0 },
      });

      responseResults.push({
        tool: product.slug,
        latency: result.latencyMs,
        resultCount: result.resultCount ?? 0,
        relevance,
        freshness,
        completeness,
        success,
      });
    } catch {
      probeResults.push({
        query,
        tool: product.slug,
        success: false,
        latencyMs: null,
        relevance: 0,
        freshness: 0,
        completeness: 0,
        status: 500,
        meta: { results: 0 },
      });

      responseResults.push({
        tool: product.slug,
        latency: 0,
        resultCount: 0,
        relevance: 0,
        freshness: 0,
        completeness: 0,
        success: false,
      });
    }
  }

  // Create BenchmarkRun records with shared batchId
  await createBenchmarkRunRecords('benchmark-internal', domain, probeResults, batchId);

  // Recalculate scores for each product
  for (const product of products) {
    await recalculateProductScore(product.id);
  }

  return NextResponse.json({ batchId, results: responseResults });
}
