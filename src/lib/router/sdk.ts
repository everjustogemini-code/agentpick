/**
 * Router SDK — Developer account management, strategy-based routing, usage tracking.
 * Extends the existing router core (./index.ts) without modifying it.
 */

import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
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
    custom: 'MANUAL',
    BEST_PERFORMANCE: 'MOST_ACCURATE',
    MOST_STABLE: 'FASTEST',
  };
  return aliases[upper] ?? null;
}

/**
 * Get or create a DeveloperAccount for an agent.
 */
export async function ensureDeveloperAccount(agentId: string) {
  let account = await db.developerAccount.findUnique({
    where: { agentId },
  });

  if (!account) {
    account = await db.developerAccount.create({
      data: {
        agentId,
        priorityTools: [],
        excludedTools: [],
      },
    });
  } else if (isNewBillingCycle(account.billingCycleStart)) {
    account = await db.developerAccount.update({
      where: { id: account.id },
      data: {
        spentThisMonth: 0,
        billingCycleStart: new Date(),
      },
    });
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

  const [todayCount, monthCount] = await Promise.all([
    db.routerCall.count({
      where: { developerId, createdAt: { gte: todayStart } },
    }),
    db.routerCall.count({
      where: { developerId, createdAt: { gte: monthStart } },
    }),
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
  if (!modified.tool && !modified.priority_tools?.length && account.strategy !== 'AUTO') {
    const best = getBestToolForStrategy(capability, account.strategy, account.excludedTools, account.latencyBudgetMs);
    if (best) {
      modified.tool = best;
    }
  }

  if (account.fallbackEnabled && !(modified.fallback?.length)) {
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
  _latencyBudgetMs: number | null,
): string | null {
  const routerStrategy = sdkToRouterStrategy(strategy);
  const ranked = getRankedToolsForCapability(capability, routerStrategy, exclude);
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
  };

  // Determine success: trace_id starting with "trace_fail_" means all tools failed
  const isSuccess = !meta.trace_id.startsWith('trace_fail_');
  const statusCode = isSuccess ? 200 : 502;

  const call = await db.routerCall.create({
    data: {
      developerId,
      capability,
      query,
      toolRequested: request.tool ?? null,
      toolUsed: meta.tool_used,
      fallbackUsed: meta.fallback_used,
      fallbackFrom: meta.fallback_from ?? null,
      fallbackChain,
      statusCode,
      latencyMs: meta.latency_ms,
      resultCount: meta.result_count ?? null,
      aiClassification: meta.ai_classification
        ? (meta.ai_classification as unknown as Prisma.InputJsonValue)
        : undefined,
      costUsd: meta.cost_usd ?? 0,
      success: isSuccess,
      strategyUsed,
      byokUsed,
      traceId: meta.trace_id,
    },
  });

  const currentAccount = await db.developerAccount.findUnique({
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
  });

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

    await db.developerAccount.update({
      where: { id: developerId },
      data: {
        totalCalls: { increment: 1 },
        totalFallbacks: meta.fallback_used ? { increment: 1 } : undefined,
        totalCostUsd: byokUsed ? (overageCost > 0 ? { increment: overageCost } : undefined) : { increment: totalCallCost },
        spentThisMonth: byokUsed
          ? (resetMonthlySpend ? overageCost : (currentAccount.spentThisMonth ?? 0) + overageCost)
          : (resetMonthlySpend ? totalCallCost : (currentAccount.spentThisMonth ?? 0) + totalCallCost),
        billingCycleStart: resetMonthlySpend ? new Date() : undefined,
        avgLatencyMs: nextAvgLatency,
      },
    });
  }

  return call;
}

/**
 * Get usage stats for a developer account.
 */
export async function getUsageStats(developerId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const calls = await db.routerCall.findMany({
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
  });

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

  const byTool: Record<string, { calls: number; avgLatency: number }> = {};
  const toolGroups = new Map<string, typeof calls>();
  for (const call of calls) {
    if (!call.toolUsed || call.toolUsed === 'unknown' || call.toolUsed.endsWith('-unavailable')) continue;
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

  // AI classification summary (for AUTO strategy calls)
  const aiCalls = calls.filter((call: { aiClassification: unknown; strategyUsed: string | null }) => call.strategyUsed === 'AUTO');
  const aiRouting = {
    totalAiRoutedCalls: aiCalls.length,
    byType: {} as Record<string, number>,
    byDomain: {} as Record<string, number>,
  };
  for (const call of aiCalls) {
    const classification = call.aiClassification as { type?: string; domain?: string } | null;
    if (classification?.type) {
      aiRouting.byType[classification.type] = (aiRouting.byType[classification.type] ?? 0) + 1;
    }
    if (classification?.domain) {
      aiRouting.byDomain[classification.domain] = (aiRouting.byDomain[classification.domain] ?? 0) + 1;
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

  const fallbackCalls = await db.routerCall.findMany({
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
  });

  const triggersByTool: Record<string, number> = {};
  const recoveriesByTool: Record<string, number> = {};
  for (const call of fallbackCalls) {
    if (call.fallbackFrom) {
      triggersByTool[call.fallbackFrom] = (triggersByTool[call.fallbackFrom] ?? 0) + 1;
    }
    recoveriesByTool[call.toolUsed] = (recoveriesByTool[call.toolUsed] ?? 0) + 1;
  }

  return {
    period: { days, since: since.toISOString() },
    totalFallbacks: fallbackCalls.length,
    triggersByTool,
    recoveriesByTool,
  };
}
