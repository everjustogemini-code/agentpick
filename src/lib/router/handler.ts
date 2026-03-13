/**
 * Shared route handler for all /api/v1/route/* endpoints.
 * Handles auth, rate limiting, request parsing, response formatting, and call recording.
 */

import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { checkRateLimit, telemetryLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';
import { routeRequest, CAPABILITY_TOOLS } from './index';
import type { RouterRequest, Strategy } from './index';
import { ensureDeveloperAccount, recordRouterCall } from './sdk';
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
  AUTO: 'auto',
  // Alt forms
  fastest: 'most_stable',
  most_accurate: 'best_performance',
  BEST_PERFORMANCE: 'best_performance',
  MOST_STABLE: 'most_stable',
};

function resolveStrategy(raw: string): Strategy | null {
  if (VALID_STRATEGIES.includes(raw as Strategy)) return raw as Strategy;
  return STRATEGY_ALIASES[raw] ?? STRATEGY_ALIASES[raw.toUpperCase()] ?? null;
}

/** Map canonical core strategy names to SDK/Prisma enum values for call recording */
const CORE_TO_SDK: Record<string, string> = {
  balanced: 'BALANCED',
  best_performance: 'MOST_ACCURATE',
  cheapest: 'CHEAPEST',
  most_stable: 'FASTEST',
  auto: 'AUTO',
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

  // 1. Authenticate
  const agent = await authenticateAgent(request);
  if (!agent) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  // 2. Rate limit (reuse telemetry limiter)
  const { limited, retryAfter } = await checkRateLimit(telemetryLimiter, agent.id);
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
      return apiError('VALIDATION_ERROR', `Invalid strategy "${escapeHtml(strategyParam)}". Must be one of: ${VALID_STRATEGIES.join(', ')}, fastest, most_accurate`, 400);
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
          return apiError('VALIDATION_ERROR', `Invalid strategy "${strategy}". Must be one of: ${VALID_STRATEGIES.join(', ')}, fastest, most_accurate`, 400);
        }
        parsed.strategy = resolved;
      }

      if (!parsed.params && (parsed.query || parsed.q || parsed.text || parsed.input)) {
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
    return apiError('VALIDATION_ERROR', 'params object is required.', 400);
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

  // 4. Budget enforcement — block routing before dispatch (same as sdk-handler)
  let preAccount;
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
  } catch {
    // If account check fails, allow routing (fail-open for /route/* surface)
  }

  // 5. Route the request
  try {
    const { response, headers: extraHeaders } = await routeRequest(agent.id, capability, body);

    // Record the call for analytics
    try {
      const account = preAccount ?? await ensureDeveloperAccount(agent.id);
      const strategyUsed = CORE_TO_SDK[body.strategy ?? 'balanced'] ?? 'BALANCED';
      await recordRouterCall(
        account.id,
        capability,
        query,
        body,
        response,
        strategyUsed as any,
        !!body.tool_api_key,
        response.meta.fallback_used ? [response.meta.fallback_from ?? '', response.meta.tool_used].filter(Boolean) : [],
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
    // Return stable contract: always include tool_used and results fields
    return new Response(JSON.stringify({
      error: 'ROUTER_ERROR',
      message,
      data: null,
      meta: {
        tool_used: null,
        latency_ms: 0,
        fallback_used: false,
        trace_id: `trace_fail_${Date.now()}`,
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
