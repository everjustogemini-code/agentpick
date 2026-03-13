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
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  try {
    const account = await ensureDeveloperAccount(agent.id);

    const db = prisma as any;
    const call = await db.routerCall.findFirst({
      where: { developerId: account.id },
      orderBy: { createdAt: 'desc' },
      select: {
        query: true,
        toolUsed: true,
        latencyMs: true,
        costUsd: true,
        capability: true,
        aiClassification: true,
        strategyUsed: true,
        fallbackUsed: true,
        success: true,
        createdAt: true,
      },
    });

    return Response.json(
      { call: call ?? null },
      {
        headers: {
          'Cache-Control': 'private, max-age=5',
        },
      },
    );
  } catch {
    return Response.json({ call: null }, { status: 200 });
  }
}
