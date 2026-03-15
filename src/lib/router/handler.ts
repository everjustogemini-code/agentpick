/**
 * Shared route handler for all /api/v1/route/* endpoints.
 * Handles auth, rate limiting, request parsing, response formatting, and call recording.
 */

import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { checkRateLimit, routerSdkLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';
import { routeRequest, CAPABILITY_TOOLS, getRankedToolsForCapability } from './index';
import type { RouterRequest, Strategy } from './index';
import { checkUsageLimit, ensureDeveloperAccount, recordRouterCall, type RouterPlanValue, type RouterStrategyValue } from './sdk';
import { escapeHtml } from '@/lib/sanitize';

const VALID_CAPABILITIES = Object.keys(CAPABILITY_TOOLS);

const VALID_STRATEGIES: Strategy[] = ['auto', 'balanced', 'best_performance', 'cheapest', 'most_stable'];

/** Maximum allowed query length to prevent abuse */
const MAX_QUERY_LENGTH = 2000;

/** Accept legacy/uppercase strategy names as aliases and map them to canonical names */
const STRATEGY_ALIASES: Record<string, Strategy> = {
  // Uppercase SDK/Prisma enum names → canonical
  BALANCED: 'balanced',
  FASTEST: 'most_stable',
  CHEAPEST: 'cheapest',
  MOST_ACCURATE: 'best_performance',
  MANUAL: 'balanced',
  CUSTOM: 'balanced',
  AUTO: 'auto',
  // Alt forms
  fastest: 'most_stable',
  most_accurate: 'best_performance',
  custom: 'balanced',
  BEST_PERFORMANCE: 'best_performance',
  MOST_STABLE: 'most_stable',
};

function resolveStrategy(raw: string): Strategy | null {
  if (VALID_STRATEGIES.includes(raw as Strategy)) return raw as Strategy;
  return STRATEGY_ALIASES[raw] ?? STRATEGY_ALIASES[raw.toUpperCase()] ?? null;
}

/** Map canonical core strategy names AND SDK/Prisma enum names to SDK enum values for call recording */
const CORE_TO_SDK: Record<string, string> = {
  // Canonical router names
  balanced: 'BALANCED',
  best_performance: 'MOST_ACCURATE',
  cheapest: 'CHEAPEST',
  most_stable: 'FASTEST',
  auto: 'AUTO',
  manual: 'MANUAL',
  // SDK/Prisma uppercase enum names (as stored in account.strategy)
  BALANCED: 'BALANCED',
  MOST_ACCURATE: 'MOST_ACCURATE',
  CHEAPEST: 'CHEAPEST',
  FASTEST: 'FASTEST',
  AUTO: 'AUTO',
  MANUAL: 'MANUAL',
};

export async function handleRouteRequest(request: NextRequest, capability: string) {
  // 0. Validate capability before any upstream dispatch
  // Sanitize capability in error message to prevent reflected XSS
  if (!VALID_CAPABILITIES.includes(capability)) {
    return apiError(
      'NOT_FOUND',
      `Unknown capability "${escapeHtml(capability)}". Valid capabilities: ${VALID_CAPABILITIES.join(', ')}`,
      404,
    );
  }

  // 1. Authenticate — short-circuit immediately if there is no Authorization header
  // and no ?token= query param. This avoids any DB lookup for clearly unauthenticated
  // requests and closes the window for an intermittent auth-bypass edge case.
  const _authHeader = request.headers.get('authorization');
  // Wrap URL parsing: a malformed request URL must yield 401, not a thrown exception
  // that Next.js converts to a 500 (which would bypass the auth gate entirely).
  let _urlForAuth: URL;
  try {
    _urlForAuth = new URL(request.url);
  } catch {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }
  // Reject whitespace-only or absent auth headers as well as missing ?token= params.
  // This closes an intermittent edge case where a header with only whitespace bypassed the null check.
  if (!_authHeader?.trim() && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }
  // Reject auth headers that are present but use a non-Bearer scheme (e.g. "Token xyz",
  // "APIKey xyz"). These will never produce a valid ah_ token. Returning 401 immediately
  // prevents any DB lookup and eliminates a narrow edge case where a malformed scheme
  // could reach authenticateAgent and produce an unexpected response in edge deployments.
  if (_authHeader && !_authHeader.trim().toLowerCase().startsWith('bearer ') && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  let agent: Awaited<ReturnType<typeof authenticateAgent>>;
  try {
    agent = await authenticateAgent(request);
  } catch {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }
  if (!agent || !agent.id) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  // 2. Rate limit (reuse telemetry limiter)
  const { limited, retryAfter } = await checkRateLimit(routerSdkLimiter, agent.id);
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many requests. Slow down.', 429, { retry_after: retryAfter });
  }

  // 3. Parse body (POST) or query params (GET)
  let body: RouterRequest;
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const params: Record<string, unknown> = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (!['tool', 'tool_api_key', 'token', 'fallback', 'strategy'].includes(key)) {
        params[key] = value;
      }
    }
    const fallbackParam = url.searchParams.get('fallback');
    const strategyParam = url.searchParams.get('strategy');

    // Reject invalid strategy names (accepts core names + SDK aliases)
    const resolvedStrategy = strategyParam ? resolveStrategy(strategyParam) : undefined;
    if (strategyParam && !resolvedStrategy) {
      return apiError('VALIDATION_ERROR', `Invalid strategy "${escapeHtml(strategyParam)}". Must be one of: ${VALID_STRATEGIES.join(', ')}, fastest, most_accurate, custom, manual`, 400);
    }

    const priorityParam = url.searchParams.get('priority_tools') ?? url.searchParams.get('priority');
    body = {
      tool: url.searchParams.get('tool') ?? undefined,
      tool_api_key: url.searchParams.get('tool_api_key') ?? undefined,
      params,
      fallback: fallbackParam ? fallbackParam.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      strategy: resolvedStrategy ?? undefined,
      priority_tools: priorityParam ? priorityParam.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    };
  } else {
    try {
      const parsed = await request.json();
      const strategy = parsed.strategy;

      // Reject invalid strategy names (accepts core names + SDK aliases)
      if (strategy) {
        const resolved = resolveStrategy(strategy);
        if (!resolved) {
          return apiError('VALIDATION_ERROR', `Invalid strategy "${strategy}". Must be one of: ${VALID_STRATEGIES.join(', ')}, fastest, most_accurate, custom, manual`, 400);
        }
        parsed.strategy = resolved;
      }

      if (!parsed.params && (parsed.query || parsed.q || parsed.text || parsed.input || parsed.url || parsed.ticker || parsed.symbol)) {
        const { tool, tool_api_key, fallback, strategy: _s, priority_tools: _pt, priority: _p, priorityTools: _pT, ...rest } = parsed;
        parsed.params = rest;
        parsed.tool = tool;
        parsed.tool_api_key = tool_api_key;
        parsed.fallback = fallback;
      }
      // Accept priority_tools, priority, and priorityTools as aliases
      const rawPriority = parsed.priority_tools ?? parsed.priority ?? parsed.priorityTools;
      if (Array.isArray(rawPriority)) {
        parsed.priority_tools = rawPriority.filter((t: unknown) => typeof t === 'string');
      }
      body = parsed;
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
    }
  }

  if (!body.params || typeof body.params !== 'object') {
    const hasPriority = Array.isArray((body as unknown as Record<string, unknown>).priority_tools) || Array.isArray((body as unknown as Record<string, unknown>).priority);
    const hint = hasPriority
      ? ' When using priority/priority_tools, also include your query: {"query":"...", "priority":["tool-a","tool-b"]}.'
      : ' Pass params directly: {"params":{"query":"..."}} or use flat body: {"query":"..."}.';
    return apiError('VALIDATION_ERROR', `params object is required.${hint}`, 400);
  }

  // Validate empty queries before routing
  const query = extractQueryFromParams(body.params);
  if (!query || query.trim().length === 0) {
    return apiError('VALIDATION_ERROR', 'A non-empty query is required. Provide query, q, text, input, url, ticker, or symbol in params.', 400);
  }

  // Reject excessively long queries (P2-9: boundary validation)
  if (query.length > MAX_QUERY_LENGTH) {
    return apiError('VALIDATION_ERROR', `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters.`, 413);
  }

  // 4. Budget and plan-limit enforcement — block routing before dispatch
  let preAccount;
  let preUsageIsOverage = false;
  try {
    preAccount = await ensureDeveloperAccount(agent.id);
    if (
      typeof preAccount.monthlyBudgetUsd === 'number' &&
      preAccount.monthlyBudgetUsd >= 0 &&
      preAccount.spentThisMonth >= preAccount.monthlyBudgetUsd
    ) {
      return apiError('BUDGET_EXCEEDED', 'Monthly budget exceeded for this developer account.', 402, {
        details: { budget: preAccount.monthlyBudgetUsd, spent: preAccount.spentThisMonth },
      });
    }
    // Enforce plan daily/monthly limits (same as /router/* surface)
    const usage = await checkUsageLimit(preAccount.id, preAccount.plan as RouterPlanValue, preAccount.billingCycleStart);
    preUsageIsOverage = usage.isOverage;
    if (!usage.allowed) {
      const isMonthly = usage.hardCapped;
      const limitCount = isMonthly ? (usage.monthlyLimit ?? usage.limit) : usage.limit;
      const usedCount = isMonthly ? usage.monthlyUsed : usage.used;
      const limitLabel = isMonthly ? 'Monthly' : 'Daily';
      return apiError('USAGE_LIMIT', `${limitLabel} call limit reached (${limitCount} calls). Upgrade plan for more.`, 429, {
        details: { plan: preAccount.plan, limit: limitCount, used: usedCount, period: isMonthly ? 'monthly' : 'daily' },
      });
    }
  } catch {
    // If account check fails, allow routing (fail-open for /route/* surface)
  }

  // 5. Route the request
  // If no explicit strategy was in the request body, apply the account's stored strategy.
  // AUTO triggers AI classification; CHEAPEST enables BYOK-aware cheapest routing.
  // Other strategies (BALANCED, FASTEST, MOST_ACCURATE) are mapped to their core equivalents.
  // This aligns /api/v1/route/* behavior with /api/v1/router/* for all account strategy types.
  if (!body.strategy && preAccount?.strategy) {
    const accountStrat = (preAccount.strategy as string).toUpperCase();
    const ACCOUNT_STRAT_TO_CORE: Record<string, import('./index').Strategy> = {
      AUTO: 'auto',
      CHEAPEST: 'cheapest',
      MOST_ACCURATE: 'best_performance',
      FASTEST: 'most_stable',
      BALANCED: 'balanced',
      // MANUAL: use balanced routing on the /route/* surface (no applyStrategy here).
      // Without this entry, MANUAL accounts get 'balanced' routing but 'MANUAL' recorded —
      // a strategy recording mismatch in analytics.
      MANUAL: 'balanced',
    };
    const coreStrat = ACCOUNT_STRAT_TO_CORE[accountStrat];
    if (coreStrat) {
      body = { ...body, strategy: coreStrat };
    }
    // For MANUAL strategy, apply account priority tools when not already provided at request level.
    // This mirrors applyStrategy() in sdk-handler.ts so MANUAL accounts get their configured
    // tool ordering on the /route/* surface, not just generic balanced routing.
    if (accountStrat === 'MANUAL' && preAccount.priorityTools?.length && !body.tool && !body.priority_tools?.length) {
      body = { ...body, priority_tools: preAccount.priorityTools as string[] };
    }
  }
  try {
    const { response, headers: extraHeaders } = await routeRequest(agent.id, capability, body, {
      developerId: preAccount?.id,
      storedByokKeys: preAccount?.byokKeys,
      excludedTools: preAccount?.excludedTools as string[] | undefined,
      latencyBudgetMs: preAccount?.latencyBudgetMs,
      maxFallbacks: preAccount?.maxFallbacks,
    });

    // Record the call for analytics
    try {
      const account = preAccount ?? await ensureDeveloperAccount(agent.id);
      // Use body strategy → account default strategy → fallback 'balanced'
      // This ensures AUTO-strategy accounts' calls are recorded correctly for ai_routing_summary
      const accountDefaultStrategy = account.strategy ? (account.strategy as string).toLowerCase() : 'balanced';
      const effectiveStrategy = body.strategy ?? (CORE_TO_SDK[accountDefaultStrategy] ? accountDefaultStrategy : 'balanced');
      const strategyUsed = CORE_TO_SDK[effectiveStrategy] ?? 'BALANCED';
      await recordRouterCall(
        account.id,
        capability,
        query,
        body,
        response,
        strategyUsed as RouterStrategyValue,
        Boolean(response.meta.byok_used),
        response.meta.fallback_used ? [response.meta.fallback_from ?? '', response.meta.tool_used].filter(Boolean) : [response.meta.tool_used].filter(Boolean),
        preUsageIsOverage,
      );
    } catch (recordErr) {
      // Don't fail the request if recording fails
      console.error('Failed to record router call:', recordErr);
    }

    const responseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (extraHeaders) {
      Object.assign(responseHeaders, extraHeaders);
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Router error';
    const failTraceId = `trace_fail_${Date.now()}`;
    const failToolUsed =
      body?.tool ??
      getRankedToolsForCapability(capability, body?.strategy ?? 'balanced')[0] ??
      CAPABILITY_TOOLS[capability]?.[0] ??
      capability;
    // Record the failure for analytics — best-effort
    if (preAccount) {
      const failAccountDefault = preAccount.strategy ? (preAccount.strategy as string).toLowerCase() : 'balanced';
      const failEffective = body?.strategy ?? (CORE_TO_SDK[failAccountDefault] ? failAccountDefault : 'balanced');
      const strategyUsed = CORE_TO_SDK[failEffective] ?? 'BALANCED';
      const failResponse = {
        data: null,
        meta: {
          tool_used: failToolUsed,
          latency_ms: 0,
          fallback_used: false as boolean,
          trace_id: failTraceId,
          cost_usd: 0,
          result_count: 0,
          byok_used: false as boolean,
        },
      };
      recordRouterCall(
        preAccount.id,
        capability,
        query,
        body,
        failResponse as Parameters<typeof recordRouterCall>[4],
        strategyUsed as RouterStrategyValue,
        false,
        [],
      ).catch((e) => console.error('Failed to record failed router call:', e));
    }
    return new Response(JSON.stringify({
      error: 'ROUTER_ERROR',
      message,
      data: null,
      meta: {
        tool_used: failToolUsed,
        latency_ms: 0,
        fallback_used: false,
        trace_id: failTraceId,
      },
      results: [],
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** Extract query string from params (mirrors index.ts extractQuery) */
function extractQueryFromParams(params: Record<string, unknown>): string {
  if (typeof params.query === 'string') return params.query;
  if (typeof params.q === 'string') return params.q;
  if (typeof params.text === 'string') return params.text;
  if (typeof params.input === 'string') return params.input;
  if (typeof params.url === 'string') return params.url;
  if (typeof params.ticker === 'string') return params.ticker;
  if (typeof params.symbol === 'string') return params.symbol;
  for (const val of Object.values(params)) {
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return '';
}
