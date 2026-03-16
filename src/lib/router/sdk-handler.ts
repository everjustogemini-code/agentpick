/**
 * Enhanced route handler that integrates DeveloperAccount, strategy, and usage tracking.
 * Used by the new /api/v1/router/* endpoints.
 */

import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { checkRateLimit, routerSdkLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';
import { routeRequest, CAPABILITY_TOOLS, getRankedToolsForCapability } from './index';
import type { RouterRequest, Strategy } from './index';
import {
  applyStrategy,
  checkUsageLimit,
  ensureDeveloperAccount,
  isRouterStrategy,
  normalizeStrategy,
  recordRouterCall,
  type RouterPlanValue,
  type RouterStrategyValue,
} from './sdk';
import { escapeHtml } from '@/lib/sanitize';
import { getRouterMessage } from './messages';
import { ROUTER_PLAN_MONTHLY_LIMITS } from './plans';

type RouterSdkRequest = Omit<RouterRequest, 'strategy'> & {
  strategy?: RouterStrategyValue;
};

const VALID_CAPABILITIES = Object.keys(CAPABILITY_TOOLS);

/** Maximum allowed query length to prevent abuse */
const MAX_QUERY_LENGTH = 2000;

export async function handleSdkRouteRequest(request: NextRequest, capability: string) {
  // Validate capability before any upstream dispatch (sanitize to prevent reflected XSS)
  if (!VALID_CAPABILITIES.includes(capability)) {
    return apiError(
      'NOT_FOUND',
      `Unknown capability "${escapeHtml(capability)}". Valid capabilities: ${VALID_CAPABILITIES.join(', ')}`,
      404,
    );
  }

  // Short-circuit immediately if no Authorization header and no ?token= query param.
  // This avoids any DB lookup for clearly unauthenticated requests.
  // Wrap URL parsing in try/catch: a malformed request URL should yield 401, not an
  // unhandled throw that Next.js might convert to a 500 (bypassing the auth gate).
  const _authHeader = request.headers.get('authorization');
  let _urlForAuth: URL;
  try {
    _urlForAuth = new URL(request.url);
  } catch {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }
  if (!_authHeader?.trim() && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }
  // Reject non-Bearer auth schemes (e.g. "Token xyz", "APIKey xyz") immediately.
  // These cannot produce a valid ah_ token and would otherwise reach authenticateAgent
  // with a DB lookup, creating a narrow edge case window in edge deployments.
  if (_authHeader && !_authHeader.trim().toLowerCase().startsWith('bearer ') && !_urlForAuth.searchParams.get('token')?.startsWith('ah_')) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  // Wrap authenticateAgent in try/catch: a DB timeout or URL parse error during auth
  // should return 401, not bubble up as an unhandled 500.
  let agent: Awaited<ReturnType<typeof authenticateAgent>>;
  try {
    agent = await authenticateAgent(request);
  } catch {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }
  if (!agent || !agent.id) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  const { limited, retryAfter } = await checkRateLimit(routerSdkLimiter, agent.id);
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many requests. Slow down.', 429, { retry_after: retryAfter });
  }

  let account: Awaited<ReturnType<typeof ensureDeveloperAccount>>;
  try {
    account = await ensureDeveloperAccount(agent.id);
  } catch (accountErr) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] sdk-handler: ensureDeveloperAccount failed:`, accountErr instanceof Error ? accountErr.message : accountErr);
    return apiError('INTERNAL_ERROR', 'Account lookup failed. Please retry.', 500);
  }

  // P1-6: Hard budget enforcement — check before usage limit so over-budget accounts get
  // BUDGET_EXCEEDED (402) not USAGE_LIMIT (429), matching handler.ts ordering.
  if (
    typeof account.monthlyBudgetUsd === 'number' &&
    account.monthlyBudgetUsd > 0 &&
    account.spentThisMonth >= account.monthlyBudgetUsd
  ) {
    return apiError('BUDGET_EXCEEDED', 'Monthly budget exceeded for this developer account.', 402, {
      details: { budget: account.monthlyBudgetUsd, spent: account.spentThisMonth },
    });
  }

  let usage: Awaited<ReturnType<typeof checkUsageLimit>>;
  try {
    usage = await checkUsageLimit(account.id, account.plan as RouterPlanValue, account.billingCycleStart);
  } catch (usageErr) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] sdk-handler: checkUsageLimit failed:`, usageErr instanceof Error ? usageErr.message : usageErr);
    return apiError('INTERNAL_ERROR', 'Usage check failed. Please retry.', 500);
  }
  if (!usage.allowed) {
    const isMonthly = usage.hardCapped;
    const limitCount = isMonthly ? (usage.monthlyLimit ?? usage.limit) : usage.limit;
    const usedCount = isMonthly ? usage.monthlyUsed : usage.used;
    const limitLabel = isMonthly ? 'Monthly' : 'Daily';
    return apiError('USAGE_LIMIT', `${limitLabel} call limit reached (${limitCount} calls). Upgrade plan for more.`, 429, {
      details: { plan: account.plan, limit: limitCount, used: usedCount, period: isMonthly ? 'monthly' : 'daily' },
    });
  }

  let body: RouterSdkRequest;
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const params: Record<string, unknown> = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (!['tool', 'tool_api_key', 'token', 'fallback', 'strategy', 'priority_tools', 'priority', 'priorityTools'].includes(key)) {
        params[key] = value;
      }
    }
    const fallbackParam = url.searchParams.get('fallback');
    const strategyParam = url.searchParams.get('strategy');
    const priorityParam = url.searchParams.get('priority_tools') ?? url.searchParams.get('priority');
    let resolvedGetStrategy: RouterStrategyValue | undefined;
    if (strategyParam) {
      if (isRouterStrategy(strategyParam)) {
        resolvedGetStrategy = strategyParam.toUpperCase() as RouterStrategyValue;
      } else {
        const normalized = normalizeStrategy(strategyParam);
        if (!normalized) {
          return apiError('VALIDATION_ERROR', `Invalid strategy "${escapeHtml(strategyParam)}". Must be one of: BALANCED, FASTEST, CHEAPEST, MOST_ACCURATE, MANUAL, AUTO`, 400);
        }
        resolvedGetStrategy = normalized;
      }
    }
    body = {
      tool: url.searchParams.get('tool') ?? undefined,
      tool_api_key: url.searchParams.get('tool_api_key') ?? undefined,
      params,
      fallback: fallbackParam ? fallbackParam.split(',').map((item) => item.trim()).filter(Boolean) : undefined,
      strategy: resolvedGetStrategy,
      priority_tools: priorityParam ? priorityParam.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    };
  } else {
    try {
      const parsed = await request.json();
      // Validate strategy before further processing
      if (parsed.strategy) {
        const rawStrat = String(parsed.strategy);
        if (!isRouterStrategy(rawStrat)) {
          const normalized = normalizeStrategy(rawStrat);
          if (!normalized) {
            return apiError('VALIDATION_ERROR', `Invalid strategy "${escapeHtml(rawStrat)}". Must be one of: BALANCED, FASTEST, CHEAPEST, MOST_ACCURATE, MANUAL, AUTO`, 400);
          }
          parsed.strategy = normalized;
        }
      }
      // Accept priority_tools, priority, and priorityTools as aliases
      const rawPriority = parsed.priority_tools ?? parsed.priority ?? parsed.priorityTools;
      if (Array.isArray(rawPriority)) {
        parsed.priority_tools = rawPriority.filter((t: unknown) => typeof t === 'string');
      }
      // Normalize fallback to string array. Users sometimes send fallback as a comma-separated
      // string (e.g. "serper,tavily") instead of an array. Without normalization, routeRequest
      // iterates over string characters as tool slugs, wasting fallback slots on 's','e','r',...
      const rawFallback = parsed.fallback;
      if (typeof rawFallback === 'string') {
        parsed.fallback = rawFallback ? rawFallback.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined;
      } else if (rawFallback !== undefined && !Array.isArray(rawFallback)) {
        parsed.fallback = undefined;
      }
      // Normalize flat body: { query/q/text/input/url/ticker/symbol } → { params: { ... } }
      // Use 'in' (field presence) rather than truthiness so { "query": "" } triggers
      // normalization and returns "A non-empty query is required" instead of "params object required".
      if (
        !parsed.params &&
        ('query' in parsed || 'q' in parsed || 'text' in parsed || 'input' in parsed ||
          'url' in parsed || 'ticker' in parsed || 'symbol' in parsed)
      ) {
        const { tool, tool_api_key, fallback, strategy: _s, priority_tools: _pt, priority: _p, priorityTools: _pT, ...rest } = parsed;
        parsed.params = rest;
        parsed.tool = tool;
        parsed.tool_api_key = tool_api_key;
        parsed.fallback = fallback;
      }
      body = parsed;
    } catch (e) {
      if (e instanceof Response) return e;
      return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
    }
  }

  if (!body.params || typeof body.params !== 'object' || Array.isArray(body.params)) {
    const hasPriority = Array.isArray(body.priority_tools);
    const hint = hasPriority
      ? ' When using priority_tools, also include your query: {"query":"...", "priority_tools":["tool-a","tool-b"]}.'
      : ' Pass params directly: {"params":{"query":"..."}} or use flat body: {"query":"..."}.';
    return apiError('VALIDATION_ERROR', `params object is required.${hint}`, 400);
  }

  // Validate query length before routing (P2-9: boundary validation)
  const preQuery = extractQueryFromParams(body.params);
  if (!preQuery || preQuery.trim().length === 0) {
    return apiError('VALIDATION_ERROR', 'A non-empty query is required. Provide query, q, text, input, url, ticker, or symbol in params.', 400);
  }
  if (preQuery.length > MAX_QUERY_LENGTH) {
    return apiError('VALIDATION_ERROR', `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters.`, 413);
  }

  // Validate request-level priority_tools: if ALL are unknown for this capability return 400.
  // A mix of known + unknown tools is allowed (unknown ones fail and trigger normal fallback).
  if (body.priority_tools?.length) {
    const validCapabilityTools = new Set(CAPABILITY_TOOLS[capability] ?? []);
    const allUnknown = body.priority_tools.every((t) => !validCapabilityTools.has(t));
    if (allUnknown) {
      return apiError('INVALID_PRIORITY', `None of the specified priority tools are available for ${capability}: ${body.priority_tools.join(', ')}. Valid tools: ${[...validCapabilityTools].join(', ')}`, 400);
    }
  }

  // Normalize strategy to uppercase canonical form for consistent SDK_TO_CORE mapping
  // Accept both SDK enum names (CHEAPEST, MOST_ACCURATE) and canonical names (cheapest, best_performance)
  let strategyUsed: RouterStrategyValue;
  if (body.strategy) {
    if (isRouterStrategy(body.strategy)) {
      strategyUsed = (body.strategy as string).toUpperCase() as RouterStrategyValue;
    } else {
      const normalized = normalizeStrategy(body.strategy as string);
      strategyUsed = normalized ?? (account.strategy as RouterStrategyValue);
    }
  } else {
    strategyUsed = account.strategy as RouterStrategyValue;
  }

  // Map SDK/Prisma strategies to canonical core names
  const SDK_TO_CORE: Record<string, Strategy> = {
    BALANCED: 'balanced',
    FASTEST: 'most_stable',
    CHEAPEST: 'cheapest',
    MOST_ACCURATE: 'best_performance',
    MANUAL: 'balanced',
    AUTO: 'auto',
  };
  const coreStrategy: Strategy = SDK_TO_CORE[strategyUsed.toUpperCase()] ?? 'balanced';

  // P1-3: Priority precedence: request-level priority_tools > account-level priorityTools > strategy
  // For AUTO and MOST_ACCURATE strategies, skip account-level priorityTools: AI routing must be
  // free to select the best tool. Account priorityTools are set for MANUAL/BALANCED use cases and
  // must not override AI classification results (which caused non-determinism when the account had
  // stale priorityTools from a previous MANUAL/compare-strategies test cycle).
  // MOST_ACCURATE uses fastClassify for deep-research routing — same concern as AUTO applies.
  const effectivePriority = body.priority_tools?.length
    ? body.priority_tools
    : (strategyUsed !== 'AUTO' && strategyUsed !== 'MOST_ACCURATE' && strategyUsed !== 'CHEAPEST' && account.priorityTools?.length ? account.priorityTools : undefined);

  const routeBody: RouterRequest = {
    tool: body.tool,
    tool_api_key: body.tool_api_key,
    params: body.params,
    fallback: body.fallback,
    strategy: coreStrategy,
    priority_tools: effectivePriority,
  };

  const modifiedRequest = await applyStrategy(capability, routeBody, {
    strategy: strategyUsed,
    priorityTools: account.priorityTools,
    excludedTools: account.excludedTools,
    fallbackEnabled: account.fallbackEnabled,
    maxFallbacks: account.maxFallbacks,
    latencyBudgetMs: account.latencyBudgetMs,
  });

  // Pre-compute calls_remaining = min(daily, monthly) so both try and catch can use it
  const _monthlyLimit = ROUTER_PLAN_MONTHLY_LIMITS[account.plan as RouterPlanValue];
  const _dailyRemaining = Math.max(0, usage.remaining - 1);
  const _monthlyRemainingAfterCall = _monthlyLimit !== null
    ? Math.max(0, _monthlyLimit - (usage.monthlyUsed ?? 0) - 1)
    : _dailyRemaining;
  const callsRemaining = Math.min(_dailyRemaining, _monthlyRemainingAfterCall);

  try {
    const { response, headers: extraHeaders } = await routeRequest(agent.id, capability, modifiedRequest, {
      developerId: account.id,
      storedByokKeys: account.byokKeys,
      excludedTools: account.excludedTools as string[] | undefined,
      latencyBudgetMs: account.latencyBudgetMs,
      maxFallbacks: account.maxFallbacks,
    });
    const query = extractQueryFromParams(routeBody.params);
    const fallbackChain = buildFallbackChain(modifiedRequest, response);

    // Always record the call — success or failure
    await recordRouterCall(
      account.id,
      capability,
      query,
      routeBody,
      response,
      strategyUsed,
      Boolean(response.meta.byok_used),
      fallbackChain,
      usage.isOverage,
    ).catch((e) => console.error('[recordRouterCall] write failed:', e));

    const crmMessage = getRouterMessage({
      isFirstCall: (account.totalCalls ?? 0) === 0,
      fallbackUsed: Boolean(response.meta.fallback_used),
      toolUsed: response.meta.tool_used,
      latencyMs: response.meta.latency_ms,
      plan: account.plan,
      monthlyUsed: usage.monthlyUsed ?? 0,
      monthlyLimit: _monthlyLimit ?? null,
      totalFallbacks: account.totalFallbacks ?? 0,
    });

    const enrichedResponse = {
      ...response,
      meta: {
        ...response.meta,
        strategy: strategyUsed,
        plan: account.plan,
        calls_remaining: callsRemaining,
        message: crmMessage,
      },
    };

    const responseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-AgentPick-Plan': account.plan,
      'X-AgentPick-Remaining': String(callsRemaining),
      'Cache-Control': 'no-store',
      'Vary': 'Authorization',
    };
    if (extraHeaders) {
      Object.assign(responseHeaders, extraHeaders);
    }

    return new Response(JSON.stringify(enrichedResponse), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    // Record the failure
    const query = extractQueryFromParams(routeBody.params);
    const message = error instanceof Error ? error.message : 'Router error';
    const resolvedToolUsed =
      modifiedRequest.tool ??
      modifiedRequest.priority_tools?.[0] ??
      getRankedToolsForCapability(capability, coreStrategy)[0] ??
      CAPABILITY_TOOLS[capability]?.[0] ??
      capability;
    const failureResponse = {
      error: 'ROUTER_ERROR',
      message,
      data: null,
      meta: {
        tool_used: resolvedToolUsed,
        latency_ms: 0,
        fallback_used: false,
        trace_id: `trace_fail_${Date.now()}`,
        cost_usd: 0,
        result_count: 0,
        byok_used: false,
        strategy: strategyUsed,
        plan: account.plan,
        calls_remaining: callsRemaining,
      },
      results: [],
    };
    await recordRouterCall(
      account.id,
      capability,
      query,
      routeBody,
      failureResponse,
      strategyUsed,
      Boolean(failureResponse.meta.byok_used),
      [],
    ).catch((e) => console.error('[recordRouterCall] write failed:', e));
    // Return stable contract: always include tool_used and results fields
    return new Response(JSON.stringify(failureResponse), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'X-AgentPick-Plan': account.plan,
        'X-AgentPick-Remaining': String(callsRemaining),
        'Cache-Control': 'no-store',
        'Vary': 'Authorization',
      },
    });
  }
}

function extractQueryFromParams(params: Record<string, unknown>): string {
  for (const key of ['query', 'q', 'text', 'input', 'url', 'ticker', 'symbol']) {
    if (typeof params[key] === 'string') {
      return params[key] as string;
    }
  }

  for (const value of Object.values(params)) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return '';
}

function buildFallbackChain(request: RouterRequest, response: { meta: { tool_used: string; fallback_used: boolean; fallback_from?: string; tried_chain?: string[] } }) {
  // Prefer the complete tried_chain (includes all intermediate fallback attempts) when available.
  if (response.meta.tried_chain?.length) {
    return [...new Set(response.meta.tried_chain)];
  }

  if (response.meta.fallback_used) {
    const chain = [response.meta.fallback_from, response.meta.tool_used].filter(Boolean) as string[];
    return [...new Set(chain)];
  }

  const chain = [request.tool, ...(request.fallback ?? [])].filter(Boolean) as string[];
  if (!chain.includes(response.meta.tool_used)) {
    chain.push(response.meta.tool_used);
  }
  return [...new Set(chain)];
}
