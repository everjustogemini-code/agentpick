import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { ensureDeveloperAccount, getFallbackStats } from '@/lib/router/sdk';
import { apiError } from '@/types';

export async function GET(request: NextRequest) {
  // Short-circuit for missing/whitespace auth — avoids DB lookup for clearly unauthenticated requests
  const _authHeader = request.headers.get('authorization');
  let _urlForAuth: URL;
  try { _urlForAuth = new URL(request.url); } catch { return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401); }
  if (!_authHeader?.trim() && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }
  if (_authHeader && !_authHeader.trim().toLowerCase().startsWith('bearer ') && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  try {
    let agent: Awaited<ReturnType<typeof authenticateAgent>>;
    try {
      agent = await authenticateAgent(request);
    } catch {
      return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
    }
    if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

    const account = await ensureDeveloperAccount(agent.id);
    const url = new URL(request.url);
    // Accept ?days=N or ?period=Nd (e.g. ?period=7d) — mirrors usage endpoint parameter handling
    const daysParam = url.searchParams.get('days');
    const periodParam = url.searchParams.get('period');
    let rawDays = 30;
    if (daysParam) {
      const parsed = parseInt(daysParam, 10);
      if (!isNaN(parsed)) rawDays = parsed;
    } else if (periodParam) {
      const m = periodParam.match(/^(\d+)d$/);
      if (m) rawDays = parseInt(m[1], 10);
    }
    const days = Math.min(Math.max(rawDays, 1), 90);

    const stats = await getFallbackStats(account.id, days);
    return Response.json(stats);
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] GET /api/v1/router/fallbacks error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
