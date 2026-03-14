import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { checkUsageLimit, ensureDeveloperAccount, getUsageStats } from '@/lib/router/sdk';
import { apiError } from '@/types';
import { prisma } from '@/lib/prisma';

const MONTHLY_LIMITS: Record<string, number | null> = {
  FREE: 10000,
  STARTER: 50000,
  PRO: 100000,
  ENTERPRISE: null,
};

export async function GET(request: NextRequest) {
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

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [stats, limits, callsThisMonth] = await Promise.all([
    getUsageStats(account.id, days),
    checkUsageLimit(account.id, account.plan),
    (prisma as any).routerCall.count({
      where: {
        developerId: account.id,
        createdAt: { gte: monthStart },
      },
    }),
  ]);

  return Response.json({
    plan: account.plan,
    daily_limit: limits.limit,
    daily_used: limits.used,
    daily_remaining: limits.remaining,
    stats,
    ai_routing_summary: stats.aiRouting,
    account: {
      plan: account.plan,
      monthlyLimit: MONTHLY_LIMITS[account.plan as string] ?? null,
      callsThisMonth,
      strategy: account.strategy,
    },
  });
}
