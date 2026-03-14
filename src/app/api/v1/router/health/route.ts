import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureDeveloperAccount } from '@/lib/router/sdk';
import { apiError } from '@/types';

const db = prisma as any;

export async function GET(request: NextRequest) {
  // Short-circuit before any DB lookup for clearly unauthenticated requests.
  // Wrap URL parsing: a malformed URL must yield 401, not an unhandled 500.
  const _authHeader = request.headers.get('authorization');
  let _urlForAuth: URL;
  try { _urlForAuth = new URL(request.url); } catch { return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401); }
  if (!_authHeader?.trim() && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  try {
    let agent: Awaited<ReturnType<typeof authenticateAgent>>;
    try { agent = await authenticateAgent(request); } catch { return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401); }
    if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

    const account = await ensureDeveloperAccount(agent.id);
    const since = new Date();
    since.setHours(since.getHours() - 1);

    const recentCalls = await db.routerCall.findMany({
      where: { developerId: account.id, createdAt: { gte: since } },
      select: { success: true, latencyMs: true, toolUsed: true, fallbackUsed: true },
    });

    const total = recentCalls.length;
    const successCount = recentCalls.filter((call: { success: boolean }) => call.success).length;
    const fallbackCount = recentCalls.filter((call: { fallbackUsed: boolean }) => call.fallbackUsed).length;
    const avgLatency =
      total > 0 ? Math.round(recentCalls.reduce((sum: number, call: { latencyMs: number }) => sum + call.latencyMs, 0) / total) : 0;

    const successRate = total > 0 ? successCount / total : 0;
    let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    if (total === 0) status = 'unknown';
    else if (successRate >= 0.99) status = 'healthy';
    else if (successRate >= 0.90) status = 'degraded';
    else status = 'unhealthy';

    return Response.json({
      status,
      lastHour: {
        totalCalls: total,
        successRate: Math.round(successRate * 100) / 100,
        fallbackRate: total > 0 ? Math.round((fallbackCount / total) * 100) / 100 : 0,
        avgLatencyMs: avgLatency,
      },
      strategy: account.strategy,
      plan: account.plan,
    });
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] GET /api/v1/router/health error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
