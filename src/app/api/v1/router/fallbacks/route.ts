import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { ensureDeveloperAccount, getFallbackStats } from '@/lib/router/sdk';
import { apiError } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

    const account = await ensureDeveloperAccount(agent.id);
    const url = new URL(request.url);
    const days = Math.min(parseInt(url.searchParams.get('days') ?? '30', 10), 90);

    const stats = await getFallbackStats(account.id, days);
    return Response.json(stats);
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] GET /api/v1/router/fallbacks error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
