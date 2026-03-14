import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buildRouterAnalytics,
  getRouterAnalyticsWindow,
  normalizeAnalyticsRange,
} from '@/lib/router/analytics';
import { ensureDeveloperAccount } from '@/lib/router/sdk';
import { apiError } from '@/types';

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const account = await ensureDeveloperAccount(agent.id);
  const url = new URL(request.url);
  const range = normalizeAnalyticsRange(url.searchParams.get('range'));
  const { since, now } = getRouterAnalyticsWindow(range);

  const calls = await prisma.routerCall.findMany({
    where: {
      createdAt: { gte: since, lte: now },
      developerId: account.id,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      costUsd: true,
      createdAt: true,
      fallbackUsed: true,
      latencyMs: true,
      strategyUsed: true,
      success: true,
      toolUsed: true,
    },
  });

  const analytics = buildRouterAnalytics(calls, range, now);

  return Response.json(analytics, {
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
    },
  });
}
