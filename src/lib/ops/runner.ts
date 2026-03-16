import { randomUUID } from "crypto";
import { ensureOpsSettings, generateQuerySet, getBenchmarkAgentById } from "./data";
import { prisma } from "./prisma";
import { runToolProbe } from "./service-probes";
import { getFrequencyMs } from "./utils";
import { DOMAIN_DEFINITIONS } from "./constants";
import { recalculateProductScore } from "@/lib/voting";
import { calculateReputation } from "@/lib/reputation";
import { calculateDiversity } from "@/lib/sybil";
import { callToolAPI, resolveProductSlug, BENCHMARKABLE_SLUGS } from "@/lib/benchmark/adapters";
import { evaluateResult } from "@/lib/benchmark/evaluator";
import { BROWSE_STATUSES } from "@/lib/product-status";

const db = prisma as any;

/**
 * If an agent's toolApiKeys is empty (e.g. seeded before vault was populated),
 * resolve keys from the vault at runtime so probes don't fail with "Missing key".
 */
async function ensureToolApiKeys(config: any): Promise<Record<string, string>> {
  const existing = config.toolApiKeys ?? {};
  const slugs: string[] = config.toolSlugs ?? [];
  const missing = slugs.filter(s => !existing[s] || String(existing[s]).length < 5);
  if (missing.length === 0) return existing;

  // Resolve from vault — map slug to vault service name first
  const resolved: Record<string, string> = { ...existing };
  for (const slug of missing) {
    // Try slug directly, then mapped vault service name
    let record = await db.apiKeyVault.findUnique({ where: { service: slug } });
    if (!record?.apiKey) {
      const { vaultServiceForSlug } = await import("./usage");
      const vaultService = vaultServiceForSlug(slug);
      if (vaultService && vaultService !== slug) {
        record = await db.apiKeyVault.findUnique({ where: { service: vaultService } });
      }
    }
    if (record?.apiKey) resolved[slug] = record.apiKey;
  }

  // Persist so we don't hit vault every run
  if (missing.length > 0) {
    await db.benchmarkAgentConfig.update({
      where: { id: config.id },
      data: { toolApiKeys: resolved },
    }).catch(() => {}); // fire-and-forget
  }

  return resolved;
}

function chooseQueries(config: any, querySet: any) {
  const fromSet = Array.isArray(querySet?.queries) ? querySet.queries.map((item: any) => item.query) : [];
  const custom = Array.isArray(config.customQueries) ? config.customQueries : [];
  const pool = [...custom, ...fromSet].filter(Boolean);
  if (pool.length > 0) {
    return pool.slice(0, config.queriesPerRun || 3);
  }
  return generateQuerySet(config.domain, Math.max(config.queriesPerRun || 3, 3)).map((item) => item.query).slice(0, config.queriesPerRun || 3);
}

function scoreProbe(details: Record<string, unknown> | undefined, domain?: string) {
  const results = Number(details?.results ?? 0);

  // Finance data APIs return structured data — a single quote/bar is a complete valid response.
  // Polygon prev close returns exactly 1 bar, FMP quote returns 1 element array.
  // These should score high, not be penalized for "only 1 result".
  if (domain === "finance_data") {
    if (results <= 0) return 0.2;
    return 0.92; // Any successful result from a finance API is a high-quality response
  }

  if (results <= 0) return 0.2;
  if (results === 1) return 0.6;
  if (results === 2) return 0.8;
  return 0.92;
}

