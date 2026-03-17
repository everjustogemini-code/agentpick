import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticateAgent: vi.fn(),
  routeRequest: vi.fn(),
  checkRateLimit: vi.fn(),
  ensureDeveloperAccount: vi.fn(),
  checkUsageLimit: vi.fn(),
  recordRouterCall: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authenticateAgent: mocks.authenticateAgent,
}));

vi.mock('@/lib/router/index', () => ({
  routeRequest: mocks.routeRequest,
  CAPABILITY_TOOLS: {
    search: ['exa-search', 'tavily', 'brave-search'],
    finance: ['polygon-io'],
  },
  getRankedToolsForCapability: vi.fn().mockReturnValue(['tavily']),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mocks.checkRateLimit,
  routerSdkLimiter: {},
}));

vi.mock('@/lib/router/sdk', () => ({
  ensureDeveloperAccount: mocks.ensureDeveloperAccount,
  checkUsageLimit: mocks.checkUsageLimit,
  recordRouterCall: mocks.recordRouterCall,
}));

import { POST } from '@/app/v1/chat/completions/route';

function makeRequest(body: unknown, apiKey = 'ah_live_sk_testkey') {
  return new Request('https://agentpick.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /v1/chat/completions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.authenticateAgent.mockResolvedValue({ id: 'agent-test-123' });
    mocks.checkRateLimit.mockResolvedValue({ limited: false, retryAfter: 0 });
    mocks.ensureDeveloperAccount.mockResolvedValue({
      id: 'dev-123',
      plan: 'FREE',
      billingCycleStart: new Date(),
      monthlyBudgetUsd: 0,
      spentThisMonth: 0,
      byokKeys: null,
      excludedTools: [],
      latencyBudgetMs: null,
      maxFallbacks: null,
      strategy: 'BALANCED',
      priorityTools: [],
    });
    mocks.checkUsageLimit.mockResolvedValue({
      allowed: true,
      isOverage: false,
      hardCapped: false,
      limit: 500,
      used: 10,
      monthlyLimit: 500,
      monthlyUsed: 10,
    });
    mocks.recordRouterCall.mockResolvedValue(undefined);
    mocks.routeRequest.mockResolvedValue({
      response: {
        data: {
          results: [
            { title: 'AAPL Stock Price', url: 'https://example.com', snippet: 'Apple Inc. is trading at $180.' },
          ],
        },
        meta: {
          tool_used: 'tavily',
          latency_ms: 150,
          fallback_used: false,
          trace_id: 'trace_test_1',
          cost_usd: 0.001,
          result_count: 1,
          byok_used: false,
        },
      },
    });
  });

  it('stream:false returns valid OpenAI response shape', async () => {
    const response = await POST(
      makeRequest({
        model: 'agentpick/auto',
        messages: [{ role: 'user', content: 'What is the AAPL stock price?' }],
        stream: false,
      }),
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.id).toMatch(/^chatcmpl-/);
    expect(body.object).toBe('chat.completion');
    expect(body.choices[0].message.role).toBe('assistant');
    expect(typeof body.choices[0].message.content).toBe('string');
    expect(body.usage.total_tokens).toBeGreaterThan(0);
  });

  it('stream:true returns text/event-stream', async () => {
    const response = await POST(
      makeRequest({
        model: 'agentpick/search',
        messages: [{ role: 'user', content: 'Latest AI news' }],
        stream: true,
      }),
    );

    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const text = await response.text();
    expect(text).toContain('data: ');
    expect(text).toContain('data: [DONE]');
  });

  it('invalid API key returns 401', async () => {
    mocks.authenticateAgent.mockResolvedValue(null);

    const response = await POST(
      makeRequest(
        {
          model: 'agentpick/auto',
          messages: [{ role: 'user', content: 'test' }],
        },
        'invalid-key-xyz',
      ),
    );

    expect(response.status).toBe(401);
  });
});
