import type { ToolCallResult } from './types';

export async function callYou(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.YOU_API_KEY?.trim();
  if (!apiKey) throw new Error('YOU_API_KEY not set');

  const numResults = (config?.numResults as number) || 10;
  const params = new URLSearchParams({
    query,
    num_web_results: String(numResults),
  });

  const start = performance.now();
  const response = await fetch(`https://api.ydc-index.io/search?${params}`, {
    headers: {
      'X-API-Key': apiKey,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(30000),
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();

  if (!response.ok) {
    console.error('[You.com] API error:', {
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
    });
  }

  const hits = (data as any)?.hits ?? [];
  return {
    statusCode: response.status,
    latencyMs,
    resultCount: hits.length,
    response: data,
    costUsd: 0.001,
  };
}
