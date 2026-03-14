import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { ensureDeveloperAccount, normalizeStrategy } from '@/lib/router/sdk';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/types';

const db = prisma as any;

export async function POST(request: NextRequest) {
  // Short-circuit before any DB lookup for clearly unauthenticated requests.
  const _authHeader = request.headers.get('authorization');
  let _urlForAuth: URL;
  try { _urlForAuth = new URL(request.url); } catch { return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401); }
  if (!_authHeader?.trim() && !_urlForAuth.searchParams.has('token')) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  let agent: Awaited<ReturnType<typeof authenticateAgent>>;
  try {
    agent = await authenticateAgent(request);
  } catch {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  let account: Awaited<ReturnType<typeof ensureDeveloperAccount>>;
  try {
    account = await ensureDeveloperAccount(agent.id);
  } catch {
    return apiError('INTERNAL_ERROR', 'Account lookup failed.', 500);
  }

  let body: { strategy?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  if (!body.strategy) {
    return apiError('VALIDATION_ERROR', 'strategy is required.', 400);
  }

  const normalized = normalizeStrategy(body.strategy);
  if (!normalized) {
    return apiError('VALIDATION_ERROR', 'strategy must be one of: AUTO, BALANCED, FASTEST, CHEAPEST, MOST_ACCURATE, MANUAL (or aliases: best_performance, most_stable, custom)', 400);
  }

  try {
    const updated = await db.developerAccount.update({
      where: { id: account.id },
      data: { strategy: normalized },
    });

    return Response.json({
      message: 'Strategy updated.',
      strategy: updated.strategy,
    });
  } catch (err) {
    console.error('Strategy update failed:', err);
    return apiError('INTERNAL_ERROR', 'Failed to update strategy.', 500);
  }
}
