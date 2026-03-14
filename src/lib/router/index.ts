/**
 * AgentPick Router — BYOK proxy.
 * Agents call this instead of calling APIs directly.
 * We proxy the request, measure latency, record traces, and handle fallback.
 * Agent API keys are NEVER stored, logged, or persisted.
 */

import { prisma } from '@/lib/prisma';
import { callToolAPI } from '@/lib/benchmark/adapters/index';
import { BROWSE_STATUSES } from '@/lib/product-status';
import type { ToolCallResult } from '@/lib/benchmark/adapters/types';
import { getClassification, aiRoute, type QueryContext } from './ai-classify';
import {
  getByokEnvVarForService,
  resolveStoredByokKeyForSlug,
  touchByokKeyUsage,
} from './byok';

// Map capability names to categories for auto-routing
const CAPABILITY_TO_CATEGORY: Record<string, string> = {
  search: 'search_research',
  crawl: 'web_crawling',
  embed: 'storage_memory',
  finance: 'finance_data',
  code: 'code_compute',
  storage: 'storage_memory',
  communication: 'communication',
  payments: 'payments_commerce',
  auth: 'auth_identity',
  scheduling: 'scheduling',
  ai: 'ai_models',
  observability: 'observability',
};

/**
 * CAPABILITY_TOOLS: Only these slugs can be selected for each capability.
 * Every slug here MUST have a working adapter in ADAPTERS map.
 * This prevents the router from picking tools like Mapbox for search.
 */
export const CAPABILITY_TOOLS: Record<string, string[]> = {
  search: ['exa-search', 'tavily', 'serpapi', 'serpapi-google', 'brave-search', 'perplexity-search', 'you-search', 'jina-ai', 'bing-web-search'],
  crawl: ['firecrawl', 'jina-ai', 'apify', 'scrapingbee', 'browserbase'],
  embed: ['openai-embed', 'cohere-embed', 'voyage-embed', 'jina-embed'],
  finance: ['polygon-io', 'alpha-vantage', 'financial-modeling-prep'],
};

/**
 * Hardcoded tool characteristics for strategy differentiation.
 * Used when DB benchmark data is insufficient to differentiate tools.
 */
export const TOOL_CHARACTERISTICS: Record<string, { quality: number; cost: number; latency: number; stability: number }> = {
  'exa-search':             { quality: 4.6, cost: 0.002,   latency: 315,  stability: 0.95 },
  tavily:                   { quality: 4.0, cost: 0.001,   latency: 182,  stability: 0.97 },
  serpapi:                  { quality: 3.0, cost: 0.0005,  latency: 89,   stability: 0.98 },
  'brave-search':           { quality: 3.2, cost: 0.0001,  latency: 150,  stability: 0.93 },
  'perplexity-search':      { quality: 4.2, cost: 0.005,   latency: 500,  stability: 0.90 },
  'you-search':             { quality: 3.0, cost: 0.001,   latency: 200,  stability: 0.92 },
  'jina-ai':                { quality: 3.5, cost: 0.001,   latency: 250,  stability: 0.94 },
  'serpapi-google':          { quality: 3.2, cost: 0.01,    latency: 120,  stability: 0.96 },
  'bing-web-search':         { quality: 3.0, cost: 0.005,   latency: 180,  stability: 0.94 },
  firecrawl:                { quality: 4.0, cost: 0.003,   latency: 1200, stability: 0.93 },
  apify:                    { quality: 3.5, cost: 0.005,   latency: 2000, stability: 0.90 },
  scrapingbee:              { quality: 3.0, cost: 0.002,   latency: 1500, stability: 0.91 },
  browserbase:              { quality: 3.8, cost: 0.005,   latency: 3000, stability: 0.88 },
  'polygon-io':             { quality: 4.5, cost: 0.001,   latency: 100,  stability: 0.99 },
  'alpha-vantage':          { quality: 3.5, cost: 0.0,     latency: 300,  stability: 0.95 },
  'financial-modeling-prep': { quality: 3.8, cost: 0.001,   latency: 200,  stability: 0.96 },
  'openai-embed':           { quality: 4.5, cost: 0.0001,  latency: 150,  stability: 0.99 },
  'cohere-embed':           { quality: 4.0, cost: 0.0001,  latency: 120,  stability: 0.98 },
  'voyage-embed':           { quality: 4.2, cost: 0.0001,  latency: 130,  stability: 0.97 },
  'jina-embed':             { quality: 3.8, cost: 0.00005, latency: 100,  stability: 0.96 },
};

