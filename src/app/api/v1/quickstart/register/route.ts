import { NextRequest } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { generateApiKey, hashApiKey } from '@/lib/auth';
import { ROUTER_PLAN_MONTHLY_LIMITS } from '@/lib/router/plans';
import { apiError } from '@/types';

const db = prisma as any;

/**
 * PUBLIC endpoint — no auth required, no rate limiting.
 * Simplified registration for the /quickstart inline key generation flow.
 * Accepts { email } and returns { apiKey }.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return apiError('VALIDATION_ERROR', 'A valid email is required.', 400);
  }

  const email = body.email.trim().toLowerCase();

  try {
    const existingAgent: any = await withRetry(() =>
      db.agent.findFirst({
        where: { ownerEmail: email },
        include: { developerAccount: true },
      })
    );

    if (existingAgent?.developerAccount) {
      const apiKey = generateApiKey();
      const apiKeyHash = hashApiKey(apiKey);
      await withRetry(() =>
        db.agent.update({ where: { id: existingAgent.id }, data: { apiKeyHash } })
      );
      return Response.json({ apiKey }, { status: 200 });
    }

    if (existingAgent && !existingAgent.developerAccount) {
      const apiKey = generateApiKey();
      const apiKeyHash = hashApiKey(apiKey);
      await withRetry(() =>
        db.agent.update({ where: { id: existingAgent.id }, data: { apiKeyHash } })
      );
      await withRetry(() =>
        db.developerAccount.create({
          data: {
            agentId: existingAgent.id,
            plan: 'FREE',
            strategy: 'AUTO',
            priorityTools: [],
            excludedTools: [],
          },
        })
      );
      return Response.json({ apiKey }, { status: 201 });
    }

    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);
    const name = email.split('@')[0];

    const agent: any = await withRetry(() =>
      db.agent.create({
        data: {
          apiKeyHash,
          name: `${name}-router`,
          ownerEmail: email,
          description: `Quickstart developer: ${name}`,
          registrationSource: 'quickstart',
        },
      })
    );

    await withRetry(() =>
      db.developerAccount.create({
        data: {
          agentId: agent.id,
          plan: 'FREE',
          strategy: 'AUTO',
          priorityTools: [],
          excludedTools: [],
        },
      })
    );

    return Response.json({ apiKey }, { status: 201 });
  } catch (err) {
    console.error('Quickstart register error:', err);
    return apiError('INTERNAL_ERROR', 'Registration failed. Please try again.', 500);
  }
}
