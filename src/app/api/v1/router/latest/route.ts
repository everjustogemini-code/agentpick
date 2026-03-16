import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { prisma, withRetry } from '@/lib/prisma';
import { ensureDeveloperAccount } from '@/lib/router/sdk';
import { apiError } from '@/types';

/**
 * GET /api/v1/router/latest
 * Authenticated — returns the most recent RouterCall for the authenticated agent.
 */
export async function GET(request: NextRequest) {
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
    // Capability names stored as toolUsed fallback in recordRouterCall must be filtered
    // here to stay consistent with the analytics.ts and sdk.ts getUsageStats filters.
    const CAPABILITY_NAMES = [
      'search', 'crawl', 'embed', 'finance', 'code', 'communication',
      'translation', 'ocr', 'storage', 'payments', 'auth', 'scheduling', 'ai', 'observability',
    ];
    // withRetry: findFirst can fail with P1017/fetch-failed after ensureDeveloperAccount
    // clears the Neon singleton. Without retry, a transient drop returns { call: null }.
    const call = await withRetry(() => prisma.routerCall.findFirst({
      where: {
        developerId: account.id,
        // Exclude legacy/failure records where toolUsed was not properly recorded
        // NOTE: Use NOT: { OR: [...] } form — NOT array form is fragile across Prisma versions.
        // Do NOT rewrite to NOT: [{...}] or AND:[{NOT:...}].
        NOT: {
          OR: [
            { toolUsed: { in: ['unknown', '', ...CAPABILITY_NAMES] } },
            { toolUsed: { endsWith: '-unavailable' } },
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        capability: true,
        query: true,
        toolRequested: true,
        toolUsed: true,
        strategyUsed: true,
        latencyMs: true,
        costUsd: true,
        resultCount: true,
        byokUsed: true,
        success: true,
        fallbackUsed: true,
        fallbackFrom: true,
        fallbackChain: true,
        statusCode: true,
        traceId: true,
        aiClassification: true,
        totalMs: true,
        createdAt: true,
      },
    }));

    const normalizedCall = call ? {
      ...call,
      // snake_case aliases — dashboard and QA tests read tool_used, latency_ms, etc.
      // Must remain in sync with /calls endpoint normalization.
      tool_used: call.toolUsed,
      latency_ms: call.latencyMs,
      cost_usd: call.costUsd,
      trace_id: call.traceId,
      strategy_used: call.strategyUsed,
      byok_used: call.byokUsed,
      fallback_used: call.fallbackUsed,
      fallback_from: call.fallbackFrom,
      fallback_chain: call.fallbackChain,
      status_code: call.statusCode,
      result_count: call.resultCount,
      tool_requested: call.toolRequested,
      created_at: call.createdAt,
      ai_classification: call.aiClassification,
      // classification_ms is not stored in DB — emit null for API consistency with /calls
      classification_ms: null as number | null,
      total_ms: call.totalMs ?? null,
      response_preview: null as string | null,
      // Expose ai_routing_summary as the full aiClassification object (same fix as /calls).
      // Previously returned only aiClassification.reasoning which is rarely set.
      ai_routing_summary: (call.aiClassification && typeof call.aiClassification === 'object')
        ? call.aiClassification
        : null,
    } : null;

    return Response.json(
      { call: normalizedCall },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          'Vary': 'Authorization',
        },
      },
    );
  } catch {
    return Response.json({ call: null }, { status: 200 });
  }
}
