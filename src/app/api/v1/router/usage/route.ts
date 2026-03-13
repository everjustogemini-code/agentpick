import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { checkUsageLimit, ensureDeveloperAccount, getUsageStats } from '@/lib/router/sdk';
import { apiError } from '@/types';

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const account = await ensureDeveloperAccount(agent.id);
  const url = new URL(request.url);
  const days = Math.min(parseInt(url.searchParams.get('days') ?? '7', 10), 90);

  const [stats, limits] = await Promise.all([
    getUsageStats(account.id, days),
    checkUsageLimit(account.id, account.plan),
  ]);

  return Response.json({
    plan: account.plan,
    daily_limit: limits.limit,
    daily_used: limits.used,
    daily_remaining: limits.remaining,
    stats,
  });
}
