import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { ensureDeveloperAccount } from '@/lib/router/sdk';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/types';

export async function POST(request: NextRequest) {
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  const update: Record<string, unknown> = {};

  // Accept both field names: tools (actual) and priority_tools (documented)
  const toolsValue = body.tools ?? body.priority_tools ?? body.search;
  if (Array.isArray(toolsValue)) {
    update.priorityTools = toolsValue.filter((t: unknown): t is string => typeof t === 'string');
  }

  // Accept both: excluded and excluded_tools
  const excludedValue = body.excluded ?? body.excluded_tools;
  if (Array.isArray(excludedValue)) {
    update.excludedTools = excludedValue.filter((t: unknown): t is string => typeof t === 'string');
  }

  if (Object.keys(update).length === 0) {
    return apiError('VALIDATION_ERROR', 'Provide tools/priority_tools (priority list) or excluded/excluded_tools (exclusion list).', 400);
  }

  const db = prisma as any;
  try {
    const updated = await db.developerAccount.update({
      where: { id: account.id },
      data: update,
    });

    return Response.json({
      message: 'Priority updated.',
      priorityTools: updated.priorityTools,
      excludedTools: updated.excludedTools,
    });
  } catch (err) {
    console.error('Priority update failed:', err);
    return apiError('INTERNAL_ERROR', 'Failed to update priority tools.', 500);
  }
}
