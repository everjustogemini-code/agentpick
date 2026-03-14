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
  const days = Math.min(parseInt(url.searchParams.get('days') ?? '7', 10), 90);

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