export type Strategy = 'auto' | 'balanced' | 'best_performance' | 'cheapest' | 'most_stable';

export interface RouterRequest {
  tool?: string;
  tool_api_key?: string;
  params: Record<string, unknown>;
  fallback?: string[];
  strategy?: Strategy;
  /** Request-level priority tools — overrides account-level and strategy-based selection. */
  priority_tools?: string[];
}

export interface RouterResponse {
  data: unknown;
  meta: {
    tool_used: string;
    latency_ms: number;
    fallback_used: boolean;
    fallback_from?: string;
    trace_id: string;
    ai_classification?: QueryContext & { reasoning?: string };
    classification_ms?: number;
    cost_usd?: number;
    result_count?: number;
    byok_used?: boolean;
    byok_service?: string;
  };
}

interface RouteRequestOptions {
  developerId?: string;
  storedByokKeys?: unknown;
}

/**
 * Call a tool adapter with BYOK key injection.
 * The agent's key is used in-memory only and NEVER stored.
 */
async function callWithKey(
  slug: string,
  query: string,
  toolApiKey?: string,
  params?: Record<string, unknown>,
  envVarOverride?: string | null,
): Promise<ToolCallResult> {
  const envVar = envVarOverride;

  if (toolApiKey && envVar) {
    // BYOK: temporarily inject key for this call
    const originalValue = process.env[envVar];
    process.env[envVar] = toolApiKey;
    try {
      return await callToolAPI(slug, query, params, { trackUsage: false });
    } finally {
      // ALWAYS restore — even on error
      if (originalValue !== undefined) {
        process.env[envVar] = originalValue;
      } else {
        delete process.env[envVar];
      }
    }
  }

  // No BYOK key — use AgentPick's vault key (already in env)
  return callToolAPI(slug, query, params, { trackUsage: true });
}

/**
 * Get ALL tools for a capability, ranked by strategy.
 * Returns a sorted list of slugs — first = best pick.
 * ONLY returns tools from CAPABILITY_TOOLS (tools with working adapters).
 */
export function getRankedToolsForCapability(
  capability: string,
  strategy: Strategy = 'balanced',
  exclude?: string[],
): string[] {
  const allowedSlugs = CAPABILITY_TOOLS[capability];
  if (!allowedSlugs) return [];

  const filtered = exclude?.length
    ? allowedSlugs.filter(s => !exclude.includes(s))
    : [...allowedSlugs];

  if (filtered.length === 0) return [];

  // Sort by strategy using hardcoded characteristics
  return filtered.sort((a, b) => {
    const ca = TOOL_CHARACTERISTICS[a];
    const cb = TOOL_CHARACTERISTICS[b];
    if (!ca && !cb) return 0;
    if (!ca) return 1;
    if (!cb) return -1;

    switch (strategy) {
      case 'best_performance':
        // Highest quality first
        return cb.quality - ca.quality;
      case 'most_stable':
        // Highest stability first, with quality floor
        if (ca.quality < 2.5 && cb.quality >= 2.5) return 1;
        if (cb.quality < 2.5 && ca.quality >= 2.5) return -1;
        return cb.stability - ca.stability;
      case 'cheapest':
        // Lowest cost first, but must have quality >= 3.0
        if (ca.quality < 3.0 && cb.quality >= 3.0) return 1;
        if (cb.quality < 3.0 && ca.quality >= 3.0) return -1;
        return ca.cost - cb.cost;
      case 'balanced':
      default: {
        // Prefer quality-tier tools (≥4.0) first, then sort by cost-efficiency within each tier.
        // This ensures balanced picks a high-quality tool (e.g. tavily) rather than the cheapest.
        const QUALITY_FLOOR = 4.0;
        const aMeetsFloor = ca.quality >= QUALITY_FLOOR;
        const bMeetsFloor = cb.quality >= QUALITY_FLOOR;
        if (aMeetsFloor && !bMeetsFloor) return -1;
        if (bMeetsFloor && !aMeetsFloor) return 1;
        // Within the same quality tier: best bang for buck
        const scoreA = ca.quality / (Math.max(ca.cost, 0.0001) * Math.max(ca.latency, 1));
        const scoreB = cb.quality / (Math.max(cb.cost, 0.0001) * Math.max(cb.latency, 1));
        return scoreB - scoreA;
      }
    }
  });
}

