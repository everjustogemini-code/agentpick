/**
 * Shared route handler for all /api/v1/route/* endpoints.
 * Handles auth, rate limiting, request parsing, and response formatting.
 */

import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { checkRateLimit, telemetryLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';
import { routeRequest } from './index';
import type { RouterRequest } from './index';

export async function handleRouteRequest(request: NextRequest, capability: string) {
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
      if (!['tool', 'tool_api_key', 'token', 'fallback'].includes(key)) {
        params[key] = value;
      }
    }
    const fallbackParam = url.searchParams.get('fallback');
    body = {
      tool: url.searchParams.get('tool') ?? undefined,
      tool_api_key: url.searchParams.get('tool_api_key') ?? undefined,
      params,
      fallback: fallbackParam ? fallbackParam.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    };
  } else {
    try {
      body = await request.json();
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
    }
  }

  if (!body.params || typeof body.params !== 'object') {
    return apiError('VALIDATION_ERROR', 'params object is required.', 400);
  }

  // 4. Route the request
  try {
    const { response, headers: extraHeaders } = await routeRequest(agent.id, capability, body);

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
    return apiError('ROUTER_ERROR', message, 502);
  }
}
