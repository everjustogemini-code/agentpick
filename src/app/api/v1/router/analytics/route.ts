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
  try {
    // Reject missing/whitespace auth early to avoid unnecessary DB lookup
    const _authHeader = request.headers.get('authorization');
    let _urlForAuth: URL;
    try { _urlForAuth = new URL(request.url); } catch { return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401); }
    if (!_authHeader?.trim() && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
      return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
    }

    let agent: Awaited<ReturnType<typeof authenticateAgent>>;
    try { agent = await authenticateAgent(request); } catch { return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401); }
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
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] GET /api/v1/router/analytics error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
