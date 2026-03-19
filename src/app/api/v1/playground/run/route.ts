import { NextRequest } from 'next/server';
import { hashApiKey, authenticateAgent } from '@/lib/auth';
import { prisma, withRetry } from '@/lib/prisma';
import { checkInMemoryRateLimit } from '@/lib/rate-limit';

export const maxDuration = 60;

// PLAYGROUND_ANONYMOUS_KEY: internal service key used for anonymous playground requests.
// Set this env var to an ah_* API key registered in the DB with sufficient quota.
const PLAYGROUND_AGENT_TOKEN = process.env.PLAYGROUND_ANONYMOUS_KEY ?? 'ah_internal_playground_demo';

// In-memory rate limit fallback (used when DB table is unavailable)
const memRateStore = new Map<string, { count: number; resetAt: number }>();
function checkMemRateLimit(ip: string, limit = 10, windowMs = 86_400_000): boolean {
  const now = Date.now();
  const entry = memRateStore.get(ip);
  if (!entry || now >= entry.resetAt) {
    memRateStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

async function getPlaygroundAgent() {
  const apiKeyHash = hashApiKey(PLAYGROUND_AGENT_TOKEN);
  return withRetry(() => prisma.agent.upsert({
    where: { apiKeyHash },
    update: { lastActiveAt: new Date(), isRestricted: false },
    create: {
      apiKeyHash,
      name: 'playground-agent',
      modelFamily: 'internal',
      orchestrator: 'agentpick-playground',
      description: 'Internal agent used for the public API playground.',
      isRestricted: false,
    },
    select: { id: true },
  }));
}

export async function POST(request: NextRequest) {
  // 1. Check if Authorization header contains a valid API key
  let isAuthenticated = false;
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const rawKey = authHeader.slice(7).trim();
    if (rawKey && rawKey !== (process.env.PLAYGROUND_ANONYMOUS_KEY ?? '')) {
      try {
        const agent = await authenticateAgent(request);
        if (agent) isAuthenticated = true;
      } catch {
        // invalid key — treat as anonymous
      }
    }
  }

  // 2. Parse body + ?q= URL param for shareable links
  const body = await request.json().catch(() => ({})) as { endpoint?: string; query?: string; strategy?: string; apiKey?: string };
  const urlQ = new URL(request.url).searchParams.get('q');
  const query = body.query ?? urlQ ?? '';

  if (!query.trim()) {
    return Response.json({ error: 'query is required' }, { status: 400 });
  }

  const { endpoint = 'search', strategy = 'auto', apiKey } = body;

  const validEndpoints = ['search', 'crawl', 'embed', 'finance'];
  if (!validEndpoints.includes(endpoint)) {
    return Response.json({ error: `endpoint must be one of: ${validEndpoints.join(', ')}` }, { status: 400 });
  }

  // 3. Rate limiting
  // If authenticated via Authorization header: bypass IP rate limit entirely
  // If not authenticated (anonymous): enforce 10/day/IP via PlaygroundAnonymousUsage
  // Legacy: body.apiKey path kept for backwards compat
  const demoKey = process.env.PLAYGROUND_DEMO_KEY ?? PLAYGROUND_AGENT_TOKEN;
  const isLegacyDemo = !isAuthenticated && (!apiKey || apiKey === demoKey);

  if (!isAuthenticated) {
    // Check legacy demo key rate limit (3/hour)
    const isDemoKey = (body.apiKey ?? '') === (process.env.DEMO_API_KEY ?? '__unset__');
    if (isDemoKey) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
      const { allowed, retryAfterSecs } = checkInMemoryRateLimit(ip, 3, 3_600_000);
      if (!allowed) {
        return Response.json(
          { error: { code: 'RATE_LIMITED', message: 'Demo key: max 3 requests per hour per IP.' } },
          { status: 429, headers: { 'Retry-After': String(retryAfterSecs) } },
        );
      }
    }

    // Anonymous IP rate limit: 10/day via PlaygroundAnonymousUsage
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '0.0.0.0';
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC

    let limitExceeded = false;
    try {
      const db = prisma as any;
      const record = await db.playgroundAnonymousUsage.upsert({
        where: { ip_date: { ip, date } },
        create: { ip, date, count: 1 },
        update: { count: { increment: 1 } },
        select: { count: true },
      });
      if (record.count > 10) {
        limitExceeded = true;
      }
    } catch {
      // DB unavailable — fall back to in-memory rate limiting
      limitExceeded = !checkMemRateLimit(ip);
    }

    if (limitExceeded) {
      const today = new Date().toISOString().slice(0, 10);
      const nextDay = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
      return Response.json(
        { error: 'Daily limit reached', limit: 10, resetAt: `${nextDay}T00:00:00Z` },
        { status: 429 },
      );
    }
  }

  // Ensure playground agent exists in DB for anonymous requests
  if (!isAuthenticated) {
    await getPlaygroundAgent();
  }

  // Build the authorization header
  // Authenticated: use the caller's own key; anonymous: use internal playground key
  let authKey: string;
  if (isAuthenticated && authHeader?.startsWith('Bearer ')) {
    authKey = authHeader.slice(7).trim();
  } else if (!isLegacyDemo && apiKey) {
    authKey = apiKey;
  } else {
    authKey = demoKey;
  }

  // Derive base URL from request
  const reqUrl = new URL(request.url);
  const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;

  // Build params based on endpoint type
  let params: Record<string, unknown>;
  if (endpoint === 'finance') {
    params = { query, ticker: query.toUpperCase() };
  } else if (endpoint === 'crawl') {
    params = { url: query.startsWith('http') ? query : `https://${query}` };
  } else if (endpoint === 'embed') {
    params = { text: query };
  } else {
    params = { query };
  }

  // Forward to real route
  try {
    const upstream = await fetch(`${baseUrl}/api/v1/route/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`,
      },
      body: JSON.stringify({ params, strategy }),
    });

    const data = await upstream.json();
    // Normalize: expose meta fields at top level so the UI can read tool_used and latency_ms directly
    // Also forward the camelCase meta envelope (tool, latencyMs, resultCount, strategy)
    const normalized = {
      ...data,
      tool_used: data.meta?.tool_used ?? data.tool_used ?? null,
      latency_ms: data.meta?.latency_ms ?? data.latency_ms ?? 0,
    };
    return Response.json(normalized, { status: upstream.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Router error';
    return Response.json({ error: message }, { status: 502 });
  }
}
