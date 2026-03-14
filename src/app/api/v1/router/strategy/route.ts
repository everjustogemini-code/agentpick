import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { ensureDeveloperAccount, normalizeStrategy } from '@/lib/router/sdk';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/types';

const db = prisma as any;

export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const account = await ensureDeveloperAccount(agent.id);

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
    return apiError('VALIDATION_ERROR', 'strategy must be one of: balanced, fastest, cheapest, best_quality, auto, custom', 400);
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
