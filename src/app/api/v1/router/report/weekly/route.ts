import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { ensureDeveloperAccount, getUsageStats, getFallbackStats } from '@/lib/router/sdk';
import { apiError } from '@/types';

export async function GET(request: NextRequest) {
  // Early short-circuit: reject missing/whitespace auth before any DB lookup.
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

  try {
  const account = await ensureDeveloperAccount(agent.id);

  const [usage, fallbacks] = await Promise.all([
    getUsageStats(account.id, 7),
    getFallbackStats(account.id, 7),
  ]);

  const topTool = Object.entries(usage.byTool).sort(
    ([, a], [, b]) => (b as any).calls - (a as any).calls,
  )[0];

  const recommendations: string[] = [];

  if (usage.totalCalls > 0 && usage.successRate < 0.95) {
    recommendations.push('Success rate is below 95%. Consider enabling fallback or switching strategy.');
  }
  if (usage.fallbackRate > 0.1) {
    recommendations.push(
      `Fallback rate is ${Math.round(usage.fallbackRate * 100)}%. Primary tool may be unreliable — consider changing priority tools.`,
    );
  }
  if (usage.avgLatencyMs > 1000) {
    recommendations.push('Average latency is over 1s. Try "FASTEST" strategy, which picks the most stable and low-latency tool.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Everything looks healthy. No changes recommended.');
  }

  const summary = [
    `Weekly Router Report (${usage.period.since.slice(0, 10)} to ${new Date().toISOString().slice(0, 10)})`,
    `${usage.totalCalls} calls | $${usage.totalCostUsd} spent | ${usage.totalCalls > 0 ? Math.round(usage.successRate * 100) + '% success' : 'no data'} | ${usage.avgLatencyMs}ms avg`,
    topTool ? `Top tool: ${topTool[0]} (${(topTool[1] as any).calls} calls)` : 'No calls this week.',
    `Fallbacks triggered: ${fallbacks.totalFallbacks}`,
    `Strategy: ${account.strategy} | Plan: ${account.plan}`,
  ].join('\n');

  return Response.json({
    summary,
    stats: usage,
    fallbacks,
    account: {
      plan: account.plan,
      strategy: account.strategy,
    },
    recommendations,
  }, {
    headers: {
      'Cache-Control': 'no-store',
      'Vary': 'Authorization',
    },
  });
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] GET /api/v1/router/report/weekly error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
