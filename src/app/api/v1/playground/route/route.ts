import { NextRequest } from 'next/server';

export const maxDuration = 60;

// In-memory rate limit store: ip -> { count, resetAt }
const ipRateStore = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT = 5;

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateStore.get(ip);
  if (!entry || now >= entry.resetAt) {
    ipRateStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true; // allowed
  }
  if (entry.count >= RATE_LIMIT) {
    return false; // blocked
  }
  entry.count++;
  return true; // allowed
}

async function checkUpstashRateLimit(ip: string): Promise<boolean> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) return checkIpRateLimit(ip);

  try {
    const key = `playground:route:${ip}`;
    // INCR + EXPIRE using pipeline
    const pipelineRes = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, 60],
      ]),
    });
    const pipeline = await pipelineRes.json();
    const count = pipeline?.[0]?.result ?? 0;
    return count <= RATE_LIMIT;
  } catch {
    // Fall back to in-memory on Upstash error
    return checkIpRateLimit(ip);
  }
}

const VALID_TYPES = ['search', 'embed', 'finance'] as const;
type PlaygroundType = (typeof VALID_TYPES)[number];

export async function POST(request: NextRequest) {
  // Get IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  // Rate limit check
  const allowed = await checkUpstashRateLimit(ip);
  if (!allowed) {
    return Response.json(
      { error: 'Rate limit exceeded. Try again in 60 seconds.' },
      { status: 429 },
    );
  }

  // Parse body
  let body: { query?: unknown; type?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { query, type } = body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return Response.json({ error: 'query is required.' }, { status: 400 });
  }

  if (!type || !VALID_TYPES.includes(type as PlaygroundType)) {
    return Response.json(
      { error: `type must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  const playgroundKey = process.env.PLAYGROUND_KEY;
  if (!playgroundKey) {
    return Response.json({ error: 'Playground not configured.' }, { status: 503 });
  }

  const reqUrl = new URL(request.url);
  const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;

  // Build params based on type
  let params: Record<string, unknown>;
  if (type === 'finance') {
    params = { query, ticker: query.toUpperCase() };
  } else if (type === 'embed') {
    params = { text: query };
  } else {
    params = { query };
  }

  const start = Date.now();
  const traceId = `pg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const upstream = await fetch(`${baseUrl}/api/v1/route/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${playgroundKey}`,
      },
      body: JSON.stringify({ params, strategy: 'auto' }),
    });

    const data = await upstream.json();
    const latency_ms = Date.now() - start;

    if (!upstream.ok) {
      return Response.json({ ...data, _playground: true, traceId, latency_ms }, { status: upstream.status });
    }

    // Extract results array (cap to 2)
    let results: unknown[] = [];
    if (Array.isArray(data?.data?.results)) {
      results = data.data.results.slice(0, 2);
    } else if (Array.isArray(data?.results)) {
      results = data.results.slice(0, 2);
    } else if (Array.isArray(data?.data)) {
      results = data.data.slice(0, 2);
    }

    const tool = data?.meta?.tool_used ?? null;
    const classification_reason = data?.meta?.ai_classification?.reasoning ?? undefined;

    return Response.json({
      ...data,
      results,
      _playground: true,
      traceId,
      tool,
      ...(classification_reason !== undefined && { classification_reason }),
      latency_ms,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Router error';
    return Response.json(
      { error: message, _playground: true, traceId, latency_ms: Date.now() - start },
      { status: 502 },
    );
  }
}
