import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    const monthlyLimit = (ROUTER_PLAN_MONTHLY_LIMITS as Record<string, number | null>)[account.plan] ?? 500;
    const overagePerCall = (ROUTER_PLAN_OVERAGE_PER_CALL as Record<string, number | null>)[account.plan] ?? null;
    const billingCycleStart = getBillingPeriodStart(account.billingCycleStart);
    const callsThisMonth = await db.routerCall.count({
      where: { developerId: account.id, createdAt: { gte: billingCycleStart } },
    });
    const includedCallsUsed = monthlyLimit !== null ? Math.min(callsThisMonth, monthlyLimit) : callsThisMonth;
    const overageCalls = monthlyLimit !== null ? Math.max(0, callsThisMonth - monthlyLimit) : 0;
    const overageCostUsd = overagePerCall !== null ? overageCalls * overagePerCall : 0;

    return Response.json({
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
          hardCapped: overagePerCall === null,
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
        return apiError('VALIDATION_ERROR', 'strategy must be one of: BALANCED, FASTEST, CHEAPEST, MOST_ACCURATE, MANUAL, AUTO', 400);
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
    if (typeof body.max_fallbacks === 'number') {
      update.maxFallbacks = Math.min(Math.max(body.max_fallbacks, 0), 5);
    }
    if (typeof body.latency_budget_ms === 'number' || body.latency_budget_ms === null) {
      update.latencyBudgetMs = body.latency_budget_ms;
    }
    if (typeof body.monthly_budget_usd === 'number' || body.monthly_budget_usd === null) {
      update.monthlyBudgetUsd = body.monthly_budget_usd;
    }

    if (Object.keys(update).length === 0) {
      return apiError('VALIDATION_ERROR', 'No valid fields to update.', 400);
    }

    const updated = await db.developerAccount.update({
      where: { id: account.id },
      data: update,
    });

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