export async function runBenchmarkAgentNow(configId: string) {
  const settings = await ensureOpsSettings();
  const config = await db.benchmarkAgentConfig.findUnique({
    where: { id: configId },
    include: { querySet: true },
  });

  if (!config) {
    throw new Error("Benchmark agent config not found.");
  }

  const queries = chooseQueries(config, config.querySet);
  const tools = (config.toolSlugs ?? []).slice(0, config.toolsPerQuery ?? 4);
  const toolApiKeys = await ensureToolApiKeys(config);
  const run = await db.benchmarkAgentRun.create({
    data: {
      configId: config.id,
      status: "running",
      queriesRun: queries.length,
      toolsTested: tools.length,
      testsCompleted: 0,
      results: [],
    },
  });

  const results = [];

  for (const query of queries) {
    for (const tool of tools) {
      const encryptedKey = toolApiKeys[tool] ?? "";
      const probe = await runToolProbe(tool, encryptedKey, query);
      results.push({
        query,
        tool,
        success: probe.ok,
        latencyMs: probe.latencyMs || null,
        relevance: probe.ok ? scoreProbe(probe.details, config.domain) : 0,
        status: probe.status,
        error: probe.error ?? null,
        meta: probe.details ?? {},
      });
    }
  }

  const completed = results.filter((item) => item.success).length;
  const avgLatency =
    results.filter((item) => typeof item.latencyMs === "number").reduce((sum, item) => sum + Number(item.latencyMs), 0) /
      Math.max(results.filter((item) => typeof item.latencyMs === "number").length, 1) || 0;
  const avgRelevance =
    results.reduce((sum, item) => sum + Number(item.relevance ?? 0), 0) / Math.max(results.length, 1);
  const successRate = completed / Math.max(results.length, 1);
  const failed = successRate < 0.5;
  const nextConsecutiveFails = failed ? Math.min((config.consecutiveFails ?? 0) + 1, settings.autoPauseAfter) : 0;

  await db.benchmarkAgentRun.update({
    where: { id: run.id },
    data: {
      status: failed ? "failed" : "completed",
      completedAt: new Date(),
      testsCompleted: completed,
      avgLatencyMs: Math.round(avgLatency),
      avgRelevance,
      successRate,
      results,
      error: failed ? "Success rate fell below 50%." : null,
    },
  });

  const totalRuns = (config.totalRuns ?? 0) + 1;
  const nextAverage = config.avgSuccessRate
    ? (config.avgSuccessRate * (config.totalRuns ?? 0) + successRate) / totalRuns
    : successRate;

  await db.benchmarkAgentConfig.update({
    where: { id: config.id },
    data: {
      lastRunAt: new Date(),
      lastRunSuccess: !failed,
      totalRuns,
      totalTests: (config.totalTests ?? 0) + completed,
      avgSuccessRate: nextAverage,
      consecutiveFails: nextConsecutiveFails,
      isActive: nextConsecutiveFails >= settings.autoPauseAfter ? false : config.isActive,
    },
  });

  // --- Create BenchmarkRun records for each tool+query result ---
  await createBenchmarkRunRecords(config.agentId, config.domain, results);

  // --- Auto-vote based on benchmark results ---
  await autoVoteFromBenchmarkResults(config.agentId, results, run.id);

  return getBenchmarkAgentById(configId);
}

/**
 * Create individual BenchmarkRun records for each tool+query result.
 * These feed into score-aggregate cron for avgBenchmarkRelevance.
 */
export async function createBenchmarkRunRecords(
  agentId: string,
  domain: string,
  results: Array<{ query: string; tool: string; success: boolean; latencyMs: number | null; relevance: number; freshness?: number; completeness?: number; status?: unknown; meta?: Record<string, unknown> }>,
  batchId?: string,
) {
  for (const r of results) {
    const productSlug = resolveProductSlug(r.tool);
    // withRetry not available here — wrap in try-catch so a transient P1017/fetch-failed
    // after a long benchmark run does not abort the loop and lose remaining records.
    let product: { id: string } | null;
    try {
      product = await db.product.findUnique({
        where: { slug: productSlug },
        select: { id: true },
      });
    } catch {
      continue; // skip on transient DB error — don't abort remaining records
    }
    if (!product) continue;

    try {
      await db.benchmarkRun.create({
        data: {
          benchmarkAgentId: agentId,
          queryId: `auto:${Date.now()}:${r.tool}:${r.query.substring(0, 20)}`,
          productId: product.id,
          query: r.query,
          statusCode: typeof r.status === 'number' ? r.status : (r.success ? 200 : 500),
          latencyMs: r.latencyMs ?? 0,
          resultCount: Number(r.meta?.results ?? 0),
          relevanceScore: r.relevance,
          freshnessScore: r.freshness ?? null,
          completenessScore: r.completeness ?? null,
          domain,
          complexity: 'standard',
          success: r.success,
          costUsd: null,
          batchId: batchId ?? null,
        },
      });
    } catch {
      // Skip duplicates or other errors — don't block the run
    }
  }
}

/**
 * Auto-vote for products based on benchmark results.
 * ≥ 3.5 avg relevance → UPVOTE, < 2.0 → DOWNVOTE, 2.0–3.5 → no vote.
 * Won't overwrite existing proof-verified votes.
 */
