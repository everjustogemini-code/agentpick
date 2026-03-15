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
        query: true,
        toolUsed: true,
        latencyMs: true,
        costUsd: true,
        resultCount: true,
        byokUsed: true,
        capability: true,
        aiClassification: true,
        strategyUsed: true,
        fallbackUsed: true,
        success: true,
        totalMs: true,
        responsePreview: true,
        createdAt: true,
      },
    });

    const normalizedCall = call ? {
      ...call,
      total_ms: call.totalMs ?? null,
      response_preview: call.responsePreview ?? null,
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
