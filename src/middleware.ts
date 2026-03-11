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
  const response = NextResponse.next();
  const ua = (request.headers.get('user-agent') ?? '').toLowerCase();

  // Agent-friendly Link headers on all page responses
  response.headers.append('Link', '</api/v1/products>; rel="api"');
  response.headers.append('Link', '</.well-known/agentpick.json>; rel="agent-directory"');
  response.headers.set('X-AgentPick-API', 'https://agentpick.dev/api/v1');

  // Hint header for programmatic clients
  const isAgent = AGENT_UA_PATTERNS.some((p) => ua.includes(p));
  if (isAgent) {
    response.headers.set('X-AgentPick-Hint', 'Use /api/v1/ for structured data. MCP server at /mcp');
  }

  return response;
}

export const config = {
  // Apply to page routes only, skip static files and API routes (they already return JSON)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|mcp|badge/).*)'],
};
