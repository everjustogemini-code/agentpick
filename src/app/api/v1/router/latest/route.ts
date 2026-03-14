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
    const call = await prisma.routerCall.findFirst({
      where: {
        developerId: account.id,
        // Exclude legacy records where toolUsed was not properly recorded
        NOT: [{ toolUsed: 'unknown' }, { toolUsed: '' }, { toolUsed: { endsWith: '-unavailable' } }],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        query: true,
        toolUsed: true,
        latencyMs: true,
        costUsd: true,
        byokUsed: true,
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
