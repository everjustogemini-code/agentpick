import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  hashApiKey: vi.fn(),
  upsert: vi.fn(),
  routeRequest: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  hashApiKey: mocks.hashApiKey,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agent: {
      upsert: mocks.upsert,
    },
  },
}));

vi.mock('@/lib/router', () => ({
  routeRequest: mocks.routeRequest,
}));

import { POST, __resetPlaygroundRateLimit } from '@/app/api/v1/playground/route/route';

function createRequest(body: unknown, ip = '203.0.113.10') {
  return new Request('https://agentpick.dev/api/v1/playground/route', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  }) as Parameters<typeof POST>[0];
}

describe('playground route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetPlaygroundRateLimit();
    mocks.hashApiKey.mockReturnValue('hash_playground');
    mocks.upsert.mockResolvedValue({ id: 'agent_playground' });
  });

  it('returns capped normalized search results', async () => {
    mocks.routeRequest.mockResolvedValue({
      response: {
        data: {
          results: [
            {
              title: 'First result',
              url: 'https://example.com/one',
              snippet: 'Top match',
            },
            {
              title: 'Second result',
              link: 'https://example.com/two',
              description: 'Another match',
            },
            {
              title: 'Third result',
              content: 'Third preview',
            },
            {
              title: 'Fourth result',
              summary: 'Should be capped out',
            },
          ],
        },
        meta: {
          tool_used: 'tavily',
          latency_ms: 182,
          trace_id: 'trace_search_1',
          ai_classification: {
            type: 'news',
            domain: 'tech',
            depth: 'shallow',
            freshness: 'recent',
            reasoning: 'News query + tech -> tavily',
          },
        },
      },
    });

    const response = await POST(
      createRequest({
        capability: 'search',
        query: 'recent funding rounds for AI agents',
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');

    const json = await response.json();
    expect(json).toMatchObject({
      capability: 'search',
      tool: 'tavily',
      latencyMs: 182,
      traceId: 'trace_search_1',
      totalResults: 4,
      capped: true,
      reasoning: 'News query + tech -> tavily',
    });
    expect(json.results).toHaveLength(3);
    expect(json.results[0]).toMatchObject({
      title: 'First result',
      url: 'https://example.com/one',
      snippet: 'Top match',
    });
  });

  it('summarizes embed responses into a preview card', async () => {
    mocks.routeRequest.mockResolvedValue({
      response: {
        data: {
          count: 2,
          dimensions: 1536,
          tokens: 128,
        },
        meta: {
          tool_used: 'openai-embed',
          latency_ms: 95,
          trace_id: 'trace_embed_1',
        },
      },
    });

    const response = await POST(
      createRequest({
        capability: 'embed',
        query: 'AgentPick routes search, crawl, and embeddings through one API.',
      }, '198.51.100.4'),
    );

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toMatchObject({
      capability: 'embed',
      tool: 'openai-embed',
      latencyMs: 95,
      traceId: 'trace_embed_1',
      totalResults: 1,
      capped: false,
    });
    expect(json.results).toEqual([
      {
        title: 'Embedding computed',
        snippet: 'Vector preview generated for the submitted text.',
        meta: ['2 vectors', '1536 dimensions', '128 tokens'],
      },
    ]);
  });

  it('rate limits each IP after five requests per minute', async () => {
    mocks.routeRequest.mockResolvedValue({
      response: {
        data: {
          answer: 'ok',
        },
        meta: {
          tool_used: 'tavily',
          latency_ms: 20,
          trace_id: 'trace_rate_limit',
        },
      },
    });

    for (let index = 0; index < 5; index += 1) {
      const response = await POST(
        createRequest(
          {
            capability: 'search',
            query: `query ${index}`,
          },
          '192.0.2.44',
        ),
      );

      expect(response.status).toBe(200);
    }

    const limited = await POST(
      createRequest(
        {
          capability: 'search',
          query: 'query 5',
        },
        '192.0.2.44',
      ),
    );

    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBeTruthy();

    const json = await limited.json();
    expect(json.error).toContain('Rate limit exceeded');
    expect(mocks.routeRequest).toHaveBeenCalledTimes(5);
  });

  it('returns a stable 502 payload when routing fails unexpectedly', async () => {
    mocks.routeRequest.mockRejectedValue(new Error('upstream exploded'));

    const response = await POST(
      createRequest(
        {
          capability: 'crawl',
          query: 'agentpick.dev',
        },
        '192.0.2.88',
      ),
    );

    expect(response.status).toBe(502);

    const json = await response.json();
    expect(json).toMatchObject({
      capability: 'crawl',
      tool: null,
      latencyMs: 0,
      results: [],
      error: 'upstream exploded',
    });
    expect(json.traceId).toMatch(/^trace_playground_/);
  });
});
