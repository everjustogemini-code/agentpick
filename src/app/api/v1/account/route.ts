import { NextRequest, NextResponse } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { getBillingPeriodStart } from '@/lib/router/billing';
import { ROUTER_PLAN_MONTHLY_LIMITS } from '@/lib/router/plans';
import { checkUsageLimit, ensureDeveloperAccount } from '@/lib/router/sdk';
import { apiError } from '@/types';
import { prisma, withRetry } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Same auth guard as /router/usage
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
    const billingCycleStart = getBillingPeriodStart(account.billingCycleStart);

    const [limits, callsThisMonth] = await Promise.all([
      checkUsageLimit(account.id, account.plan, account.billingCycleStart),
      withRetry(() => (prisma as any).routerCall.count({
        where: {
          developerId: account.id,
          createdAt: { gte: billingCycleStart },
        },
      })),
    ]);

    const monthlyLimit = (ROUTER_PLAN_MONTHLY_LIMITS as Record<string, number | null>)[account.plan] ?? null;

    const body = {
      plan: account.plan,
      monthlyLimit,
      callsThisMonth,
      strategy: account.strategy,
      _note: 'Prefer /api/v1/router/usage — this alias will be removed in v2',
    };

    return NextResponse.json(body, {
      headers: {
        'Deprecation': 'true',
        'Cache-Control': 'no-store',
        'Vary': 'Authorization',
      },
    });
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] GET /api/v1/account error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
