import { NextRequest } from 'next/server';
import { authenticateAgent, generateApiKey, hashApiKey } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/types';

const db = prisma as any;

/**
 * GET /api/v1/router/keys — Return masked API key info for the authenticated agent.
 */
export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  return Response.json({
    keyPrefix: agent.apiKeyHash ? 'ap_***' : null,
    createdAt: agent.createdAt ?? null,
    message: 'Use POST /api/v1/router/keys to rotate your API key.',
  });
}

/**
 * POST /api/v1/router/keys — Rotate the API key for the authenticated agent.
 * Returns the new plaintext key (only shown once).
 */
export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const newKey = generateApiKey();
  const newHash = hashApiKey(newKey);

  await db.agent.update({
    where: { id: agent.id },
    data: { apiKeyHash: newHash },
  });

  return Response.json({
    apiKey: newKey,
    message: 'API key rotated. Store this key securely — it will not be shown again.',
  }, { status: 200 });
}