/**
 * Record a trace in the TelemetryEvent table.
 * NEVER includes tool_api_key or any agent secrets.
 */
async function recordTrace(
  agentId: string,
  tool: string,
  capability: string,
  result: ToolCallResult,
  isFallback: boolean,
  fallbackFrom?: string,
): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { slug: tool },
    select: { id: true },
  });

  const event = await prisma.telemetryEvent.create({
    data: {
      agentId,
      productId: product?.id ?? null,
      tool,
      task: capability,
      success: result.statusCode >= 200 && result.statusCode < 400,
      statusCode: result.statusCode,
      latencyMs: result.latencyMs,
      costUsd: result.costUsd,
      resultCount: result.resultCount,
      source: 'router',
      context: isFallback ? `fallback_from:${fallbackFrom}` : null,
    },
  });

  // Increment product telemetry count
  if (product) {
    await prisma.product.update({
      where: { id: product.id },
      data: { telemetryCount: { increment: 1 } },
    });
  }

  return event.id;
}

function isFailure(result: ToolCallResult): boolean {
  // 5xx server error, 429 rate limit, 0 timeout, 401/402/403 auth/payment failure = all trigger fallback
  return result.statusCode >= 500 || result.statusCode === 429 || result.statusCode === 0
    || result.statusCode === 401 || result.statusCode === 402 || result.statusCode === 403;
}

/**
 * Circuit breaker: tracks recent failures per tool.
 * Tools that fail repeatedly get deprioritized in routing.
 */
const toolHealthMap = new Map<string, { failures: number; lastFailure: number; lastSuccess: number }>();
const CIRCUIT_BREAKER_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const CIRCUIT_BREAKER_THRESHOLD = 3; // 3 failures in window = deprioritize

function recordToolHealth(slug: string, success: boolean) {
  const now = Date.now();
  const entry = toolHealthMap.get(slug) ?? { failures: 0, lastFailure: 0, lastSuccess: 0 };
  if (success) {
    entry.lastSuccess = now;
    // Successful call reduces failure count
    entry.failures = Math.max(0, entry.failures - 1);
  } else {
    entry.failures++;
    entry.lastFailure = now;
  }
  toolHealthMap.set(slug, entry);
}

function isToolDegraded(slug: string): boolean {
  const entry = toolHealthMap.get(slug);
  if (!entry) return false;
  const now = Date.now();
  // Reset if window has passed since last failure
  if (now - entry.lastFailure > CIRCUIT_BREAKER_WINDOW_MS) {
    entry.failures = 0;
    return false;
  }
  return entry.failures >= CIRCUIT_BREAKER_THRESHOLD;
}

/** Reorder tools: move degraded tools to the end of the list */
function applyCircuitBreaker(tools: string[]): string[] {
  const healthy: string[] = [];
  const degraded: string[] = [];
  for (const tool of tools) {
    if (isToolDegraded(tool)) {
      degraded.push(tool);
    } else {
      healthy.push(tool);
    }
  }
  return [...healthy, ...degraded];
}

/**
 * Main router function.
 * Proxies the request, handles fallback through ALL capability tools, records traces.
 */
