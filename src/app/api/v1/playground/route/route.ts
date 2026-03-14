import { NextRequest } from 'next/server';
import { hashApiKey } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { routeRequest } from '@/lib/router';

export const maxDuration = 60;

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const RESULT_LIMIT = 3;
const MAX_QUERY_LENGTH = 2000;
const MAX_URL_LENGTH = 2048;
const PLAYGROUND_AGENT_TOKEN = 'ah_internal_playground_demo';

const rateStore = new Map<string, { count: number; resetAt: number }>();

const VALID_CAPABILITIES = ['search', 'crawl', 'embed'] as const;

type Capability = (typeof VALID_CAPABILITIES)[number];

type PlaygroundResult = {
  title: string;
  url?: string;
  snippet?: string;
  meta?: string[];
};

export function __resetPlaygroundRateLimit() {
  rateStore.clear();
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', 'no-store');
  return Response.json(body, {
    ...init,
    headers,
  });
}

function createPlaygroundTraceId() {
  return `trace_playground_${Date.now()}`;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

function checkIpRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();

  for (const [key, entry] of rateStore.entries()) {
    if (entry.resetAt <= now) {
      rateStore.delete(key);
    }
  }

  const entry = rateStore.get(ip);
  if (!entry) {
    rateStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.resetAt <= now) {
    rateStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { allowed: true };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}

function truncate(value: string | undefined, limit: number): string | undefined {
  if (!value) return undefined;
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

function toObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => isRecord(item));
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => readString(item))
    .filter((item): item is string => Boolean(item));
}

function compactMeta(values: Array<string | undefined>): string[] | undefined {
  const meta = values.filter((value): value is string => Boolean(value));
  return meta.length > 0 ? meta : undefined;
}

function firstNonEmptyObjectArray(...candidates: Record<string, unknown>[][]): Record<string, unknown>[] {
  for (const candidate of candidates) {
    if (candidate.length > 0) return candidate;
  }
  return [];
}

function mapSearchResult(item: Record<string, unknown>): PlaygroundResult {
  const url = readString(item.url) ?? readString(item.link);
  const score = readNumber(item.score);
  const title =
    readString(item.title) ??
    readString(item.name) ??
    url ??
    'Result';

  const snippet = truncate(
    readString(item.text) ??
      readString(item.content) ??
      readString(item.description) ??
      readString(item.snippet) ??
      readString(item.summary) ??
      readString(item.answer),
    220,
  );

  return {
    title,
    url,
    snippet,
    meta: compactMeta([
      readString(item.publishedDate),
      readString(item.author),
      score !== undefined ? `Score ${score.toFixed(2)}` : undefined,
    ]),
  };
}

function mapCrawlResult(item: Record<string, unknown>): PlaygroundResult {
  const metadata = isRecord(item.metadata) ? item.metadata : undefined;
  const url =
    readString(item.url) ??
    readString(item.sourceURL) ??
    readString(metadata?.sourceURL);

  const title =
    readString(item.title) ??
    readString(metadata?.title) ??
    url ??
    'Extracted page';

  const snippet = truncate(
    readString(item.markdown) ??
      readString(item.text) ??
      readString(item.content) ??
      readString(item.description) ??
      readString(item.body) ??
      readString(item.html),
    260,
  );

  const contentType =
    readString(item.contentType) ??
    readString(metadata?.contentType);

  return {
    title,
    url,
    snippet,
    meta: compactMeta([contentType]),
  };
}

function normalizeSearchResults(data: unknown): { items: PlaygroundResult[]; total: number } {
  const payload = isRecord(data) ? data : {};

  const candidates = firstNonEmptyObjectArray(
    toObjectArray(payload.results),
    toObjectArray(payload.data),
    isRecord(payload.web) ? toObjectArray(payload.web.results) : [],
    toObjectArray(payload.organic),
    toObjectArray(payload.organic_results),
    toObjectArray(payload.hits),
  );

  if (candidates.length > 0) {
    return {
      items: candidates.slice(0, RESULT_LIMIT).map(mapSearchResult),
      total: candidates.length,
    };
  }

  const citations = toStringArray(payload.citations);
  if (citations.length > 0) {
    return {
      items: citations.slice(0, RESULT_LIMIT).map((url, index) => ({
        title: `Citation ${index + 1}`,
        url,
      })),
      total: citations.length,
    };
  }

  const answer =
    readString(payload.answer) ??
    readString(payload.text) ??
    readString(payload.summary);

  return {
    items: answer
      ? [
          {
            title: 'Search answer',
            snippet: truncate(answer, 220),
          },
        ]
      : [],
    total: answer ? 1 : 0,
  };
}

function normalizeCrawlResults(data: unknown): { items: PlaygroundResult[]; total: number } {
  if (Array.isArray(data)) {
    const items = toObjectArray(data);
    return {
      items: items.slice(0, RESULT_LIMIT).map(mapCrawlResult),
      total: items.length,
    };
  }

  const payload = isRecord(data) ? data : {};
  const dataItems = toObjectArray(payload.data);
  if (dataItems.length > 0) {
    return {
      items: dataItems.slice(0, RESULT_LIMIT).map(mapCrawlResult),
      total: dataItems.length,
    };
  }

  const single = mapCrawlResult(payload);
  const hasPreview = Boolean(single.url || single.snippet || single.title !== 'Extracted page');

  return {
    items: hasPreview ? [single] : [],
    total: hasPreview ? 1 : 0,
  };
}