async function autoVoteFromBenchmarkResults(
  agentId: string,
  results: Array<{ tool: string; relevance: number; success: boolean }>,
  runId: string,
) {
  // Group results by tool slug and compute avg relevance
  const toolScores = new Map<string, { total: number; count: number }>();
  for (const r of results) {
    const existing = toolScores.get(r.tool) ?? { total: 0, count: 0 };
    existing.total += r.relevance;
    existing.count += 1;
    toolScores.set(r.tool, existing);
  }

  for (const [toolSlug, scores] of toolScores) {
    const avgRelevance = scores.total / scores.count;

    // Determine signal
    let signal: 'UPVOTE' | 'DOWNVOTE' | null = null;
    if (avgRelevance >= 3.5) signal = 'UPVOTE';
    else if (avgRelevance < 2.0) signal = 'DOWNVOTE';
    if (!signal) continue;

    // Find product by slug (resolve alias → canonical product slug)
    const productSlug = resolveProductSlug(toolSlug);
    const product = await db.product.findUnique({
      where: { slug: productSlug },
      select: { id: true },
    });
    if (!product) continue;

    // Don't overwrite existing proof-verified votes
    const existingVote = await db.vote.findUnique({
      where: {
        productId_agentId: {
          productId: product.id,
          agentId,
        },
      },
      select: { id: true, proofVerified: true },
    });
    if (existingVote?.proofVerified) continue;

    const isUpdate = !!existingVote;

    // Calculate weights
    const agent = await db.agent.findUnique({ where: { id: agentId } });
    if (!agent) continue;

    const rawWeight = 0.5;
    const reputationMult = agent.reputationScore ?? 1.0;
    const diversityMult = await calculateDiversity(agent, product.id);
    const finalWeight = Math.round(rawWeight * reputationMult * diversityMult * 1000) / 1000;

    const proofHash = `benchmark:${agentId}:${product.id}:${runId}`;

    await db.vote.upsert({
      where: {
        productId_agentId: {
          productId: product.id,
          agentId,
        },
      },
      create: {
        productId: product.id,
        agentId,
        proofHash,
        proofVerified: false,
        proofDetails: null,
        rawWeight,
        reputationMult,
        diversityMult,
        finalWeight,
        signal,
        comment: `Auto-vote from benchmark (avg relevance: ${avgRelevance.toFixed(2)})`,
      },
      update: {
        proofHash,
        rawWeight,
        reputationMult,
        diversityMult,
        finalWeight,
        signal,
        comment: `Auto-vote from benchmark (avg relevance: ${avgRelevance.toFixed(2)})`,
      },
    });

    // Update agent stats only on new vote
    if (!isUpdate) {
      const updatedAgent = await db.agent.update({
        where: { id: agentId },
        data: { totalVotes: { increment: 1 } },
      });
      const newReputation = calculateReputation(updatedAgent);
      await db.agent.update({
        where: { id: agentId },
        data: { reputationScore: newReputation },
      });
    }

    // Recalculate product score
    await recalculateProductScore(product.id);
  }
}

export async function runDueBenchmarkAgents(limit = 10) {
  const configs = await db.benchmarkAgentConfig.findMany({
    where: { isActive: true },
    include: { querySet: true },
    orderBy: { lastRunAt: "asc" },
  });

  const due = configs.filter((config: any) => {
    if (!config.lastRunAt) return true;
    return Date.now() - new Date(config.lastRunAt).getTime() >= getFrequencyMs(config.testFrequency);
  });

  const processed = [];
  for (const config of due.slice(0, limit)) {
    processed.push(await runBenchmarkAgentNow(config.id));
  }

  return processed;
}

export async function buildCronAdapterPayload(limit = 10) {
  const agents = await runDueBenchmarkAgents(limit);
  return {
    triggeredAt: new Date().toISOString(),
    count: agents.length,
    agents: agents.map((agent) => ({
      id: agent?.id,
      displayName: agent?.displayName,
      lastRunAt: agent?.lastRunAt,
    })),
  };
}

// ============================================================
// BATCH BENCHMARK — runs all eligible tools for one domain
// per invocation, sharing a single batchId.
// ============================================================

/**
 * Returns the canonical product slugs (as stored in the Product table)
 * that are benchmarkable for a given domain, derived from each domain's
 * suggestedTools list.
 */
function getBenchmarkableSlugsByDomain(domain: string): string[] {
  const domainDef = DOMAIN_DEFINITIONS.find((d) => d.slug === domain);
  if (!domainDef) return [];
  return domainDef.suggestedTools
    .map((alias) => resolveProductSlug(alias))
    .filter((slug) => BENCHMARKABLE_SLUGS.includes(slug));
}