export async function routeRequest(
  agentId: string,
  capability: string,
  request: RouterRequest,
  options: RouteRequestOptions = {},
): Promise<{ response: RouterResponse; headers?: Record<string, string> }> {
  const query = extractQuery(request.params);
  const strategy = request.strategy ?? 'balanced';

  // Step 0: If auto strategy, classify the query first
  let aiClassificationResult: QueryContext | undefined;
  let classificationMs = 0;
  let aiRankedTools: string[] | undefined;

  if (strategy === 'auto') {
    const classification = await getClassification(query, capability);
    aiClassificationResult = classification.context;
    classificationMs = classification.classificationMs;
    aiRankedTools = aiRoute(classification.context, capability);
  }

  // Step 1: Build the ordered tool list for this capability + strategy
  // Apply circuit breaker to deprioritize repeatedly failing tools
  const rawRankedTools = aiRankedTools ?? getRankedToolsForCapability(capability, strategy === 'auto' ? 'balanced' : strategy);
  const rankedTools = applyCircuitBreaker(rawRankedTools);
  if (rankedTools.length === 0) {
    throw new Error(`No tools available for capability: ${capability}`);
  }

  // Step 2: Determine primary tool and build priority chain.
  // Precedence: explicit `tool` > request-level `priority_tools` > strategy-based ranking
  let toolSlug: string;
  if (request.tool) {
    toolSlug = request.tool;
  } else if (request.priority_tools?.length) {
    // Request-level priority overrides strategy-based selection
    toolSlug = request.priority_tools[0];
  } else {
    toolSlug = rankedTools[0];
  }

  // Step 3: Build complete fallback chain
  // Order: requested tool → priority_tools → explicit fallbacks → remaining ranked tools
  const triedTools: string[] = [];
  const fullChain: string[] = [toolSlug];

  // Add remaining priority tools (after the first which is already toolSlug)
  if (request.priority_tools?.length) {
    for (const pt of request.priority_tools) {
      if (!fullChain.includes(pt)) fullChain.push(pt);
    }
  }

  // Add explicit fallbacks from request
  if (request.fallback?.length) {
    for (const fb of request.fallback) {
      if (!fullChain.includes(fb)) fullChain.push(fb);
    }
  }

  // Add remaining ranked tools not yet in chain
  for (const rt of rankedTools) {
    if (!fullChain.includes(rt)) fullChain.push(rt);
  }

  // Step 4: Try each tool in order until one succeeds.
  // Cap at 3 fallbacks max to prevent unbounded latency.
  const MAX_ATTEMPTS = 4; // 1 primary + 3 fallbacks
  let firstFailedTool: string | undefined;
  let lastResult: ToolCallResult | undefined;
  let lastAttemptUsedByok = false;
  let lastByokService: string | undefined;
  const routeStartTime = Date.now();
  const TOTAL_TIMEOUT_MS = 12_000; // Hard ceiling: 12s total routing time

  for (const candidateSlug of fullChain) {
    if (triedTools.includes(candidateSlug)) continue;
    if (triedTools.length >= MAX_ATTEMPTS) break;
    if (Date.now() - routeStartTime > TOTAL_TIMEOUT_MS) break;
    triedTools.push(candidateSlug);

    const isFallbackAttempt = triedTools.length > 1;
    const requestKey = !isFallbackAttempt && request.tool_api_key ? request.tool_api_key : undefined;
    const storedByok = !requestKey
      ? resolveStoredByokKeyForSlug(options.storedByokKeys, candidateSlug)
      : null;
    const byokService = storedByok?.service;
    const envVar = requestKey
      ? getByokEnvVarForService(candidateSlug)
      : (storedByok ? getByokEnvVarForService(storedByok.service) : null);
    const apiKey = requestKey ?? storedByok?.apiKey;
    const byokUsed = Boolean(apiKey && envVar);

    let result: ToolCallResult;
    try {
      result = await callWithKey(candidateSlug, query, apiKey, request.params, envVar);
    } catch (adapterErr) {
      // Adapter threw (e.g. missing API key) — treat as failure, continue fallback
      console.error(`[Router] Adapter ${candidateSlug} threw:`, adapterErr);
      result = {
        statusCode: 0,
        latencyMs: 0,
        resultCount: 0,
        response: { error: adapterErr instanceof Error ? adapterErr.message : 'Adapter error' },
        costUsd: 0,
      };
    }
    lastResult = result;
    lastAttemptUsedByok = byokUsed;
    lastByokService = byokUsed ? (byokService ?? candidateSlug) : undefined;

    // Record tool health for circuit breaker
    recordToolHealth(candidateSlug, !isFailure(result));

    if (!isFailure(result)) {
      if (storedByok && options.developerId) {
        touchByokKeyUsage(options.developerId, options.storedByokKeys, candidateSlug).catch(() => {});
      }
      // Success!
      const traceId = await recordTrace(
        agentId, candidateSlug, capability, result,
        isFallbackAttempt, isFallbackAttempt ? firstFailedTool : undefined,
      );
      const meta: RouterResponse['meta'] = {
        tool_used: candidateSlug,
        latency_ms: result.latencyMs,
        fallback_used: isFallbackAttempt,
        fallback_from: isFallbackAttempt ? firstFailedTool : undefined,
        trace_id: traceId,
        cost_usd: result.costUsd,
        result_count: result.resultCount,
        byok_used: byokUsed,
        byok_service: byokUsed ? (byokService ?? candidateSlug) : undefined,
      };
      if (aiClassificationResult) {
        meta.ai_classification = {
          ...aiClassificationResult,
          reasoning: buildAiReasoning(aiClassificationResult, candidateSlug),
        };
        meta.classification_ms = classificationMs;
      }
      return {
        response: { data: result.response, meta },
        headers: isFallbackAttempt ? { 'X-AgentPick-Fallback': candidateSlug } : undefined,
      };
    }

    // Failed — record the failure and continue
    if (!firstFailedTool) firstFailedTool = candidateSlug;
    await recordTrace(
      agentId, candidateSlug, capability, result,
      isFallbackAttempt, isFallbackAttempt ? firstFailedTool : undefined,
    );
  }

  // All tools failed — return last failure
  const traceId = `trace_fail_${Date.now()}`;
  return {
    response: {
      data: lastResult?.response ?? { error: 'All tools failed' },
      meta: {
        tool_used: toolSlug,
        latency_ms: lastResult?.latencyMs ?? 0,
        fallback_used: triedTools.length > 1,
        fallback_from: firstFailedTool,
        trace_id: traceId,
        cost_usd: lastResult?.costUsd ?? 0,
        result_count: lastResult?.resultCount ?? 0,
        byok_used: lastAttemptUsedByok,
        byok_service: lastByokService,
      },
    },
  };
}

function buildAiReasoning(ctx: QueryContext, toolUsed: string): string {
  const parts: string[] = [];
  if (ctx.type === 'research' || ctx.depth === 'deep') parts.push('Deep research');
  else if (ctx.type === 'news') parts.push('News query');
  else if (ctx.type === 'realtime') parts.push('Realtime data');
  else parts.push('Simple lookup');

  if (ctx.domain !== 'general') parts.push(ctx.domain);
  parts.push(`→ ${toolUsed}`);
  return parts.join(' + ');
}

/**
 * Extract query string from params.
 * Supports: params.query, params.q, params.text, params.input, params.url
 */
function extractQuery(params: Record<string, unknown>): string {
  if (typeof params.query === 'string') return params.query;
  if (typeof params.q === 'string') return params.q;
  if (typeof params.text === 'string') return params.text;
  if (typeof params.input === 'string') return params.input;
  if (typeof params.url === 'string') return params.url;
  if (typeof params.ticker === 'string') return params.ticker;
  if (typeof params.symbol === 'string') return params.symbol;
  // Fallback: stringify the first string value
  for (const val of Object.values(params)) {
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return '';
}
