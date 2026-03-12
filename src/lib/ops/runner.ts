import { ensureOpsSettings, generateQuerySet, getBenchmarkAgentById } from "./data";
import { prisma } from "./prisma";
import { runToolProbe } from "./service-probes";
import { getFrequencyMs } from "./utils";
import { recalculateProductScore } from "@/lib/voting";
import { calculateReputation } from "@/lib/reputation";
import { calculateDiversity } from "@/lib/sybil";

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

function scoreProbe(details: Record<string, unknown> | undefined) {
  const results = Number(details?.results ?? 0);
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
        relevance: probe.ok ? scoreProbe(probe.details) : 0,
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

  // --- Auto-vote based on benchmark results ---
  await autoVoteFromBenchmarkResults(config.agentId, results, run.id);

  return getBenchmarkAgentById(configId);
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

    // Find product by slug
    const product = await db.product.findUnique({
      where: { slug: toolSlug },
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
