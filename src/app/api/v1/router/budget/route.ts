import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { ensureDeveloperAccount } from '@/lib/router/sdk';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/types';

export async function POST(request: NextRequest) {
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

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
    }

    // Accept both field names: limit_usd (actual) and monthly_budget_usd (documented)
    // null clears the budget (no spending cap). 0 is treated as "no limit" by the
    // enforcement check (budget > 0 required to trigger enforcement).
    const budgetValue = body.limit_usd !== undefined ? body.limit_usd : body.monthly_budget_usd;
    if (budgetValue === undefined) {
      return apiError('VALIDATION_ERROR', 'Provide limit_usd or monthly_budget_usd.', 400);
    }
    if (budgetValue !== null && (typeof budgetValue !== 'number' || budgetValue < 0)) {
      return apiError('VALIDATION_ERROR', 'limit_usd (or monthly_budget_usd) must be a non-negative number or null to clear the limit.', 400);
    }
    if (typeof budgetValue === 'number' && budgetValue > 100_000) {
      return apiError('VALIDATION_ERROR', 'Budget cannot exceed $100,000.', 400);
    }

    const db = prisma as any;
    const updated = await db.developerAccount.update({
      where: { id: account.id },
      data: {
        monthlyBudgetUsd: budgetValue ?? null,
      },
    });

    return Response.json({
      message: 'Budget updated.',
      monthlyBudgetUsd: updated.monthlyBudgetUsd,
    });
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] POST /api/v1/router/budget error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
