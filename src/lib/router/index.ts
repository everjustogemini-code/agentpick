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

// Maps tool slugs to their env var names for BYOK key injection
const SLUG_TO_ENV_VAR: Record<string, string> = {
  tavily: 'TAVILY_API_KEY',
  'exa-search': 'EXA_API_KEY',
  exa: 'EXA_API_KEY',
  serpapi: 'SERPER_API_KEY',
  serper: 'SERPER_API_KEY',
  'serper-api': 'SERPER_API_KEY',
  'jina-ai': 'JINA_API_KEY',
  jina: 'JINA_API_KEY',
  'jina-reader': 'JINA_API_KEY',
  firecrawl: 'FIRECRAWL_API_KEY',
  'firecrawl-api': 'FIRECRAWL_API_KEY',
  brave: 'BRAVE_API_KEY',
  'brave-search': 'BRAVE_API_KEY',
  'perplexity-search': 'PERPLEXITY_API_KEY',
  perplexity: 'PERPLEXITY_API_KEY',
  'you-search': 'YOU_API_KEY',
  you: 'YOU_API_KEY',
  'serpapi-google': 'SERPAPI_KEY',
  'bing-web-search': 'BING_API_KEY',
  bing: 'BING_API_KEY',
  apify: 'APIFY_API_KEY',
  'apify-scraper': 'APIFY_API_KEY',
  scrapingbee: 'SCRAPINGBEE_API_KEY',
  'scrapingbee-api': 'SCRAPINGBEE_API_KEY',
  browserbase: 'BROWSERBASE_API_KEY',
  'browserbase-api': 'BROWSERBASE_API_KEY',
  polygon: 'POLYGON_API_KEY',
  'polygon-io': 'POLYGON_API_KEY',
  alphavantage: 'ALPHAVANTAGE_API_KEY',
  'alpha-vantage': 'ALPHAVANTAGE_API_KEY',
  fmp: 'FMP_API_KEY',
  'financial-modeling-prep': 'FMP_API_KEY',
  'openai-embed': 'OPENAI_API_KEY',
  'openai-embeddings': 'OPENAI_API_KEY',
  'cohere-embed': 'COHERE_API_KEY',
  'cohere-embeddings': 'COHERE_API_KEY',
  'voyage-embed': 'VOYAGE_API_KEY',
  'voyage-embeddings': 'VOYAGE_API_KEY',
  voyage: 'VOYAGE_API_KEY',
  'jina-embed': 'JINA_API_KEY',
  'jina-embeddings': 'JINA_API_KEY',
};

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

export interface RouterRequest {
  tool?: string;
  tool_api_key?: string;
  params: Record<string, unknown>;
  fallback?: string[];
}

export interface RouterResponse {
  data: unknown;
  meta: {
    tool_used: string;
    latency_ms: number;
    fallback_used: boolean;
    fallback_from?: string;
    trace_id: string;
  };
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
): Promise<ToolCallResult> {
  const envVar = SLUG_TO_ENV_VAR[slug];

  if (toolApiKey && envVar) {
    // BYOK: temporarily inject key for this call
    const originalValue = process.env[envVar];
    process.env[envVar] = toolApiKey;
    try {
      return await callToolAPI(slug, query, params);
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
  return callToolAPI(slug, query, params);
}

/**
 * Find the best tool for a given capability from rankings.
 */
async function getBestToolForCapability(capability: string, exclude?: string[]): Promise<string | null> {
  const category = CAPABILITY_TO_CATEGORY[capability];
  if (!category) return null;

  const products = await prisma.product.findMany({
    where: {
      category: category as any,
      status: { in: BROWSE_STATUSES },
      ...(exclude?.length ? { slug: { notIn: exclude } } : {}),
    },
    orderBy: { weightedScore: 'desc' },
    select: { slug: true },
    take: 1,
  });

  return products[0]?.slug ?? null;
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
  return result.statusCode >= 500 || result.statusCode === 429 || result.statusCode === 0;
}

/**
 * Main router function.
 * Proxies the request, handles fallback, records traces.
 */
export async function routeRequest(
  agentId: string,
  capability: string,
  request: RouterRequest,
): Promise<{ response: RouterResponse; headers?: Record<string, string> }> {
  const query = extractQuery(request.params);

  // Step 1: Determine which tool to use
  let toolSlug: string = request.tool ?? '';
  if (!toolSlug) {
    const best = await getBestToolForCapability(capability);
    if (!best) {
      throw new Error(`No tools available for capability: ${capability}`);
    }
    toolSlug = best;
  }

  // Step 2: Call the tool
  const result = await callWithKey(toolSlug, query, request.tool_api_key, request.params);

  // Step 3: If successful, record trace and return
  if (!isFailure(result)) {
    const traceId = await recordTrace(agentId, toolSlug, capability, result, false);
    return {
      response: {
        data: result.response,
        meta: {
          tool_used: toolSlug,
          latency_ms: result.latencyMs,
          fallback_used: false,
          trace_id: traceId,
        },
      },
    };
  }

  // Step 4: Failure — record the failure trace
  await recordTrace(agentId, toolSlug, capability, result, false);

  // Step 5: Try fallback
  const failedTool = toolSlug;
  const triedTools = [toolSlug];

  // Try explicit fallback list first
  if (request.fallback?.length) {
    for (const fallbackSlug of request.fallback) {
      if (triedTools.includes(fallbackSlug)) continue;
      triedTools.push(fallbackSlug);

      // Use agent's key for fallback if available, otherwise AgentPick's
      const fallbackResult = await callWithKey(fallbackSlug, query, undefined, request.params);

      if (!isFailure(fallbackResult)) {
        const traceId = await recordTrace(agentId, fallbackSlug, capability, fallbackResult, true, failedTool);
        return {
          response: {
            data: fallbackResult.response,
            meta: {
              tool_used: fallbackSlug,
              latency_ms: fallbackResult.latencyMs,
              fallback_used: true,
              fallback_from: failedTool,
              trace_id: traceId,
            },
          },
          headers: { 'X-AgentPick-Fallback': fallbackSlug },
        };
      }

      // Fallback also failed — record and try next
      await recordTrace(agentId, fallbackSlug, capability, fallbackResult, true, failedTool);
    }
  }

  // Try #2 ranked tool from rankings using AgentPick's key
  const autoFallback = await getBestToolForCapability(capability, triedTools);
  if (autoFallback) {
    const autoResult = await callWithKey(autoFallback, query, undefined, request.params);

    if (!isFailure(autoResult)) {
      const traceId = await recordTrace(agentId, autoFallback, capability, autoResult, true, failedTool);
      return {
        response: {
          data: autoResult.response,
          meta: {
            tool_used: autoFallback,
            latency_ms: autoResult.latencyMs,
            fallback_used: true,
            fallback_from: failedTool,
            trace_id: traceId,
          },
        },
        headers: { 'X-AgentPick-Fallback': autoFallback },
      };
    }

    await recordTrace(agentId, autoFallback, capability, autoResult, true, failedTool);
  }

  // All fallbacks failed — return original error
  const traceId = `trace_fail_${Date.now()}`;
  return {
    response: {
      data: result.response,
      meta: {
        tool_used: toolSlug,
        latency_ms: result.latencyMs,
        fallback_used: false,
        trace_id: traceId,
      },
    },
  };
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
