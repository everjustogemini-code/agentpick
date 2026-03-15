import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureDeveloperAccount } from '@/lib/router/sdk';
import { apiError } from '@/types';

const db = prisma as any;

export async function GET(request: NextRequest) {
  // Health endpoint is public — no auth required for basic status.
  // If a valid API key is provided, return personalized account health data.
  const _authHeader = request.headers.get('authorization');
  let _urlForAuth: URL;
  try { _urlForAuth = new URL(request.url); } catch { _urlForAuth = new URL('https://placeholder.local/'); }

  const hasAuth = (_authHeader?.trim() && _authHeader.trim().toLowerCase().startsWith('bearer ')) ||
    _urlForAuth.searchParams.get('token')?.startsWith('ah_');

  try {
    let agent: Awaited<ReturnType<typeof authenticateAgent>> | null = null;
    if (hasAuth) {
      try { agent = await authenticateAgent(request); } catch { /* unauthenticated — return public health */ }
    }

    // If no valid auth, return a basic public health response
    if (!agent) {
      return Response.json({ status: 'healthy', message: 'AgentPick router is operational.' });
    }

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
