import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const AGENT_UA_PATTERNS = [
  'python-requests',
  'axios',
  'node-fetch',
  'curl',
  'langchain',
  'openai',
  'anthropic',
  'httpx',
  'got/',
  'undici',
  'crewai',
  'autogpt',
];

// ─── In-memory rate limiting ──────────────────────────────────────────────────
// Tiers (router API key calls):
//   free:   100/day,  10/min
//   pro:   1000/day, 100/min
//   growth: 10000/day, 1000/min
// Public API (no key): 30/min per IP.

type Bucket = { count: number; resetAt: number };
const ipMinuteBuckets = new Map<string, Bucket>();
const ipDayBuckets = new Map<string, Bucket>();

const RATE_LIMITS = {
  free:   { perMin: 60,   perDay: 10000 },
  pro:    { perMin: 200,  perDay: 10000 },
  growth: { perMin: 1000, perDay: 100000 },
  public: { perMin: 60,   perDay: 10000 },
} as const;

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

function checkBucket(map: Map<string, Bucket>, key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let bucket = map.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    map.set(key, bucket);
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

/** Purge stale buckets every ~5 min to avoid unbounded memory growth */
let lastPurge = Date.now();
function maybePurgeBuckets() {
  const now = Date.now();
  if (now - lastPurge < 5 * 60 * 1000) return;
  lastPurge = now;
  for (const [key, b] of ipMinuteBuckets) if (now >= b.resetAt) ipMinuteBuckets.delete(key);
  for (const [key, b] of ipDayBuckets) if (now >= b.resetAt) ipDayBuckets.delete(key);
}

function extractPlanFromAuthHeader(request: NextRequest): 'free' | 'pro' | 'growth' | 'public' {
  // We can't easily query the DB in middleware (edge runtime), so we use the
  // x-agentpick-plan header that our API routes can set on the way back.
  // For incoming requests, default to 'public' (unauthenticated).
  // Key-authenticated requests are bucketed by IP and get the 'public' bucket
  // unless overridden by a plan hint (future).
  const authHeader = request.headers.get('authorization');
  // X-AgentPick-Plan is set on responses; for incoming requests we can't query DB in edge middleware.
  // Use 'free' as a conservative default for keyed requests so they get relaxed per-IP limits
  // vs completely unauthenticated 'public' traffic. Pro/growth limits are enforced by Upstash per-agent-ID.
  if (authHeader?.startsWith('Bearer ah_')) return 'free';
  return 'public';
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');

  maybePurgeBuckets();

  // --- CORS for API routes ---
  if (isApi) {
    // Preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // --- Rate limiting for router endpoints ---
    const isRouterApi = pathname.startsWith('/api/v1/router/') || pathname.startsWith('/api/v1/route/');
    if (isRouterApi) {
      const ip = getIp(request);
      const plan = extractPlanFromAuthHeader(request);
      const limits = RATE_LIMITS[plan];

      const allowedMin = checkBucket(ipMinuteBuckets, `${ip}:min`, limits.perMin, 60_000);
      const allowedDay = checkBucket(ipDayBuckets, `${ip}:day`, limits.perDay, 24 * 60 * 60_000);

      if (!allowedMin || !allowedDay) {
        const retryAfter = allowedMin ? 86400 : 60;
        return new NextResponse(
          JSON.stringify({
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: allowedMin
                ? 'Daily rate limit exceeded. Try again tomorrow.'
                : 'Minute rate limit exceeded. Slow down.',
            },
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(allowedMin ? limits.perDay : limits.perMin),
              'X-RateLimit-Remaining': '0',
            },
          },
        );
      }
    }

    const response = NextResponse.next();
    // CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('Content-Security-Policy', "default-src 'none'; frame-src 'self' https://js.stripe.com https://checkout.stripe.com; frame-ancestors 'none'");

    // Standard API headers
    const requestId = generateRequestId();
    response.headers.set('x-request-id', requestId);

    // API responses must not be publicly cached — most are auth-gated and user-specific
    response.headers.set('Cache-Control', 'no-store');

    return response;
  }

  // --- Content negotiation: JSON responses for Accept: application/json ---
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('application/json') && !accept.includes('text/html')) {
    // /products/[slug] → rewrite to /api/v1/products/[slug]/card
    const productMatch = pathname.match(/^\/products\/([^/]+)$/);
    if (productMatch) {
      return NextResponse.rewrite(new URL(`/api/v1/products/${productMatch[1]}/card`, request.url));
    }
    // /rankings/[slug] → rewrite to /api/v1/products with category filter
    const rankingMatch = pathname.match(/^\/rankings\/([^/]+)$/);
    if (rankingMatch) {
      return NextResponse.rewrite(new URL(`/api/v1/products?limit=20&sort=score`, request.url));
    }
  }

  // --- Agent-friendly headers for page routes ---
  const response = NextResponse.next();
  const ua = (request.headers.get('user-agent') ?? '').toLowerCase();

  // Security headers for page routes
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https://js.stripe.com https://checkout.stripe.com; frame-ancestors 'none'");

  response.headers.append('Link', '</api/v1/products>; rel="api"');
  response.headers.append('Link', '</.well-known/agentpick.json>; rel="agent-directory"');
  response.headers.set('X-AgentPick-API', 'https://agentpick.dev/api/v1');

  const isAgent = AGENT_UA_PATTERNS.some((p) => ua.includes(p));
  if (isAgent) {
    response.headers.set('X-AgentPick-Hint', 'Use /api/v1/ for structured data. MCP server at /mcp');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
