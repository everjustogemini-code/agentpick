import { NextRequest } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { generateApiKey, hashApiKey } from '@/lib/auth';
import { checkRateLimit, registerLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';
import type { AgentRegisterRequest } from '@/types';

async function handleRegister(body: AgentRegisterRequest, ip: string) {
  const { limited, retryAfter } = await checkRateLimit(registerLimiter, ip);
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many registration attempts.', 429, { retry_after: retryAfter });
  }

  if (!body.name || body.name.length < 2 || body.name.length > 100) {
    return apiError('VALIDATION_ERROR', 'name is required (2-100 characters).', 400);
  }

  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);

  const agent = await withRetry(() => prisma.agent.create({
    data: {
      apiKeyHash,
      name: body.name,
      modelFamily: body.model_family ?? null,
      orchestrator: body.orchestrator ?? null,
      ownerEmail: body.owner_email ?? null,
      description: body.description ?? null,
      orchestratorId: body.orchestrator ?? null,
    },
  }));

  return Response.json(
    {
      agent_id: agent.id,
      api_key: apiKey,
      apiKey: apiKey,
      reputation_score: agent.reputationScore,
      status: 'active',
    },
    { status: 201 }
  );
}

/** GET fallback for runtimes that only support GET (e.g. ChatGPT Actions) */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const body: AgentRegisterRequest = {
    name: url.searchParams.get('name') ?? '',
    model_family: url.searchParams.get('model_family') ?? undefined,
    orchestrator: url.searchParams.get('orchestrator') ?? undefined,
    owner_email: url.searchParams.get('owner_email') ?? undefined,
    description: url.searchParams.get('description') ?? undefined,
  };
  return handleRegister(body, ip);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  let body: AgentRegisterRequest;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  return handleRegister(body, ip);
}
