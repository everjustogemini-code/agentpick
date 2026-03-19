import { NextRequest } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { generateApiKey, hashApiKey } from '@/lib/auth';
import { ROUTER_PLAN_MONTHLY_LIMITS } from '@/lib/router/plans';
import { checkRateLimit, registerLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';

const db = prisma as any;

/**
 * PUBLIC endpoint — no auth required.
 * Issues a trial API key for the /quickstart page.
 * Always tags registrationSource = "quickstart".
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  const { limited, retryAfter } = await checkRateLimit(registerLimiter, ip);
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many registration attempts.', 429, { retry_after: retryAfter });
  }

  let body: { email?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return apiError('VALIDATION_ERROR', 'A valid email is required.', 400);
  }

  const email = body.email.trim().toLowerCase();
  const name = email.split('@')[0].trim();

  const VALID_SOURCES = ['quickstart', 'quickstart_homepage'] as const;
  const registrationSource: string =
    body.source && (VALID_SOURCES as readonly string[]).includes(body.source)
      ? body.source
      : 'quickstart';

  try {
    const existingAgent: any = await withRetry(() => db.agent.findFirst({
      where: { ownerEmail: email },
      include: { developerAccount: true },
    }));

    if (existingAgent?.developerAccount) {
      const apiKey = generateApiKey();
      const apiKeyHash = hashApiKey(apiKey);

      await withRetry(() => db.agent.update({
        where: { id: existingAgent.id },
        data: { apiKeyHash, registrationSource },
      }));

      const plan = existingAgent.developerAccount.plan;
      const monthlyLimit = ROUTER_PLAN_MONTHLY_LIMITS[plan as keyof typeof ROUTER_PLAN_MONTHLY_LIMITS] ?? ROUTER_PLAN_MONTHLY_LIMITS.FREE;

      return Response.json({ apiKey, plan, monthlyLimit }, { status: 200 });
    }

    if (existingAgent && !existingAgent.developerAccount) {
      const apiKey = generateApiKey();
      const apiKeyHash = hashApiKey(apiKey);

      await withRetry(() => db.agent.update({
        where: { id: existingAgent.id },
        data: { apiKeyHash, registrationSource },
      }));

      await withRetry(() => db.developerAccount.create({
        data: {
          agentId: existingAgent.id,
          plan: 'FREE',
          strategy: 'AUTO',
          priorityTools: [],
          excludedTools: [],
        },
      }));

      return Response.json({
        apiKey,
        plan: 'FREE',
        monthlyLimit: ROUTER_PLAN_MONTHLY_LIMITS.FREE,
      }, { status: 200 });
    }

    // New user
    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    const agent: any = await withRetry(() => db.agent.create({
      data: {
        apiKeyHash,
        name: `${name}-router`,
        ownerEmail: email,
        description: `Router SDK developer: ${name}`,
        registrationSource,
      },
    }));

    await withRetry(() => db.developerAccount.create({
      data: {
        agentId: agent.id,
        plan: 'FREE',
        strategy: 'AUTO',
        priorityTools: [],
        excludedTools: [],
      },
    }));

    return Response.json({
      apiKey,
      plan: 'FREE',
      monthlyLimit: ROUTER_PLAN_MONTHLY_LIMITS.FREE,
    }, { status: 200 });
  } catch (err) {
    console.error('Quickstart issue error:', err);
    return apiError('INTERNAL_ERROR', 'Key issuance failed. Please try again.', 500);
  }
}
