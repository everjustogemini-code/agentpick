import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

    // Cache headers for GET requests
    if (request.method === 'GET') {
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }

    return response;
  }

  // --- Agent-friendly headers for page routes ---
  const response = NextResponse.next();
  const ua = (request.headers.get('user-agent') ?? '').toLowerCase();

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
