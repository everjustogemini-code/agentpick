import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { ensureDeveloperAccount } from '@/lib/router/sdk';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/types';

const db = prisma as any;

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const account = await ensureDeveloperAccount(agent.id);
  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20', 10), 1), 50);
  const capability = url.searchParams.get('capability') ?? undefined;

  const where: Record<string, unknown> = { developerId: account.id };
  if (capability) {
    where.capability = capability;
  }

  const calls = await db.routerCall.findMany({
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
      success: true,
      fallbackUsed: true,
      fallbackFrom: true,
      fallbackChain: true,
      statusCode: true,
      traceId: true,
      createdAt: true,
    },
  });

  return Response.json({ calls });
}
