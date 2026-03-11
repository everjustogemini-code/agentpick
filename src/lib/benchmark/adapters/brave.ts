import type { ToolCallResult } from './types';

export async function callBrave(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) throw new Error('BRAVE_API_KEY not set');

  const params = new URLSearchParams({
    q: query,
    count: String((config?.count as number) || 10),
  });

  const start = performance.now();
  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
    signal: AbortSignal.timeout(30000),
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();
  return {
    statusCode: response.status,
    latencyMs,
    resultCount: data.web?.results?.length || 0,
    response: data,
    costUsd: 0, // Free tier
  };
}
