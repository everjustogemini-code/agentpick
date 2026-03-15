import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { ensureDeveloperAccount } from '@/lib/router/sdk';
import { apiError } from '@/types';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Reject missing/whitespace auth early to avoid unnecessary DB lookup
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

    const account = await ensureDeveloperAccount(agent.id);
    const url = new URL(request.url);
    const parsedLimit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    const limit = Math.min(Math.max(isNaN(parsedLimit) ? 20 : parsedLimit, 1), 50);
    const capability = url.searchParams.get('capability') ?? undefined;
    const tool = url.searchParams.get('tool') ?? undefined;
    const strategy = url.searchParams.get('strategy') ?? undefined;
    const from = url.searchParams.get('from') ?? undefined;
    const to = url.searchParams.get('to') ?? undefined;

    // Capability names used as last-resort fallback in recordRouterCall — must be filtered
    // here to stay consistent with the analytics.ts and sdk.ts getUsageStats filters.
    const CAPABILITY_NAMES = [
      'search', 'crawl', 'embed', 'finance', 'code', 'communication',
      'translation', 'ocr', 'storage', 'payments', 'auth', 'scheduling', 'ai', 'observability',
    ];
    const where: Record<string, unknown> = {
      developerId: account.id,
      // Exclude legacy/failure records where toolUsed was not properly recorded
      NOT: [
        { toolUsed: { in: ['unknown', '', ...CAPABILITY_NAMES] } },
        { toolUsed: { endsWith: '-unavailable' } },
      ],
    };
    if (capability) {
      where.capability = capability;
    }
    if (tool) {
      where.toolUsed = tool;
    }
    if (strategy) {
      // Normalize canonical router strategy names to stored SDK enum names
      const CANONICAL_TO_SDK: Record<string, string> = {
        most_stable: 'FASTEST',
        best_performance: 'MOST_ACCURATE',
      };
      where.strategyUsed = CANONICAL_TO_SDK[strategy.toLowerCase()] ?? strategy.toUpperCase();
    }
    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) createdAt.gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) createdAt.lte = toDate;
      }
      if (Object.keys(createdAt).length > 0) {
        where.createdAt = createdAt;
      }
    }

    const calls = await prisma.routerCall.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
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
        createdAt: true,
      },
    });

    return Response.json({ calls });
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] GET /api/v1/router/calls error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
