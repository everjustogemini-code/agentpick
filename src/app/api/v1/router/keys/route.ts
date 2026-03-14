import { NextRequest } from 'next/server';
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

const PRIVATE_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
};

async function authenticateDeveloper(request: NextRequest) {
  const _authHeader = request.headers.get('authorization');
  let _urlForAuth: URL;
  try { _urlForAuth = new URL(request.url); } catch { return null; }
  if (!_authHeader?.trim() && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) return null;
  if (_authHeader && !_authHeader.trim().toLowerCase().startsWith('bearer ') && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) return null;
  let agent: Awaited<ReturnType<typeof authenticateAgent>>;
  try { agent = await authenticateAgent(request); } catch { return null; }
  if (!agent) return null;

  const account = await ensureDeveloperAccount(agent.id);
  return { agent, account };
}

export async function GET(request: NextRequest) {
  const context = await authenticateDeveloper(request);
  if (!context) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const keys = listByokKeys((context.account as any).byokKeys);
  const summary = await getByokSummary(context.account.id, (context.account as any).byokKeys, 30);

  return Response.json({
    keys,
    catalog: getByokCatalog(),
    summary,
  }, {
    headers: PRIVATE_NO_STORE_HEADERS,
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
    await saveByokKey(context.account.id, (context.account as any).byokKeys, {
      service: body.service,
      apiKey: body.api_key,
      status: body.status,
    });
    const refreshed = await ensureDeveloperAccount(context.agent.id);
    const key = listByokKeys(refreshed.byokKeys).find((item) => item.service === normalizedService) ?? null;
    const summary = await getByokSummary(refreshed.id, refreshed.byokKeys, 30);

    return Response.json({ key, summary }, {
      status: 201,
      headers: PRIVATE_NO_STORE_HEADERS,
    });
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
    await updateByokKey(context.account.id, (context.account as any).byokKeys, {
      service: body.service,
      apiKey: body.api_key,
      status: body.status,
    });
    const refreshed = await ensureDeveloperAccount(context.agent.id);
    const key = listByokKeys(refreshed.byokKeys).find((item) => item.service === normalizedService) ?? null;
    const summary = await getByokSummary(refreshed.id, refreshed.byokKeys, 30);

    return Response.json({ key, summary }, {
      headers: PRIVATE_NO_STORE_HEADERS,
    });
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
    const deleted = await deleteByokKey(context.account.id, (context.account as any).byokKeys, body.service);
    const refreshed = await ensureDeveloperAccount(context.agent.id);
    const summary = await getByokSummary(refreshed.id, refreshed.byokKeys, 30);

    return Response.json({ deleted, summary }, {
      headers: PRIVATE_NO_STORE_HEADERS,
    });
  } catch (error) {
    return apiError('VALIDATION_ERROR', error instanceof Error ? error.message : 'Unable to delete key.', 400);
  }
}
