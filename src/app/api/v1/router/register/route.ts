import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateApiKey, hashApiKey } from '@/lib/auth';
import { ROUTER_PLAN_MONTHLY_LIMITS, isRouterPlanCode } from '@/lib/router/plans';
import { checkRateLimit, registerLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';

const db = prisma as any;

/**
 * PUBLIC endpoint — no auth required.
 * Creates an Agent + DeveloperAccount and returns the API key.
 * This is the registration flow for the Router SDK.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  const { limited, retryAfter } = await checkRateLimit(registerLimiter, ip);
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many registration attempts.', 429, { retry_after: retryAfter });
  }

  let body: { email?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return apiError('VALIDATION_ERROR', 'A valid email is required.', 400);
  }

  const email = body.email.trim().toLowerCase();
  const name = (body.name ?? email.split('@')[0]).trim();

  if (name.length < 1 || name.length > 100) {
    return apiError('VALIDATION_ERROR', 'name must be 1-100 characters.', 400);
  }

  try {
    // Check if a developer account already exists for this email (via agent ownerEmail)
    const existingAgent = await db.agent.findFirst({
      where: { ownerEmail: email },
      include: { developerAccount: true },
    });

    if (existingAgent?.developerAccount) {
      // Already registered — generate a new key and return it
      const apiKey = generateApiKey();
      const apiKeyHash = hashApiKey(apiKey);

      await db.agent.update({
        where: { id: existingAgent.id },
        data: { apiKeyHash },
      });

      const plan = existingAgent.developerAccount.plan;
      // Use isRouterPlanCode to avoid null ?? fallback coercing ENTERPRISE's null limit to 500
      const monthlyLimit = isRouterPlanCode(plan) ? ROUTER_PLAN_MONTHLY_LIMITS[plan] : ROUTER_PLAN_MONTHLY_LIMITS.FREE;

      return Response.json({
        apiKey,
        plan,
        monthlyLimit,
        message: 'Existing account found. New API key issued.',
      }, { status: 200 });
    }

    if (existingAgent && !existingAgent.developerAccount) {
      // Agent exists (created via /agents/register) but has no DeveloperAccount yet.
      // Create the DeveloperAccount and issue a new key — do NOT create a duplicate agent.
      const apiKey = generateApiKey();
      const apiKeyHash = hashApiKey(apiKey);

      await db.agent.update({
        where: { id: existingAgent.id },
        data: { apiKeyHash },
      });

      await db.developerAccount.create({
        data: {
          agentId: existingAgent.id,
          plan: 'FREE',
          strategy: 'AUTO',
          priorityTools: [],
          excludedTools: [],
        },
      });

      return Response.json({
        apiKey,
        plan: 'FREE',
        monthlyLimit: ROUTER_PLAN_MONTHLY_LIMITS.FREE,
      }, { status: 201 });
    }

    // Create new Agent + DeveloperAccount
    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    const agent = await db.agent.create({
      data: {
        apiKeyHash,
        name: `${name}-router`,
        ownerEmail: email,
        description: `Router SDK developer: ${name}`,
      },
    });

    await db.developerAccount.create({
      data: {
        agentId: agent.id,
        plan: 'FREE',
        strategy: 'AUTO',
      },
    });

    return Response.json({
      apiKey,
      plan: 'FREE',
      monthlyLimit: ROUTER_PLAN_MONTHLY_LIMITS.FREE,
    }, { status: 201 });
  } catch (err) {
    console.error('Router register error:', err);
    return apiError('INTERNAL_ERROR', 'Registration failed. Please try again.', 500);
  }
}
