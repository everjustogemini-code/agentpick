import type { ToolCallResult } from './types';

export async function callBing(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.BING_API_KEY?.trim();
  if (!apiKey) throw new Error('BING_API_KEY not set');

  const count = (config?.count as number) || 10;
  const params = new URLSearchParams({
    q: query,
    count: String(count),
    responseFilter: 'Webpages',
  });

  const start = performance.now();
  const response = await fetch(`https://api.bing.microsoft.com/v7.0/search?${params}`, {
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(30000),
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();

  if (!response.ok) {
    console.error('[Bing] API error:', {
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
    });
  }

  const results = (data as any)?.webPages?.value ?? [];
  return {
    statusCode: response.status,
    latencyMs,
    resultCount: results.length,
    response: data,
    costUsd: 0.005, // ~$5/1000 queries
  };
}
