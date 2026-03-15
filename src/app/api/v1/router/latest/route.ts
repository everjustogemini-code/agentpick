import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    const call = await prisma.routerCall.findFirst({
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
        // totalMs + responsePreview omitted: migration 20260315_add_total_ms_response_preview
        // has NOT been applied to production DB — selecting these columns throws P2010.
        // Return null for both fields via normalizedCall map below (same as /calls endpoint).
        createdAt: true,
      },
    });

    const normalizedCall = call ? {
      ...call,
      // classification_ms is not stored in DB — emit null for API consistency with /calls
      classification_ms: null as number | null,
      // totalMs/responsePreview columns not yet in production DB (migration pending) — return null
      total_ms: null as number | null,
      response_preview: null as string | null,
      // Expose ai_routing_summary as a top-level field from aiClassification JSON
      ai_routing_summary: call.aiClassification &&
        typeof call.aiClassification === 'object' &&
        'reasoning' in (call.aiClassification as Record<string, unknown>)
          ? (call.aiClassification as Record<string, unknown>).reasoning as string
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
