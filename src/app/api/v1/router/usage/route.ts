import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { getBillingPeriodStart } from '@/lib/router/billing';
import { ROUTER_PLAN_MONTHLY_LIMITS, getRouterPlanLabel } from '@/lib/router/plans';
import { checkUsageLimit, ensureDeveloperAccount, getUsageStats } from '@/lib/router/sdk';
import { apiError } from '@/types';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

    const account = await ensureDeveloperAccount(agent.id);
    const url = new URL(request.url);
    // Accept ?days=7 or ?period=7d (documented format used by QA and SDK clients)
    const daysParam = url.searchParams.get('days');
    const periodParam = url.searchParams.get('period');
    let days = 7;
    if (daysParam) {
      days = parseInt(daysParam, 10);
    } else if (periodParam) {
      const m = periodParam.match(/^(\d+)d$/);
      if (m) days = parseInt(m[1], 10);
    }
    days = Math.min(Math.max(days, 1), 90);

    const billingCycleStart = getBillingPeriodStart(account.billingCycleStart);

    const [stats, limits, callsThisMonth] = await Promise.all([
      getUsageStats(account.id, days),
      checkUsageLimit(account.id, account.plan, account.billingCycleStart),
      (prisma as any).routerCall.count({
        where: {
          developerId: account.id,
          createdAt: { gte: billingCycleStart },
        },
      }),
    ]);

    const monthlyLimit = (ROUTER_PLAN_MONTHLY_LIMITS as Record<string, number | null>)[account.plan] ?? null;

    return Response.json({
      plan: account.plan,
      plan_label: getRouterPlanLabel(account.plan),
      daily_limit: limits.limit,
      daily_used: limits.used,
      daily_remaining: limits.remaining,
      monthlyLimit,
      callsThisMonth,
      strategy: account.strategy,
      stats,
      ai_routing_summary: stats.aiRouting,
      account: {
        plan: account.plan,
        monthlyLimit,
        callsThisMonth,
        billingCycleStart: account.billingCycleStart,
        strategy: account.strategy,
      },
    });
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] GET /api/v1/router/usage error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
