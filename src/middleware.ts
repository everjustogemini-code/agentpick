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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');

  // --- CORS for API routes ---
  if (isApi) {
    // Preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Standard API headers
    const requestId = generateRequestId();
    response.headers.set('x-request-id', requestId);
    response.headers.set('x-ratelimit-limit', '1000');
    response.headers.set('x-ratelimit-remaining', '999');
    response.headers.set('x-ratelimit-reset', String(Math.ceil(Date.now() / 1000) + 3600));

    // Cache headers for GET requests
    if (request.method === 'GET') {
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }

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
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

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
