import { NextRequest } from 'next/server';
<<<<<<< HEAD
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
=======
import { authenticateAgent } from '@/lib/auth';
import {
  deleteByokKey,
  getByokCatalog,
  getByokSummary,
  listByokKeys,
  normalizeByokService,
  saveByokKey,
  updateByokKey,
} from '@/lib/router/byok';
import { ensureDeveloperAccount } from '@/lib/router/sdk';
import { apiError } from '@/types';

async function authenticateDeveloper(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return null;

  const account = await ensureDeveloperAccount(agent.id);
  return { agent, account };
}

export async function GET(request: NextRequest) {
  const context = await authenticateDeveloper(request);
  if (!context) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const keys = listByokKeys(context.account.byokKeys);
  const summary = await getByokSummary(context.account.id, context.account.byokKeys, 30);

  return Response.json({
    keys,
    catalog: getByokCatalog(),
    summary,
  });
}

export async function POST(request: NextRequest) {
  const context = await authenticateDeveloper(request);
  if (!context) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  let body: { service?: string; api_key?: string; status?: 'active' | 'inactive' };
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  if (!body.service || !body.api_key) {
    return apiError('VALIDATION_ERROR', 'service and api_key are required.', 400);
  }

  try {
    const normalizedService = normalizeByokService(body.service) ?? body.service;
    await saveByokKey(context.account.id, context.account.byokKeys, {
      service: body.service,
      apiKey: body.api_key,
      status: body.status,
    });
    const refreshed = await ensureDeveloperAccount(context.agent.id);
    const key = listByokKeys(refreshed.byokKeys).find((item) => item.service === normalizedService) ?? null;
    const summary = await getByokSummary(refreshed.id, refreshed.byokKeys, 30);

    return Response.json({ key, summary }, { status: 201 });
  } catch (error) {
    return apiError('VALIDATION_ERROR', error instanceof Error ? error.message : 'Unable to save key.', 400);
  }
}

export async function PATCH(request: NextRequest) {
  const context = await authenticateDeveloper(request);
  if (!context) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  let body: { service?: string; api_key?: string; status?: 'active' | 'inactive' };
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  if (!body.service) {
    return apiError('VALIDATION_ERROR', 'service is required.', 400);
  }
  if (body.api_key === undefined && body.status === undefined) {
    return apiError('VALIDATION_ERROR', 'Provide api_key or status to update.', 400);
  }

  try {
    const normalizedService = normalizeByokService(body.service) ?? body.service;
    await updateByokKey(context.account.id, context.account.byokKeys, {
      service: body.service,
      apiKey: body.api_key,
      status: body.status,
    });
    const refreshed = await ensureDeveloperAccount(context.agent.id);
    const key = listByokKeys(refreshed.byokKeys).find((item) => item.service === normalizedService) ?? null;
    const summary = await getByokSummary(refreshed.id, refreshed.byokKeys, 30);

    return Response.json({ key, summary });
  } catch (error) {
    return apiError('VALIDATION_ERROR', error instanceof Error ? error.message : 'Unable to update key.', 400);
  }
}

export async function DELETE(request: NextRequest) {
  const context = await authenticateDeveloper(request);
  if (!context) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  let body: { service?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  if (!body.service) {
    return apiError('VALIDATION_ERROR', 'service is required.', 400);
  }

  try {
    const deleted = await deleteByokKey(context.account.id, context.account.byokKeys, body.service);
    const refreshed = await ensureDeveloperAccount(context.agent.id);
    const summary = await getByokSummary(refreshed.id, refreshed.byokKeys, 30);

    return Response.json({ deleted, summary });
  } catch (error) {
    return apiError('VALIDATION_ERROR', error instanceof Error ? error.message : 'Unable to delete key.', 400);
  }
>>>>>>> feature/cycle-4
}
