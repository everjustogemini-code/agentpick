/**
 * Router SDK — Developer account management, strategy-based routing, usage tracking.
 * Extends the existing router core (./index.ts) without modifying it.
 */

import { Prisma } from '@/generated/prisma/client';
import { prisma, withRetry } from '@/lib/prisma';
import { ROUTER_PLAN_DAILY_LIMITS, ROUTER_PLAN_MONTHLY_LIMITS, ROUTER_PLAN_OVERAGE_PER_CALL, type RouterPlanCode } from './plans';
import type { RouterRequest, RouterResponse, Strategy } from './index';
import { getRankedToolsForCapability } from './index';

const db = prisma;

export type RouterStrategyValue = 'BALANCED' | 'FASTEST' | 'CHEAPEST' | 'MOST_ACCURATE' | 'MANUAL' | 'AUTO';
export type RouterPlanValue = RouterPlanCode;

const CAPABILITY_TO_CATEGORY: Record<string, string> = {
  search: 'search_research',
  crawl: 'web_crawling',
  embed: 'storage_memory',
  finance: 'finance_data',
  code: 'code_compute',
  storage: 'storage_memory',
  communication: 'communication',
  payments: 'payments_commerce',
  auth: 'auth_identity',
  scheduling: 'scheduling',
  ai: 'ai_models',
  observability: 'observability',
};

function isNewBillingCycle(date: Date) {
  const now = new Date();
  return date.getUTCFullYear() !== now.getUTCFullYear() || date.getUTCMonth() !== now.getUTCMonth();
}

const VALID_STRATEGIES: RouterStrategyValue[] = ["BALANCED", "FASTEST", "CHEAPEST", "MOST_ACCURATE", "MANUAL", "AUTO"];

export function isRouterStrategy(value: unknown): value is RouterStrategyValue {
  return VALID_STRATEGIES.includes(String(value).toUpperCase() as RouterStrategyValue);
}

/**
 * Normalize strategy to canonical uppercase form.
 * Accepts case-insensitive input + legacy aliases.
 */
export function normalizeStrategy(value: string): RouterStrategyValue | null {
  const upper = value.toUpperCase();
  if (VALID_STRATEGIES.includes(upper as RouterStrategyValue)) return upper as RouterStrategyValue;
  // Map canonical API names to Prisma enum values
  const aliases: Record<string, RouterStrategyValue> = {
    CUSTOM: 'MANUAL',
    BEST_PERFORMANCE: 'MOST_ACCURATE',
    MOST_STABLE: 'FASTEST',
  };
  return aliases[upper] ?? null;
}

/**
 * Get or create a DeveloperAccount for an agent.
 */
export async function ensureDeveloperAccount(agentId: string) {
  // NOTE: withRetry here covers P1017/fetch-failed/socket-hang-up on the initial lookup.
  // Without it, a transient Neon HTTP connection drop on the findUnique throws immediately
  // and propagates as a 500 from sdk-handler.ts (which has no outer try-catch for this call).
  let account = await withRetry(() => db.developerAccount.findUnique({
    where: { agentId },
  }));

  if (!account) {
    try {
      account = await withRetry(() => db.developerAccount.create({
        data: {
          agentId,
          plan: 'FREE',
          strategy: 'AUTO',
          priorityTools: [],
          excludedTools: [],
        },
      }));
    } catch (createErr) {
      // P2002 = unique constraint violation — concurrent request already created the account
      if ((createErr as { code?: string })?.code === 'P2002') {
        account = await withRetry(() => db.developerAccount.findUnique({ where: { agentId } }));
        if (!account) throw createErr;
      } else {
        throw createErr;
      }
    }
  } else if (isNewBillingCycle(account.billingCycleStart)) {
    // withRetry: billing cycle reset is a best-effort stats update; retry on transient errors
    // so the fresh billingCycleStart is applied before usage counting begins.
    try {
      account = await withRetry(() => db.developerAccount.update({
        where: { id: account!.id },
        data: {
          spentThisMonth: 0,
          billingCycleStart: new Date(),
        },
      }));
    } catch (resetErr) {
      // If the reset fails after retries, continue with the stale billingCycleStart.
      // Monthly spend reset will be retried on the next request; counts remain consistent.
      console.error('[ensureDeveloperAccount] billing cycle reset failed (non-fatal):', (resetErr instanceof Error ? resetErr.message : resetErr));
    }
  }

  return account;
}

