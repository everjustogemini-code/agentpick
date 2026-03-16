import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { prisma, withRetry } from '@/lib/prisma';
import {
  ROUTER_PLAN_MONTHLY_LIMITS,
  ROUTER_PLAN_OVERAGE_PER_CALL,
  getRouterPlanLabel,
  getRouterPlanSlug,
} from '@/lib/router/plans';
import { getBillingPeriodStart } from '@/lib/router/billing';
import { ensureDeveloperAccount, normalizeStrategy } from '@/lib/router/sdk';
import { apiError } from '@/types';

const db = prisma as any;

export async function GET(request: NextRequest) {
  try {
    const _authHeader = request.headers.get('authorization');
    let _urlForAuth: URL;
    try { _urlForAuth = new URL(request.url); } catch { return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401); }
    if (!_authHeader?.trim() && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
      return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
    }
    if (_authHeader && !_authHeader.trim().toLowerCase().startsWith('bearer ') && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
      return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
    }
    let agent: Awaited<ReturnType<typeof authenticateAgent>>;
    try { agent = await authenticateAgent(request); } catch { return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401); }
    if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

    const account = await ensureDeveloperAccount(agent.id);
    const monthlyLimit = (ROUTER_PLAN_MONTHLY_LIMITS as Record<string, number | null>)[account.plan] ?? null;
    const overagePerCall = (ROUTER_PLAN_OVERAGE_PER_CALL as Record<string, number | null>)[account.plan] ?? null;
    const billingCycleStart = getBillingPeriodStart(account.billingCycleStart);
    // withRetry: routerCall.count can fail with P1017/fetch-failed after ensureDeveloperAccount
    // clears the Neon singleton on a transient error. Without retry, the account endpoint
    // returns 500 and callsThisMonth is unavailable for the dashboard and QA checks.
    const callsThisMonth = await withRetry(() => prisma.routerCall.count({
      where: { developerId: account.id, createdAt: { gte: billingCycleStart } },
    }));
    const includedCallsUsed = monthlyLimit !== null ? Math.min(callsThisMonth, monthlyLimit) : callsThisMonth;
    const overageCalls = monthlyLimit !== null ? Math.max(0, callsThisMonth - monthlyLimit) : 0;
    const overageCostUsd = overagePerCall !== null ? overageCalls * overagePerCall : 0;

    return Response.json({
      // Top-level convenience fields for clients that check data.plan / data.strategy directly
      plan: account.plan,
      strategy: account.strategy,
      monthlyLimit,
      callsThisMonth,
      account: {
        id: account.id,
        email: agent.ownerEmail ?? null,
        plan: account.plan,
        planLabel: getRouterPlanLabel(account.plan),
        planSlug: getRouterPlanSlug(account.plan),
        strategy: account.strategy,
        priorityTools: account.priorityTools,
        excludedTools: account.excludedTools,
        fallbackEnabled: account.fallbackEnabled,
        maxFallbacks: account.maxFallbacks,
        latencyBudgetMs: account.latencyBudgetMs,
        monthlyBudgetUsd: account.monthlyBudgetUsd,
        spentThisMonth: account.spentThisMonth,
        totalCalls: account.totalCalls,
        totalFallbacks: account.totalFallbacks,
        billingCycleStart: account.billingCycleStart,
        usage: {
          monthlyLimit,
          monthlyUsed: callsThisMonth,
          monthlyRemaining: monthlyLimit !== null ? Math.max(0, monthlyLimit - callsThisMonth) : null,
          includedCallsUsed,
          overageCalls,
          overagePerCall,
          overageCostUsd,
          // Hard cap means requests are blocked once the monthly limit is reached.
          // ENTERPRISE has no monthly limit (null), so it cannot be hard-capped even though
          // overagePerCall is also null. Only plans with a finite limit and no overage billing qualify.
          hardCapped: overagePerCall === null && monthlyLimit !== null,
        },
        createdAt: account.createdAt,
      },
    });
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] GET /api/v1/router/account error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const _authHeader = request.headers.get('authorization');
    let _urlForAuth: URL;
    try { _urlForAuth = new URL(request.url); } catch { return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401); }
    if (!_authHeader?.trim() && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
      return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
    }
    if (_authHeader && !_authHeader.trim().toLowerCase().startsWith('bearer ') && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
      return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
    }
    let agent: Awaited<ReturnType<typeof authenticateAgent>>;
    try { agent = await authenticateAgent(request); } catch { return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401); }
    if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

    const account = await ensureDeveloperAccount(agent.id);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
    }

    const update: Record<string, unknown> = {};
    if (body.strategy && typeof body.strategy === 'string') {
      const normalized = normalizeStrategy(body.strategy);
      if (!normalized) {
        return apiError('VALIDATION_ERROR', 'strategy must be one of: AUTO, BALANCED, FASTEST, CHEAPEST, MOST_ACCURATE, MANUAL (or aliases: best_performance, most_stable, custom)', 400);
      }
      update.strategy = normalized;
    }
    if (Array.isArray(body.priority_tools)) {
      update.priorityTools = body.priority_tools.filter((tool: unknown) => typeof tool === 'string');
    }
    if (Array.isArray(body.excluded_tools)) {
      update.excludedTools = body.excluded_tools.filter((tool: unknown) => typeof tool === 'string');
    }
    if (typeof body.fallback_enabled === 'boolean') {
      update.fallbackEnabled = body.fallback_enabled;
    }
    if (typeof body.max_fallbacks === 'number' && !isNaN(body.max_fallbacks)) {
      // Truncate to integer — Prisma Int column rejects floats with a 500 instead of a 400
      update.maxFallbacks = Math.min(Math.max(Math.trunc(body.max_fallbacks), 0), 5);
    }
    if (typeof body.latency_budget_ms === 'number' || body.latency_budget_ms === null) {
      if (body.latency_budget_ms !== null && body.latency_budget_ms < 1) {
        return apiError('VALIDATION_ERROR', 'latency_budget_ms must be a positive integer (milliseconds) or null to clear the limit.', 400);
      }
      // Truncate to integer — Prisma Int? column rejects floats with a 500 instead of a 400
      update.latencyBudgetMs = body.latency_budget_ms !== null ? Math.trunc(body.latency_budget_ms) : null;
    }
    if (typeof body.monthly_budget_usd === 'number' || body.monthly_budget_usd === null) {
      if (body.monthly_budget_usd !== null && body.monthly_budget_usd < 0) {
        return apiError('VALIDATION_ERROR', 'monthly_budget_usd must be a non-negative number or null to clear the limit.', 400);
      }
      if (typeof body.monthly_budget_usd === 'number' && body.monthly_budget_usd > 100_000) {
        return apiError('VALIDATION_ERROR', 'Budget cannot exceed $100,000.', 400);
      }
      update.monthlyBudgetUsd = body.monthly_budget_usd;
    }

    if (Object.keys(update).length === 0) {
      return apiError('VALIDATION_ERROR', 'No valid fields to update.', 400);
    }

    // withRetry: update can fail with P1017/fetch-failed after ensureDeveloperAccount
    // clears the Neon singleton on a transient error. Without retry, PATCH /account returns 500.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated: any = await withRetry(() => db.developerAccount.update({
      where: { id: account.id },
      data: update,
    }));

    return Response.json({
      message: 'Account updated.',
      account: {
        strategy: updated.strategy,
        priorityTools: updated.priorityTools,
        excludedTools: updated.excludedTools,
        fallbackEnabled: updated.fallbackEnabled,
        maxFallbacks: updated.maxFallbacks,
        latencyBudgetMs: updated.latencyBudgetMs,
        monthlyBudgetUsd: updated.monthlyBudgetUsd,
      },
    });
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] PATCH /api/v1/router/account error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
