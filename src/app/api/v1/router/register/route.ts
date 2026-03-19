import { NextRequest } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { generateApiKey, hashApiKey } from '@/lib/auth';
import { ROUTER_PLAN_MONTHLY_LIMITS, isRouterPlanCode } from '@/lib/router/plans';
import { checkRateLimit, registerLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';

const db = prisma as any;

async function fetchAndRegisterSkillMd(
  skillUrl: string,
  agentId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(skillUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { ok: false, error: `Remote skill.md returned ${res.status}` };
    const text = await res.text();
    // Minimal validation: must declare a name field (YAML frontmatter or JSON)
    if (!text.includes('name:') && !text.includes('"name"')) {
      return { ok: false, error: 'skill.md missing required "name" field.' };
    }
    // Persist skillUrl in agent description for future reference
    await withRetry(() =>
      db.agent.update({ where: { id: agentId }, data: { description: `skill.md: ${skillUrl}` } })
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

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

  let body: { email?: string; name?: string; skillUrl?: string };
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

  const skillUrl = body.skillUrl?.trim() ?? undefined;
  if (skillUrl) {
    try { new URL(skillUrl); }
    catch { return apiError('VALIDATION_ERROR', 'skillUrl must be a valid URL.', 400); }
  }

  try {
    // withRetry: agent.findFirst can fail with P1017/fetch-failed on cold starts when the
    // Neon HTTP connection drops before the registration query. Without retry, new users
    // receive 500 and cannot get an API key even though the DB is healthy.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingAgent: any = await withRetry(() => db.agent.findFirst({
      where: { ownerEmail: email },
      include: { developerAccount: true },
    }));

    if (existingAgent?.developerAccount) {
      // Already registered — generate a new key and return it
      const apiKey = generateApiKey();
      const apiKeyHash = hashApiKey(apiKey);

      await withRetry(() => db.agent.update({
        where: { id: existingAgent.id },
        data: { apiKeyHash },
      }));

      const plan = existingAgent.developerAccount.plan;
      // Use isRouterPlanCode to avoid null ?? fallback coercing ENTERPRISE's null limit to 500
      const monthlyLimit = isRouterPlanCode(plan) ? ROUTER_PLAN_MONTHLY_LIMITS[plan] : ROUTER_PLAN_MONTHLY_LIMITS.FREE;

      let skillReg: { ok: boolean; error?: string } | undefined;
      if (skillUrl) skillReg = await fetchAndRegisterSkillMd(skillUrl, existingAgent.id);

      return Response.json({
        apiKey,
        key: apiKey,
        _note: 'key is deprecated, use apiKey',
        plan,
        monthlyLimit,
        message: 'Existing account found. New API key issued.',
        ...(skillReg !== undefined ? { skillRegistration: skillReg } : {}),
      }, { status: 200 });
    }

    if (existingAgent && !existingAgent.developerAccount) {
      // Agent exists (created via /agents/register) but has no DeveloperAccount yet.
      // Create the DeveloperAccount and issue a new key — do NOT create a duplicate agent.
      const apiKey = generateApiKey();
      const apiKeyHash = hashApiKey(apiKey);

      await withRetry(() => db.agent.update({
        where: { id: existingAgent.id },
        data: { apiKeyHash },
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

      let skillReg: { ok: boolean; error?: string } | undefined;
      if (skillUrl) skillReg = await fetchAndRegisterSkillMd(skillUrl, existingAgent.id);

      return Response.json({
        apiKey,
        key: apiKey,
        _note: 'key is deprecated, use apiKey',
        plan: 'FREE',
        monthlyLimit: ROUTER_PLAN_MONTHLY_LIMITS.FREE,
        ...(skillReg !== undefined ? { skillRegistration: skillReg } : {}),
      }, { status: 201 });
    }

    // Create new Agent + DeveloperAccount
    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agent: any = await withRetry(() => db.agent.create({
      data: {
        apiKeyHash,
        name: `${name}-router`,
        ownerEmail: email,
        description: `Router SDK developer: ${name}`,
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

    let skillReg: { ok: boolean; error?: string } | undefined;
    if (skillUrl) skillReg = await fetchAndRegisterSkillMd(skillUrl, agent.id);

    return Response.json({
      apiKey,
      key: apiKey,
      _note: 'key is deprecated, use apiKey',
      plan: 'FREE',
      monthlyLimit: ROUTER_PLAN_MONTHLY_LIMITS.FREE,
      ...(skillReg !== undefined ? { skillRegistration: skillReg } : {}),
    }, { status: 201 });
  } catch (err) {
    console.error('Router register error:', err);
    return apiError('INTERNAL_ERROR', 'Registration failed. Please try again.', 500);
  }
}