/**
 * Check daily usage against plan limits.
 * Returns { allowed: boolean, remaining: number, limit: number }.
 */
export async function checkUsageLimit(developerId: string, plan: RouterPlanValue, billingCycleStart?: Date) {
  const dailyLimit = ROUTER_PLAN_DAILY_LIMITS[plan];
  const monthlyLimit = ROUTER_PLAN_MONTHLY_LIMITS[plan];
  const overagePerCall = ROUTER_PLAN_OVERAGE_PER_CALL[plan];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  // Use account's billing cycle start when provided; fall back to calendar month start.
  // This ensures enforcement matches what the usage API shows as callsThisMonth.
  const monthStart = billingCycleStart ?? (() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  // withRetry: count queries can fail with P1017/fetch-failed after a prior withRetry
  // cleared the singleton. Without retry, a transient drop here propagates as 500 from
  // sdk-handler.ts (checkUsageLimit is not wrapped in a try-catch there).
  const [todayCount, monthCount] = await Promise.all([
    withRetry(() => db.routerCall.count({
      where: { developerId, createdAt: { gte: todayStart } },
    })),
    withRetry(() => db.routerCall.count({
      where: { developerId, createdAt: { gte: monthStart } },
    })),
  ]);

  // Free plan: hard cap at monthly limit
  if (overagePerCall === null && monthlyLimit !== null && monthCount >= monthlyLimit) {
    return {
      allowed: false,
      remaining: 0,
      limit: dailyLimit,
      used: todayCount,
      monthlyUsed: monthCount,
      monthlyLimit,
      isOverage: false,
      hardCapped: true,
    };
  }

  return {
    allowed: todayCount < dailyLimit,
    remaining: Math.max(0, dailyLimit - todayCount),
    limit: dailyLimit,
    used: todayCount,
    monthlyUsed: monthCount,
    monthlyLimit,
    isOverage: monthlyLimit !== null && monthCount >= monthlyLimit,
    hardCapped: false,
  };
}

/**
 * Apply strategy to modify which tool is selected.
 * Returns a modified RouterRequest with the best tool for the strategy.
 */
export async function applyStrategy(
  capability: string,
  request: RouterRequest,
  account: {
    strategy: RouterStrategyValue;
    priorityTools: string[];
    excludedTools: string[];
    fallbackEnabled: boolean;
    maxFallbacks: number;
    latencyBudgetMs: number | null;
  },
): Promise<RouterRequest> {
  const modified: RouterRequest = {
    ...request,
    params: request.params,
    fallback: request.fallback ? [...request.fallback] : undefined,
  };

  if (account.strategy === 'MANUAL' && account.priorityTools.length > 0) {
    // Only pre-select from account priority tools if the request didn't supply its own priority_tools.
    // Request-level priority_tools take precedence over account-level (set via PATCH /account).
    if (!modified.tool && !modified.priority_tools?.length) {
      modified.tool = account.priorityTools[0];
    }
    if (account.fallbackEnabled) {
      const primaryTool = modified.tool ?? modified.priority_tools?.[0];
      modified.fallback = account.priorityTools
        .filter((tool) => tool !== primaryTool && !account.excludedTools.includes(tool))
        .slice(0, account.maxFallbacks);
    }
    return modified;
  }

  // Only set a strategy-based tool if there are no priority_tools.
  // Priority tools take precedence and are handled by routeRequest().
  // AUTO strategy: skip pre-selection — let routeRequest's AI classifier pick the tool.
  // CHEAPEST strategy: skip pre-selection — routeRequest handles it with BYOK-aware ranking
  //   so users with BYOK keys for cheap tools (brave-search, serper) get correctly routed
  //   rather than being forced to tavily (cheapest platform-configured tool).
  // AUTO: skipped — AI classification handles tool selection.
  // CHEAPEST: skipped — BYOK-aware cost ranking in routeRequest handles it.
  // MOST_ACCURATE: skipped — routeRequest runs fastClassify for deep-research queries and
  //   uses research-quality tool ordering; pre-selecting here would override that logic and
  //   could pin a lower-quality tool when the preferred high-quality tool is unconfigured.
  if (!modified.tool && !modified.priority_tools?.length && account.strategy !== 'AUTO' && account.strategy !== 'CHEAPEST' && account.strategy !== 'MOST_ACCURATE') {
    const best = getBestToolForStrategy(capability, account.strategy, account.excludedTools, account.latencyBudgetMs);
    if (best) {
      modified.tool = best;
    }
  }

  // For AUTO, MOST_ACCURATE, and CHEAPEST strategies, skip injecting account priorityTools as fallbacks.
  // AI routing and cost-based routing select the best tool chain — stale account priorityTools must not pollute them.
  if (account.fallbackEnabled && !(modified.fallback?.length) && account.strategy !== 'AUTO' && account.strategy !== 'MOST_ACCURATE' && account.strategy !== 'CHEAPEST') {
    const fallbacks = account.priorityTools
      .filter((tool) => tool !== modified.tool && !account.excludedTools.includes(tool))
      .slice(0, account.maxFallbacks);

    if (fallbacks.length > 0) {
      modified.fallback = fallbacks;
    }
  }

  return modified;
}

/**
 * Map SDK strategies to core router strategies.
 */
function sdkToRouterStrategy(strategy: RouterStrategyValue): Strategy {
  const upper = strategy.toUpperCase();
  switch (upper) {
    case 'FASTEST': return 'most_stable';
    case 'CHEAPEST': return 'cheapest';
    case 'MOST_ACCURATE': return 'best_performance';
    case 'AUTO': return 'auto';
    case 'BALANCED':
    default: return 'balanced';
  }
}

/**
 * Find best tool based on strategy using CAPABILITY_TOOLS + hardcoded characteristics.
 */
function getBestToolForStrategy(
  capability: string,
  strategy: RouterStrategyValue,
  exclude: string[],
  latencyBudgetMs: number | null,
): string | null {
  const routerStrategy = sdkToRouterStrategy(strategy);
  const ranked = getRankedToolsForCapability(capability, routerStrategy, exclude, undefined, latencyBudgetMs);
  return ranked[0] ?? null;
}

/**
 * Record a RouterCall after routing completes.
 */
export async function recordRouterCall(
  developerId: string,
  capability: string,
  query: string,
  request: RouterRequest,
  response: RouterResponse,
  strategyUsed: RouterStrategyValue,
  byokUsed: boolean,
  fallbackChain: string[],
  isOverageCall = false,
) {
  const meta = response.meta as RouterResponse['meta'] & {
    cost_usd?: number;
    result_count?: number;
    classification_ms?: number;
    total_ms?: number;
  };

  // Determine success: trace_id starting with "trace_fail_" means all tools failed
  const isSuccess = !meta.trace_id.startsWith('trace_fail_');
  const statusCode = isSuccess ? 200 : 502;

  // Sanitize toolUsed: never write null/empty/undefined — fall back to capability name
  // so the DB never accumulates records with toolUsed='unknown' or '' that break dashboard queries.
  const sanitizedToolUsed = (meta.tool_used && meta.tool_used !== 'unknown')
    ? meta.tool_used
    : capability;

  // NOTE: latencyMs and totalMs are Int fields in the schema — always pass integers.
  // Math.round() guards against float values from performance.now() subtraction edge cases.
  const fullData = {
    developerId,
    capability,
    query,
    toolRequested: request.tool ?? null,
    toolUsed: sanitizedToolUsed,
    fallbackUsed: meta.fallback_used,
    fallbackFrom: meta.fallback_from ?? null,
    fallbackChain,
    statusCode,
    latencyMs: Math.round(meta.latency_ms),
    resultCount: meta.result_count ?? null,
    aiClassification: meta.ai_classification
      ? ({ ...(meta.ai_classification as object), classification_ms: meta.classification_ms ?? 0 } as Prisma.InputJsonValue)
      : undefined,
    costUsd: meta.cost_usd ?? 0,
    success: isSuccess,
    strategyUsed,
    byokUsed,
    traceId: meta.trace_id,
    totalMs: meta.total_ms != null ? Math.round(meta.total_ms) : undefined,
  };

  let call: { id: string; traceId: string | null };
  try {
    call = await withRetry(() => db.routerCall.create({
      data: fullData,
      select: { id: true, traceId: true },
    }));
  } catch (insertErr) {
    // Fallback INSERT: drop totalMs (may not exist in older DB schemas) and fall back
    // strategyUsed to BALANCED for enum values added in later migrations (AUTO, MANUAL).
    // NOTE: aiClassification IS included here (cycle 99 re-added it; it is JSON-serializable
    // and its absence was causing ai_routing_summary to always be null).
    // totalMs is the only field intentionally omitted from this fallback path.
    const errMsg = String((insertErr instanceof Error ? insertErr.message : insertErr) ?? '').toLowerCase();
    const errCode = (insertErr as Record<string, unknown>)?.code;
    console.error('[RecordRouterCall] primary INSERT failed — attempting fallback INSERT:', {
      code: errCode,
      message: errMsg.slice(0, 300),
    });
    // BALANCED, FASTEST, CHEAPEST, MOST_ACCURATE were in the original enum from the start.
    // AUTO and MANUAL were added in later migrations — fall back to BALANCED when not present.
    const ORIGINAL_STRATEGY_VALUES: RouterStrategyValue[] = ['BALANCED', 'FASTEST', 'CHEAPEST', 'MOST_ACCURATE'];
    const safeStrategy: RouterStrategyValue = ORIGINAL_STRATEGY_VALUES.includes(strategyUsed)
      ? strategyUsed
      : 'BALANCED';
    const safeData = {
      developerId: fullData.developerId,
      capability: fullData.capability,
      query: fullData.query,
      toolRequested: fullData.toolRequested,
      toolUsed: fullData.toolUsed,
      fallbackUsed: fullData.fallbackUsed,
      fallbackFrom: fullData.fallbackFrom,
      fallbackChain: fullData.fallbackChain,
      statusCode: fullData.statusCode,
      latencyMs: fullData.latencyMs,
      resultCount: fullData.resultCount,
      costUsd: fullData.costUsd,
      success: fullData.success,
      strategyUsed: safeStrategy,
      byokUsed: fullData.byokUsed,
      traceId: fullData.traceId,
      aiClassification: fullData.aiClassification,
      // totalMs intentionally omitted — may not exist in production DB if migration not applied
    };
    try {
      call = await withRetry(() => db.routerCall.create({
        data: safeData,
        select: { id: true, traceId: true },
      }));
    } catch (fallbackErr) {
      const fallbackCode = (fallbackErr as Record<string, unknown>)?.code;
      const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      console.error('[RecordRouterCall] fallback INSERT also failed — attempting minimal INSERT:', {
        code: fallbackCode ?? 'no-code',
        message: fallbackMsg.slice(0, 300),
      });
      // Minimal fallback: drop both totalMs AND aiClassification.
      // Handles the case where aiClassification column is also absent in the production DB
      // (added in a later migration). Without this path, BOTH the primary and first-fallback
      // INSERTs fail when the production schema is behind, and the RouterCall is silently lost.
      const minimalData = {
        developerId: safeData.developerId,
        capability: safeData.capability,
        query: safeData.query,
        toolRequested: safeData.toolRequested,
        toolUsed: safeData.toolUsed,
        fallbackUsed: safeData.fallbackUsed,
        fallbackFrom: safeData.fallbackFrom,
        fallbackChain: safeData.fallbackChain,
        statusCode: safeData.statusCode,
        latencyMs: safeData.latencyMs,
        resultCount: safeData.resultCount,
        costUsd: safeData.costUsd,
        success: safeData.success,
        strategyUsed: safeStrategy,
        byokUsed: safeData.byokUsed,
        traceId: safeData.traceId,
        // aiClassification intentionally omitted — may not exist in older production schemas
        // totalMs intentionally omitted — same reason
      };
      try {
        call = await withRetry(() => db.routerCall.create({
          data: minimalData,
          select: { id: true, traceId: true },
        }));
      } catch (minimalErr) {
        const minimalCode = (minimalErr as Record<string, unknown>)?.code;
        const minimalMsg = minimalErr instanceof Error ? minimalErr.message : String(minimalErr);
        console.error('[RecordRouterCall] minimal INSERT also failed:', {
          code: minimalCode ?? 'no-code',
          message: minimalMsg.slice(0, 300),
        });
        throw minimalErr;
      }
    }
  }

  // NOTE: routerCall.create is already committed at this point (awaited above via withRetry).
  // developerAccount.update is a denormalized stats cache — stale counts are acceptable.
  // Do NOT remove this try-catch: losing it causes a misleading "[RouterCall] write failed"
  // log in handler.ts even when the RouterCall record was successfully committed.
  try {
    const currentAccount = await withRetry(() => db.developerAccount.findUnique({
      where: { id: developerId },
      select: {
        plan: true,
        totalCalls: true,
        totalFallbacks: true,
        totalCostUsd: true,
        avgLatencyMs: true,
        spentThisMonth: true,
        billingCycleStart: true,
      },
    }));

    if (currentAccount) {
      const previousCalls = currentAccount.totalCalls ?? 0;
      const nextCalls = previousCalls + 1;
      const nextAvgLatency =
        previousCalls > 0 && currentAccount.avgLatencyMs !== null
          ? (currentAccount.avgLatencyMs * previousCalls + meta.latency_ms) / nextCalls
          : meta.latency_ms;
      const resetMonthlySpend = isNewBillingCycle(currentAccount.billingCycleStart);

      // For overage calls, add the overage charge to monthly spend
      const toolCost = meta.cost_usd ?? 0;
      const overageCost = isOverageCall
        ? (ROUTER_PLAN_OVERAGE_PER_CALL[currentAccount.plan as RouterPlanCode] ?? 0)
        : 0;
      const totalCallCost = toolCost + overageCost;

      await withRetry(() => db.developerAccount.update({
        where: { id: developerId },
        data: {
          totalCalls: { increment: 1 },
          totalFallbacks: meta.fallback_used ? { increment: 1 } : undefined,
          totalCostUsd: byokUsed ? (overageCost > 0 ? { increment: overageCost } : undefined) : { increment: totalCallCost },
          spentThisMonth: resetMonthlySpend
            ? (byokUsed ? overageCost : totalCallCost)
            : { increment: byokUsed ? overageCost : totalCallCost },
          billingCycleStart: resetMonthlySpend ? new Date() : undefined,
          avgLatencyMs: nextAvgLatency,
        },
      }));
    }
  } catch (updateErr) {
    const code = (updateErr as Record<string, unknown>)?.code;
    console.error('[RouterCall] account stats update failed (RouterCall committed OK):', code ?? '', updateErr instanceof Error ? updateErr.message : updateErr);
  }

  return call;
}

/**
 * Get usage stats for a developer account.
 */
export async function getUsageStats(developerId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  // withRetry: same P1017/fetch-failed transient errors that break routerCall.create also
  // break findMany. Without retry, a Neon connection drop after a prior write causes a 500
  // from the usage and weekly-report endpoints. The pattern mirrors checkUsageLimit (cycle 102).
  const calls = await withRetry(() => db.routerCall.findMany({
    where: { developerId, createdAt: { gte: since } },
    select: {
      capability: true,
      toolUsed: true,
      latencyMs: true,
      costUsd: true,
      byokUsed: true,
      success: true,
      fallbackUsed: true,
      strategyUsed: true,
      aiClassification: true,
      createdAt: true,
    },
  }));

  const totalCalls = calls.length;
  const successCalls = calls.filter((call: { success: boolean }) => call.success).length;
  const fallbackCalls = calls.filter((call: { fallbackUsed: boolean }) => call.fallbackUsed).length;
  const byokCalls = calls.filter((call: { byokUsed: boolean }) => call.byokUsed).length;
  const avgLatency =
    totalCalls > 0 ? Math.round(calls.reduce((sum: number, call: { latencyMs: number }) => sum + call.latencyMs, 0) / totalCalls) : 0;
  const platformCost = calls
    .filter((call: { byokUsed: boolean }) => !call.byokUsed)
    .reduce((sum: number, call: { costUsd: number }) => sum + call.costUsd, 0);
  const byokSavings = calls
    .filter((call: { byokUsed: boolean }) => call.byokUsed)
    .reduce((sum: number, call: { costUsd: number }) => sum + call.costUsd, 0);

  const byCapability: Record<string, { calls: number; avgLatency: number; successRate: number }> = {};
  const capGroups = new Map<string, typeof calls>();
  for (const call of calls) {
    const group = capGroups.get(call.capability) ?? [];
    group.push(call);
    capGroups.set(call.capability, group);
  }
  for (const [capability, group] of capGroups) {
    byCapability[capability] = {
      calls: group.length,
      avgLatency: Math.round(
        group.reduce((sum: number, call: { latencyMs: number }) => sum + call.latencyMs, 0) / group.length,
      ),
      successRate: group.filter((call: { success: boolean }) => call.success).length / group.length,
    };
  }

  // Capability names are used as last-resort fallback in recordRouterCall when tool_used is
  // missing. Filter them here to prevent phantom "tool" entries (e.g. 'search', 'crawl') from
  // appearing in byTool analytics for accounts with any legacy or edge-case records.
  const CAPABILITY_NAMES = new Set(['search', 'crawl', 'embed', 'finance', 'code', 'communication', 'translation', 'ocr', 'storage', 'payments', 'auth', 'scheduling', 'ai', 'observability']);

  const byTool: Record<string, { calls: number; avgLatency: number; successRate: number }> = {};
  const toolGroups = new Map<string, typeof calls>();
  for (const call of calls) {
    if (!call.toolUsed || call.toolUsed === 'unknown' || call.toolUsed.endsWith('-unavailable') || CAPABILITY_NAMES.has(call.toolUsed)) continue;
    const group = toolGroups.get(call.toolUsed) ?? [];
    group.push(call);
    toolGroups.set(call.toolUsed, group);
  }
  for (const [tool, group] of toolGroups) {
    byTool[tool] = {
      calls: group.length,
      avgLatency: Math.round(
        group.reduce((sum: number, call: { latencyMs: number }) => sum + call.latencyMs, 0) / group.length,
      ),
      successRate: group.filter((call: { success: boolean }) => call.success).length / group.length,
    };
  }

  // AI routing summary: breakdown by strategy used
  const byStrategy: Record<string, { calls: number; avgLatency: number; successRate: number }> = {};
  const stratGroups = new Map<string, typeof calls>();
  for (const call of calls) {
    const strat = call.strategyUsed ?? 'UNKNOWN';
    const group = stratGroups.get(strat) ?? [];
    group.push(call);
    stratGroups.set(strat, group);
  }
  for (const [strat, group] of stratGroups) {
    byStrategy[strat] = {
      calls: group.length,
      avgLatency: Math.round(
        group.reduce((sum: number, call: { latencyMs: number }) => sum + call.latencyMs, 0) / group.length,
      ),
      successRate: group.filter((call: { success: boolean }) => call.success).length / group.length,
    };
  }

  // AI classification summary (for all calls that went through AI classification).
  // Filter: aiClassification must be a non-null object (not Prisma.JsonNull sentinel or plain null).
  // We check typeof === 'object' && !== null to guard against both SQL NULL (returns null)
  // and the rare Prisma.JsonNull sentinel that may appear with certain Prisma versions.
  const aiCalls = calls.filter((call) => {
    const v = call.aiClassification;
    return v !== null && typeof v === 'object';
  });
  // Always return a populated summary (with zeros when no AUTO calls have been made)
  // so callers can rely on ai_routing_summary always being an object, never null.
  // byTool shows which tools were selected for AI-classified queries, enabling developers
  // to see routing patterns (e.g. tavily for realtime, exa-search for deep research).
  const aiRouting: { total_ai_routed_calls: number; by_type: Record<string, number>; by_domain: Record<string, number>; by_tool: Record<string, number> } = {
    total_ai_routed_calls: aiCalls.length,
    by_type: {} as Record<string, number>,
    by_domain: {} as Record<string, number>,
    by_tool: {} as Record<string, number>,
  };
  for (const call of aiCalls) {
    const classification = call.aiClassification as Record<string, unknown> | null;
    const queryType = typeof classification?.['type'] === 'string' ? classification['type'] : null;
    const queryDomain = typeof classification?.['domain'] === 'string' ? classification['domain'] : null;
    if (queryType) {
      aiRouting.by_type[queryType] = (aiRouting.by_type[queryType] ?? 0) + 1;
    }
    if (queryDomain) {
      aiRouting.by_domain[queryDomain] = (aiRouting.by_domain[queryDomain] ?? 0) + 1;
    }
    // Record which tool handled each AI-routed call (exclude capability-name fallbacks)
    if (call.toolUsed && call.toolUsed !== 'unknown' && !call.toolUsed.endsWith('-unavailable') && !CAPABILITY_NAMES.has(call.toolUsed)) {
      aiRouting.by_tool[call.toolUsed] = (aiRouting.by_tool[call.toolUsed] ?? 0) + 1;
    }
  }

  return {
    period: { days, since: since.toISOString() },
    totalCalls,
    successRate: totalCalls > 0 ? successCalls / totalCalls : 0,
    fallbackRate: totalCalls > 0 ? fallbackCalls / totalCalls : 0,
    avgLatencyMs: avgLatency,
    totalCostUsd: Math.round(platformCost * 100) / 100,
    totalToolCostUsd: Math.round((platformCost + byokSavings) * 100) / 100,
    byokSavingsUsd: Math.round(byokSavings * 100) / 100,
    byokCalls,
    byokCoverageRate: totalCalls > 0 ? byokCalls / totalCalls : 0,
    byCapability,
    byTool,
    byStrategy,
    aiRouting,
  };
}

/**
 * Get fallback analytics.
 */
export async function getFallbackStats(developerId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  // withRetry: mirrors the fix applied to getUsageStats — transient Neon HTTP errors cause
  // unnecessary 500s from the fallbacks endpoint without retry. Safe to retry since reads are idempotent.
  const fallbackCalls = await withRetry(() => db.routerCall.findMany({
    where: {
      developerId,
      fallbackUsed: true,
      createdAt: { gte: since },
    },
    select: {
      fallbackFrom: true,
      toolUsed: true,
      capability: true,
      latencyMs: true,
      createdAt: true,
    },
  }));

  // Mirrors the filter in analytics.ts and getUsageStats: exclude 'unknown', empty strings,
  // and capability-name fallbacks (e.g. 'search', 'crawl') from per-tool breakdown so legacy
  // records don't pollute the recovery stats shown in the weekly report and fallbacks endpoint.
  const CAPABILITY_NAMES = new Set(['search', 'crawl', 'embed', 'finance', 'code', 'communication', 'translation', 'ocr', 'storage', 'payments', 'auth', 'scheduling', 'ai', 'observability']);
  const isValidTool = (t: string | null) => t && t !== 'unknown' && !t.endsWith('-unavailable') && !CAPABILITY_NAMES.has(t);

  const triggersByTool: Record<string, number> = {};
  const recoveriesByTool: Record<string, number> = {};
  for (const call of fallbackCalls) {
    if (call.fallbackFrom && isValidTool(call.fallbackFrom)) {
      triggersByTool[call.fallbackFrom] = (triggersByTool[call.fallbackFrom] ?? 0) + 1;
    }
    if (isValidTool(call.toolUsed)) {
      recoveriesByTool[call.toolUsed] = (recoveriesByTool[call.toolUsed] ?? 0) + 1;
    }
  }

  return {
    period: { days, since: since.toISOString() },
    totalFallbacks: fallbackCalls.length,
    triggersByTool,
    recoveriesByTool,
  };
}
