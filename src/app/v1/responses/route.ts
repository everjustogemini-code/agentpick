/**
 * POST /v1/responses — OpenAI Responses API-compatible proxy endpoint.
 *
 * Zero-migration adoption path: developers change only `base_url` to
 * `https://agentpick.dev` and AgentPick routes automatically.
 *
 * Schema:
 *   Request:  { model?: string, input: string | {role,content}[], tools?: {type:string}[] }
 *   Response: { id, object: "response", model, output: [{type:"text", text: string}], usage }
 *
 * Headers returned:
 *   x-agentpick-tool-used     — canonical slug of the tool that served the request
 *   x-agentpick-latency-ms    — end-to-end latency in milliseconds
 *   x-agentpick-trace-id      — unique trace ID for debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseResponsesRequest, buildOpenAIResponse } from '@/lib/openai-compat';
import { authenticateAgent } from '@/lib/auth';
import { checkRateLimit, routerSdkLimiter } from '@/lib/rate-limit';
import { routeRequest } from '@/lib/router/index';

export async function POST(req: NextRequest) {
  const startMs = Date.now();

  // 1. Auth — reuse existing Bearer key validation
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.trim().toLowerCase().startsWith('bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let agent: Awaited<ReturnType<typeof authenticateAgent>>;
  try {
    agent = await authenticateAgent(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!agent || !agent.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Rate limit — same plan limits as /api/v1/route/*
  const { limited } = await checkRateLimit(routerSdkLimiter, agent.id);
  if (limited) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // 3. Parse OpenAI Responses API request body
  let body: { model?: string; input?: unknown; tools?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { query, capability } = parseResponsesRequest(body as Parameters<typeof parseResponsesRequest>[0]);
  if (!query.trim()) {
    return NextResponse.json({ error: 'A non-empty input is required' }, { status: 400 });
  }

  // 4. Route through AgentPick — delegate to core router
  let routingResult: Awaited<ReturnType<typeof routeRequest>>;
  try {
    routingResult = await routeRequest(
      agent.id,
      capability,
      { params: { query } },
      { source: 'openai-compat' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Router error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const latencyMs = Date.now() - startMs;
  const traceId = routingResult.response?.meta?.trace_id ?? crypto.randomUUID();
  const toolUsed = routingResult.response?.meta?.tool_used ?? '';

  // Normalise results into a flat array for the output text
  const rawData = routingResult.response?.data;
  const results: unknown[] = Array.isArray(rawData)
    ? rawData
    : rawData && typeof rawData === 'object' && 'results' in rawData
      ? (rawData as { results: unknown[] }).results
      : rawData !== null && rawData !== undefined
        ? [rawData]
        : [];

  // 5. Return OpenAI Responses API envelope
  const response = buildOpenAIResponse(
    { tool_used: toolUsed, results, latency_ms: latencyMs },
    traceId,
    body.model ?? 'auto',
  );

  return NextResponse.json(response, {
    headers: {
      'x-agentpick-tool-used': toolUsed,
      'x-agentpick-latency-ms': String(latencyMs),
      'x-agentpick-trace-id': traceId,
    },
  });
}