function normalizeEmbedResults(data: unknown): { items: PlaygroundResult[]; total: number } {
  const payload = isRecord(data) ? data : {};
  const count = readNumber(payload.count);
  const dimensions = readNumber(payload.dimensions);
  const tokens = readNumber(payload.tokens);

  const meta = compactMeta([
    count !== undefined ? `${count} vector${count === 1 ? '' : 's'}` : undefined,
    dimensions !== undefined ? `${dimensions} dimensions` : undefined,
    tokens !== undefined ? `${tokens} tokens` : undefined,
  ]);

  if (!meta) {
    return { items: [], total: 0 };
  }

  return {
    items: [
      {
        title: 'Embedding computed',
        snippet: 'Vector preview generated for the submitted text.',
        meta,
      },
    ],
    total: 1,
  };
}

function normalizeResults(capability: Capability, data: unknown): { items: PlaygroundResult[]; total: number } {
  switch (capability) {
    case 'crawl':
      return normalizeCrawlResults(data);
    case 'embed':
      return normalizeEmbedResults(data);
    case 'search':
    default:
      return normalizeSearchResults(data);
  }
}

function normalizeCapability(value: unknown): Capability | null {
  if (typeof value !== 'string') return null;
  return VALID_CAPABILITIES.includes(value as Capability) ? (value as Capability) : null;
}

function normalizeCrawlQuery(query: string): string | null {
  const candidate =
    query.startsWith('http://') || query.startsWith('https://')
      ? query
      : `https://${query}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function getQueryLimit(capability: Capability): number {
  return capability === 'crawl' ? MAX_URL_LENGTH : MAX_QUERY_LENGTH;
}

function buildParams(capability: Capability, query: string): Record<string, unknown> {
  if (capability === 'crawl') {
    return { url: query };
  }

  if (capability === 'embed') {
    return { text: query };
  }

  return { query };
}

function extractErrorMessage(data: unknown): string | undefined {
  if (!isRecord(data)) return undefined;

  const direct = readString(data.message) ?? readString(data.error);
  if (direct) return direct;

  if (isRecord(data.error)) {
    return readString(data.error.message);
  }

  return undefined;
}

async function getPlaygroundAgent() {
  const apiKeyHash = hashApiKey(PLAYGROUND_AGENT_TOKEN);

  return prisma.agent.upsert({
    where: { apiKeyHash },
    update: {
      lastActiveAt: new Date(),
      isRestricted: false,
    },
    create: {
      apiKeyHash,
      name: 'playground-agent',
      modelFamily: 'internal',
      orchestrator: 'agentpick-playground',
      description: 'Internal agent used for the public API playground.',
      isRestricted: false,
    },
    select: { id: true },
  }) as Promise<{ id: string }>;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkIpRateLimit(ip);

  if (!rateLimit.allowed) {
    return jsonNoStore(
      {
        error: `Rate limit exceeded. Try again in ${rateLimit.retryAfterSeconds ?? 60}s.`,
        retryAfterSeconds: rateLimit.retryAfterSeconds ?? 60,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds ?? 60),
        },
      },
    );
  }

  let body: { query?: unknown; capability?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const capability = normalizeCapability(body.capability);
  const query = readString(body.query);

  if (!capability) {
    return jsonNoStore(
      { error: `capability must be one of: ${VALID_CAPABILITIES.join(', ')}` },
      { status: 400 },
    );
  }

  if (!query) {
    return jsonNoStore({ error: 'query is required.' }, { status: 400 });
  }

  const queryLimit = getQueryLimit(capability);

  if (query.length > queryLimit) {
    return jsonNoStore(
      { error: `query exceeds maximum length of ${queryLimit} characters.` },
      { status: 413 },
    );
  }

  const normalizedQuery =
    capability === 'crawl' ? normalizeCrawlQuery(query) : query;

  if (!normalizedQuery) {
    return jsonNoStore(
      { error: 'crawl requests require a valid http(s) URL.' },
      { status: 400 },
    );
  }

  try {
    const playgroundAgent = await getPlaygroundAgent();
    const { response } = await routeRequest(playgroundAgent.id, capability, {
      params: buildParams(capability, normalizedQuery),
      strategy: 'auto',
    });

    const normalized = normalizeResults(capability, response.data);
    const failed = response.meta.trace_id.startsWith('trace_fail_');
    const errorMessage = failed ? extractErrorMessage(response.data) ?? 'Routing failed.' : undefined;

    return jsonNoStore(
      {
        capability,
        tool: response.meta.tool_used,
        latencyMs: response.meta.latency_ms,
        traceId: response.meta.trace_id,
        reasoning: response.meta.ai_classification?.reasoning ?? null,
        results: normalized.items,
        totalResults: normalized.total,
        capped: normalized.total > RESULT_LIMIT,
        error: errorMessage,
      },
      { status: failed ? 502 : 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Playground routing failed.';

    return jsonNoStore(
      {
        capability,
        tool: null,
        latencyMs: 0,
        traceId: createPlaygroundTraceId(),
        results: [],
        error: message,
      },
      { status: 502 },
    );
  }
}
