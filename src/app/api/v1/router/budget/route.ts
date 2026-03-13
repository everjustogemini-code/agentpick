import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { ensureDeveloperAccount } from '@/lib/router/sdk';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/types';

export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const account = await ensureDeveloperAccount(agent.id);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  // Accept both field names: limit_usd (actual) and monthly_budget_usd (documented)
  const budgetValue = body.limit_usd ?? body.monthly_budget_usd;
  if (typeof budgetValue !== 'number' || budgetValue < 0) {
    return apiError('VALIDATION_ERROR', 'limit_usd (or monthly_budget_usd) must be a non-negative number.', 400);
  }
  if (budgetValue > 100_000) {
    return apiError('VALIDATION_ERROR', 'Budget cannot exceed $100,000.', 400);
  }

  const db = prisma as any;
  const updated = await db.developerAccount.update({
    where: { id: account.id },
    data: {
      monthlyBudgetUsd: budgetValue,
    },
  });

  return Response.json({
    message: 'Budget updated.',
    monthlyBudgetUsd: updated.monthlyBudgetUsd,
  });
}