/**
 * Picks the domain that was least recently covered by a batch BenchmarkRun.
 * Falls back to the first defined domain if no batch runs exist yet.
 */
async function pickNextBatchDomain(): Promise<string> {
  const domains = DOMAIN_DEFINITIONS.map((d) => d.slug);

  const lastRuns = await Promise.all(
    domains.map((domain) =>
      db.benchmarkRun.findFirst({
        where: { domain, batchId: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { domain: true, createdAt: true },
      }),
    ),
  );

  const lastRunTime = new Map<string, number>();
  for (let i = 0; i < domains.length; i++) {
    const run = lastRuns[i];
    lastRunTime.set(domains[i], run ? new Date(run.createdAt).getTime() : 0);
  }

  return domains.reduce((oldest, domain) =>
    (lastRunTime.get(domain) ?? 0) < (lastRunTime.get(oldest) ?? 0) ? domain : oldest,
    domains[0],
  );
}

/**
 * Picks a query from the generated query set for a domain,
 * rotating by cron period (every 20 min → new query each invocation).
 */
function pickBatchQuery(domain: string): string {
  const items = generateQuerySet(domain, 20);
  const periodMs = 20 * 60 * 1000;
  const index = Math.floor(Date.now() / periodMs) % items.length;
  return items[index]?.query ?? items[0].query;
}

/**
 * Runs a single batch benchmark:
 *   1. Rotate domain selection (least-recently-batched domain).
 *   2. Pick one query from that domain's query set.
 *   3. Generate a shared batchId.
 *   4. Call ALL benchmarkable tools for that domain in parallel.
 *   5. LLM-evaluate (Claude Haiku) each result.
 *   6. Persist BenchmarkRun records with the shared batchId.
 *   7. Recalculate product scores for affected products.
 */
export async function runBatchBenchmark(): Promise<{
  batchId: string;
  domain: string;
  query: string;
  toolsRun: number;
  results: Array<{ tool: string; success: boolean; relevance: number; latencyMs: number | null }>;
}> {
  const domain = await pickNextBatchDomain();
  const query = pickBatchQuery(domain);
  const batchId = randomUUID();

  const toolSlugs = getBenchmarkableSlugsByDomain(domain);

  const products = await db.product.findMany({
    where: { slug: { in: toolSlugs }, status: { in: BROWSE_STATUSES } },
    select: { id: true, slug: true },
  });

  if (products.length === 0) {
    return { batchId, domain, query, toolsRun: 0, results: [] };
  }

  // Run all tools in parallel to stay within cron time limits
  const settled = await Promise.allSettled(
    products.map(async (product: any) => {
      try {
        const result = await callToolAPI(product.slug, query);
        const success = result.statusCode >= 200 && result.statusCode < 300;

        let relevance = 0;
        let freshness = 0;
        let completeness = 0;

        if (success) {
          try {
            const evaluation = await evaluateResult(
              query,
              `Batch benchmark for ${domain} domain`,
              result.response,
              "anthropic",
            );
            relevance = evaluation.relevance;
            freshness = evaluation.freshness;
            completeness = evaluation.completeness;
          } catch {
            // LLM evaluation failed — leave scores at 0
          }
        }

        return {
          query,
          tool: product.slug,
          success,
          latencyMs: result.latencyMs ?? null,
          relevance,
          freshness,
          completeness,
          status: result.statusCode,
          meta: { results: result.resultCount ?? 0 },
        };
      } catch {
        return {
          query,
          tool: product.slug,
          success: false,
          latencyMs: null,
          relevance: 0,
          freshness: 0,
          completeness: 0,
          status: 500,
          meta: { results: 0 },
        };
      }
    }),
  );

  const probeResults = settled
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
    .map((r) => r.value);

  await createBenchmarkRunRecords("benchmark-internal", domain, probeResults, batchId);

  // Score recalculation is a non-critical stats cache update — wrap in try-catch so a
  // transient Neon error after the long parallel API calls does not abort the batch run.
  for (const product of products) {
    try {
      await recalculateProductScore(product.id);
    } catch {
      // non-fatal — stale scores will be corrected on the next successful benchmark
    }
  }

  return {
    batchId,
    domain,
    query,
    toolsRun: probeResults.length,
    results: probeResults.map((r) => ({
      tool: r.tool,
      success: r.success,
      relevance: r.relevance,
      latencyMs: r.latencyMs,
    })),
  };
}
