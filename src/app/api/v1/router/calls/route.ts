import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { ensureDeveloperAccount, normalizeStrategy } from '@/lib/router/sdk';
import { apiError } from '@/types';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

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

    let account: Awaited<ReturnType<typeof ensureDeveloperAccount>>;
    try {
      account = await ensureDeveloperAccount(agent.id);
    } catch (ensureErr) {
      const reqId2 = request.headers.get('x-request-id') ?? 'unknown';
      console.error(`[${reqId2}] calls: ensureDeveloperAccount failed:`, ensureErr);
      return apiError('INTERNAL_ERROR', 'Account lookup failed.', 500);
    }
    const url = new URL(request.url);

    const isExport = url.searchParams.get('export') === 'true';
    const parsedLimit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    const limit = isExport ? 10000 : Math.min(Math.max(isNaN(parsedLimit) ? 20 : parsedLimit, 1), 50);

    const capability = url.searchParams.get('capability') ?? undefined;
    const tool = url.searchParams.get('tool') ?? undefined;
    const strategy = url.searchParams.get('strategy') ?? undefined;
    // Support both 'from'/'to' and 'date_from'/'date_to' parameter names
    const from = url.searchParams.get('date_from') ?? url.searchParams.get('from') ?? undefined;
    const to = url.searchParams.get('date_to') ?? url.searchParams.get('to') ?? undefined;

    // Capability names used as last-resort fallback in recordRouterCall — must be filtered
    // here to stay consistent with the analytics.ts and sdk.ts getUsageStats filters.
    const CAPABILITY_NAMES = [
      'search', 'crawl', 'embed', 'finance', 'code', 'communication',
      'translation', 'ocr', 'storage', 'payments', 'auth', 'scheduling', 'ai', 'observability',
    ];
    // Build WHERE clause with NOT at the top level (alongside developerId) to avoid the
    // AND: [{NOT:cond1},{NOT:cond2}] anti-pattern that breaks Prisma 7.x findMany.
    // NOTE: Do NOT rewrite this to NOT: [{...}] array form or AND:[{NOT:...},{NOT:...}].
    // NOT: { OR: [...] } at the top level is the documented stable form (NEXT_VERSION.md Fix #1).
    // Both `in` and `endsWith` conditions must remain here — growth commit 0a1369ce
    // incorrectly claimed endsWith broke findMany; the real cause was the AND array form
    // produced when optional filters were combined via andFilters.push(). Top-level NOT is safe.
    const where: Prisma.RouterCallWhereInput = {
      developerId: account.id,
      // Exclude legacy/failure records where toolUsed was not properly recorded.
      NOT: {
        OR: [
          { toolUsed: { in: ['unknown', '', ...CAPABILITY_NAMES] } },
          { toolUsed: { endsWith: '-unavailable' } },
        ],
      },
    };
    if (capability) {
      (where as Record<string, unknown>).capability = capability;
    }
    if (tool) {
      (where as Record<string, unknown>).toolUsed = tool;
    }
    if (strategy) {
      const normalizedStrat = normalizeStrategy(strategy);
      if (!normalizedStrat) {
        return apiError('VALIDATION_ERROR', `Invalid strategy "${strategy}". Must be one of: BALANCED, FASTEST, CHEAPEST, MOST_ACCURATE, MANUAL, AUTO (or aliases: best_performance, most_stable, custom)`, 400);
      }
      (where as Record<string, unknown>).strategyUsed = normalizedStrat;
    }
    if (from || to) {
      const createdAtFilter: Prisma.DateTimeFilter = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) createdAtFilter.gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) createdAtFilter.lte = toDate;
      }
      if (createdAtFilter.gte || createdAtFilter.lte) {
        (where as Record<string, unknown>).createdAt = createdAtFilter;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let calls: any[];
    try {
      calls = await (prisma as any).routerCall.findMany({
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
        // totalMs + responsePreview omitted: migration 20260315_add_total_ms_response_preview
        // has NOT been applied to production DB — selecting these columns throws P2010.
        // Return null for both fields via normalizedCalls map below.
        createdAt: true,
      },
      });
    } catch (queryErr) {
      const reqId2 = request.headers.get('x-request-id') ?? 'unknown';
      console.error(`[${reqId2}] calls: findMany failed:`, queryErr instanceof Error ? queryErr.message : queryErr);
      return apiError('INTERNAL_ERROR', 'Query failed.', 500);
    }

    // Normalize to include all 9 drawer fields
    const normalizedCalls = calls.map(call => ({
      ...call,
      // classification_ms is not stored in DB (computed at classification time only) — emit null
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
    }));

    const headers: Record<string, string> = {};
    if (isExport) {
      headers['Content-Disposition'] = 'attachment; filename="calls-export.json"';
    }

    return Response.json({ calls: normalizedCalls }, { headers });
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] GET /api/v1/router/calls error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
