import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    routerCall: {
      count: vi.fn(),
    },
  },
  // withRetry is used by sdk.ts — pass the fn through directly
  withRetry: (fn: () => unknown) => fn(),
}));

import { prisma } from '@/lib/prisma';
import { checkUsageLimit } from '@/lib/router/sdk';

const mockCount = prisma.routerCall.count as ReturnType<typeof vi.fn>;

describe('Rate limit 429 path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test_rate_limit_429 — returns allowed:false + hardCapped:true when monthCount equals monthlyLimit', async () => {
    // Free plan monthly limit = 500; seed at limit (501st call scenario)
    mockCount
      .mockResolvedValueOnce(0)   // todayCount
      .mockResolvedValueOnce(500); // monthCount = at monthly limit

    const result = await checkUsageLimit('dev-test-id', 'FREE');

    expect(result.allowed).toBe(false);
    expect(result.hardCapped).toBe(true);
    expect(result.remaining).toBe(0);
    expect(result.monthlyUsed).toBe(500);
    expect(result.monthlyLimit).toBe(500);
  });

  it('allows call when monthCount is one below monthly limit', async () => {
    mockCount
      .mockResolvedValueOnce(0)   // todayCount
      .mockResolvedValueOnce(499); // monthCount = one below limit

    const result = await checkUsageLimit('dev-test-id', 'FREE');

    expect(result.hardCapped).toBe(false);
    expect(result.monthlyUsed).toBe(499);
  });
});

// ---------------------------------------------------------------------------
// HTTP-layer assertions: test handleRouteRequest produces correct 429 shape
// ---------------------------------------------------------------------------

const MOCK_ACCOUNT = {
  id: 'dev-test-id',
  plan: 'FREE',
  strategy: null,
  byokKeys: {},
  excludedTools: [],
  latencyBudgetMs: null,
  maxFallbacks: null,
  monthlyBudgetUsd: 0,
  spentThisMonth: 0,
  priorityTools: [],
  billingCycleStart: null,
};

const MOCK_ROUTE_RESPONSE = {
  response: {
    data: { results: [] },
    meta: {
      tool_used: 'serper',
      latency_ms: 50,
      fallback_used: false,
      trace_id: 'trace-test',
      cost_usd: 0,
      result_count: 0,
      byok_used: false,
    },
  },
  headers: {},
};

describe('Rate limit 429 — HTTP layer (handleRouteRequest)', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('HTTP 200 — 499 monthly calls (500th call, below limit)', async () => {
    vi.doMock('@/lib/auth', () => ({
      authenticateAgent: vi.fn().mockResolvedValue({ id: 'agent-test-id' }),
    }));
    vi.doMock('@/lib/rate-limit', () => ({
      checkRateLimit: vi.fn().mockResolvedValue({ limited: false, retryAfter: 0 }),
      routerSdkLimiter: {},
    }));
    vi.doMock('@/lib/router/sdk', () => ({
      checkUsageLimit: vi.fn().mockResolvedValue({
        allowed: true,
        hardCapped: false,
        remaining: 1,
        used: 499,
        monthlyUsed: 499,
        monthlyLimit: 500,
        isOverage: false,
      }),
      ensureDeveloperAccount: vi.fn().mockResolvedValue(MOCK_ACCOUNT),
      recordRouterCall: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('@/lib/router/index', () => ({
      routeRequest: vi.fn().mockResolvedValue(MOCK_ROUTE_RESPONSE),
      CAPABILITY_TOOLS: { search: ['serper'] },
      getRankedToolsForCapability: vi.fn().mockReturnValue(['serper']),
    }));
    vi.doMock('@/lib/sanitize', () => ({ escapeHtml: (s: string) => s }));

    const { handleRouteRequest } = await import('@/lib/router/handler');
    const req = new Request('http://localhost/api/v1/route/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ah_test' },
      body: JSON.stringify({ params: { query: 'test query' } }),
    });

    const response = await handleRouteRequest(req as unknown as import('next/server').NextRequest, 'search');
    expect(response.status).toBe(200);
  });

  it('HTTP 429 — 500 monthly calls (501st call, at limit)', async () => {
    vi.doMock('@/lib/auth', () => ({
      authenticateAgent: vi.fn().mockResolvedValue({ id: 'agent-test-id' }),
    }));
    vi.doMock('@/lib/rate-limit', () => ({
      checkRateLimit: vi.fn().mockResolvedValue({ limited: false, retryAfter: 0 }),
      routerSdkLimiter: {},
    }));
    vi.doMock('@/lib/router/sdk', () => ({
      checkUsageLimit: vi.fn().mockResolvedValue({
        allowed: false,
        hardCapped: true,
        remaining: 0,
        used: 500,
        monthlyUsed: 500,
        monthlyLimit: 500,
        limit: 500,
        isOverage: false,
      }),
      ensureDeveloperAccount: vi.fn().mockResolvedValue(MOCK_ACCOUNT),
      recordRouterCall: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('@/lib/router/index', () => ({
      routeRequest: vi.fn(),
      CAPABILITY_TOOLS: { search: ['serper'] },
      getRankedToolsForCapability: vi.fn().mockReturnValue(['serper']),
    }));
    vi.doMock('@/lib/sanitize', () => ({ escapeHtml: (s: string) => s }));

    const { handleRouteRequest } = await import('@/lib/router/handler');
    const req = new Request('http://localhost/api/v1/route/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ah_test' },
      body: JSON.stringify({ params: { query: 'test query' } }),
    });

    const response = await handleRouteRequest(req as unknown as import('next/server').NextRequest, 'search');
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error.code).toBe('USAGE_LIMIT');
    const retryAfter = response.headers.get('Retry-After');
    expect(retryAfter).not.toBeNull();
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });
});
