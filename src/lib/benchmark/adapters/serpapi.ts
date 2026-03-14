import type { ToolCallResult } from './types';

export async function callSerpApi(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = (process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY)?.trim();
  if (!apiKey) throw new Error('SERPAPI_KEY not set');

  const engine = (config?.engine as string) || 'google';
  const num = (config?.num as number) || 10;
  const params = new URLSearchParams({
    q: query,
    engine,
    num: String(num),
    api_key: apiKey,
  });

  const start = performance.now();
  const response = await fetch(`https://serpapi.com/search.json?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();

  if (!response.ok) {
    console.error('[SerpAPI] API error:', {
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
    });
  }

  const organic = (data as any)?.organic_results ?? [];
  return {
    statusCode: response.status,
    latencyMs,
    resultCount: organic.length,
    response: data,
    costUsd: 0.01, // ~$0.01 per search
  };
}
