/**
 * OpenAI-compatible chat completions endpoint.
 * POST /v1/chat/completions
 *
 * Drop-in replacement for OpenAI chat completions — routes to the best
 * AgentPick tool based on the model string and query content.
 */

import { authenticateAgent } from '@/lib/auth';
import { apiError } from '@/types';
import { routeRequest, CAPABILITY_TOOLS } from '@/lib/router/index';
import {
  parseOpenAIRequest,
  shapeOpenAIResponseWithQuery,
  streamOpenAIChunks,
} from '@/lib/openai-compat';
import { ensureDeveloperAccount, recordRouterCall, checkUsageLimit } from '@/lib/router/sdk';
import type { RouterStrategyValue } from '@/lib/router/sdk';
import { checkRateLimit, routerSdkLimiter } from '@/lib/rate-limit';

const FALLBACK_MODEL = process.env.FALLBACK_MODEL ?? 'gpt-4o-mini';

function dataToContent(data: unknown): string {
  if (data === null || data === undefined) return '';
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    const d = data as Record<string, unknown>;
    // Search results
    if (Array.isArray(d.results) && d.results.length > 0) {
      return (d.results as Array<Record<string, unknown>>)
        .slice(0, 3)
        .map((r, i) => {
          const title = r.title ?? r.name ?? `Result ${i + 1}`;
          const snippet = r.snippet ?? r.description ?? r.content ?? r.summary ?? '';
          const url = r.url ?? r.link ?? '';
          return `${i + 1}. ${title}${url ? ` (${url})` : ''}\n${snippet}`;
        })
        .join('\n\n');
    }
    // Finance data
    if (d.ticker || d.symbol || d.price !== undefined) {
      return JSON.stringify(d, null, 2);
    }
    // Answer field
    if (typeof d.answer === 'string') return d.answer;
    if (typeof d.text === 'string') return d.text;
    if (typeof d.content === 'string') return d.content;
    if (typeof d.markdown === 'string') return d.markdown;
    return JSON.stringify(d, null, 2);
  }
  return String(data);
}

export async function POST(req: Request): Promise<Response> {
  // 1. Authenticate
  const authHeader = req.headers.get('authorization');
  let _url: URL;
  try {
    _url = new URL(req.url);
  } catch {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  if (!authHeader?.trim() && !_url.searchParams.get('token')?.startsWith('ah_')) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }
  if (authHeader && !authHeader.trim().toLowerCase().startsWith('bearer ') && !_url.searchParams.get('token')?.startsWith('ah_')) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  let agent: Awaited<ReturnType<typeof authenticateAgent>>;
  try {
    agent = await authenticateAgent(req);
  } catch {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }
  if (!agent || !agent.id) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  // 2. Rate limit
  const { limited, retryAfter } = await checkRateLimit(routerSdkLimiter, agent.id);
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many requests. Slow down.', 429, { retry_after: retryAfter });
  }

  // 3. Parse request body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  const parsed = parseOpenAIRequest(rawBody);
  const { query, capability, model, stream } = parsed;

  if (!query.trim()) {
    return apiError('VALIDATION_ERROR', 'A non-empty query is required in the last user message.', 400);
  }

  // 4. Budget / plan enforcement
  let preAccount;
  let preUsageIsOverage = false;
  try {
    preAccount = await ensureDeveloperAccount(agent.id);
    if (
      typeof preAccount.monthlyBudgetUsd === 'number' &&
      preAccount.monthlyBudgetUsd > 0 &&
      preAccount.spentThisMonth >= preAccount.monthlyBudgetUsd
    ) {
      return apiError('BUDGET_EXCEEDED', 'Monthly budget exceeded for this developer account.', 402, {
        details: { budget: preAccount.monthlyBudgetUsd, spent: preAccount.spentThisMonth },
      });
    }
    const usage = await checkUsageLimit(preAccount.id, preAccount.plan as Parameters<typeof checkUsageLimit>[1], preAccount.billingCycleStart);
    preUsageIsOverage = usage.isOverage;
    if (!usage.allowed) {
      const isMonthly = usage.hardCapped;
      const limitCount = isMonthly ? (usage.monthlyLimit ?? usage.limit) : usage.limit;
      const usedCount = isMonthly ? usage.monthlyUsed : usage.used;
      const limitLabel = isMonthly ? 'Monthly' : 'Daily';
      const now = new Date();
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const retryAfterSecs = Math.ceil((nextReset.getTime() - now.getTime()) / 1000);
      return apiError('USAGE_LIMIT', `${limitLabel} call limit reached (${limitCount} calls). Upgrade plan for more.`, 429, {
        details: { plan: preAccount.plan, limit: limitCount, used: usedCount, period: isMonthly ? 'monthly' : 'daily' },
        retry_after: retryAfterSecs,
      });
    }
  } catch {
    // Fail-open: allow routing if account check fails
  }

  // 5. Determine routing capability — "auto" = use balanced routing on search
  const routeCapability = capability === 'auto' || !CAPABILITY_TOOLS[capability]
    ? 'search'
    : capability;

  // 6. Route the request
  const start = Date.now();
  let content: string;
  let toolUsed: string;
  let latencyMs: number;
  let effectiveModel = model;

  try {
    const { response } = await routeRequest(
      agent.id,
      routeCapability,
      {
        params: { query },
        strategy: capability === 'auto' ? 'auto' : 'balanced',
      },
      {
        developerId: preAccount?.id,
        storedByokKeys: preAccount?.byokKeys,
        excludedTools: preAccount?.excludedTools as string[] | undefined,
        latencyBudgetMs: preAccount?.latencyBudgetMs,
        maxFallbacks: preAccount?.maxFallbacks,
      },
    );

    latencyMs = Date.now() - start;
    toolUsed = response.meta.tool_used;
    content = dataToContent(response.data);

    // Record call for analytics (best-effort)
    try {
      const account = preAccount ?? await ensureDeveloperAccount(agent.id);
      await recordRouterCall(
        account.id,
        routeCapability,
        query,
        { params: { query }, strategy: capability === 'auto' ? 'auto' : 'balanced' },
        response,
        'AUTO' as RouterStrategyValue,
        Boolean(response.meta.byok_used),
        response.meta.tried_chain?.length
          ? [...new Set(response.meta.tried_chain)]
          : [response.meta.tool_used].filter(Boolean),
        preUsageIsOverage,
      );
    } catch {
      // Non-fatal: don't fail request if recording fails
    }
  } catch (err) {
    // Fall through to fallback model response
    latencyMs = Date.now() - start;
    toolUsed = FALLBACK_MODEL;
    effectiveModel = FALLBACK_MODEL;
    content = err instanceof Error ? err.message : 'An error occurred while routing your request.';
  }

  // 7. Return response
  if (stream) {
    const chunks = streamOpenAIChunks({ content, tool: toolUsed, model: effectiveModel });
    const readable = new ReadableStream({
      async pull(controller) {
        const { value, done } = await chunks.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(new TextEncoder().encode(value));
        }
      },
    });

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'x-agentpick-tool': toolUsed,
        'x-agentpick-latency-ms': String(latencyMs),
      },
    });
  }

  const responseBody = shapeOpenAIResponseWithQuery({
    content,
    tool: toolUsed,
    latencyMs,
    model: effectiveModel,
    query,
  });

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'x-agentpick-tool': toolUsed,
      'x-agentpick-latency-ms': String(latencyMs),
    },
  });
}
