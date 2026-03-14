import type { ToolCallResult } from './types';

export async function callTavily(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) throw new Error('TAVILY_API_KEY not set');

  const requestBody = {
    api_key: apiKey,
    query,
    search_depth: (config?.depth as string) || 'basic',
    max_results: (config?.maxResults as number) || 10,
    include_answer: true,
  };

  const start = performance.now();
  let response: Response;
  try {
    response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(8000),
    });
  } catch (fetchError) {
    console.error('[Tavily] Fetch error:', fetchError);
    throw fetchError;
  }
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();

  if (!response.ok) {
    console.error('[Tavily] API error:', {
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
      query,
      keyPrefix: apiKey.slice(0, 10) + '...',
    });
  }

  return {
    statusCode: response.status,
    latencyMs,
    resultCount: data.results?.length || 0,
    response: data,
    costUsd: 0.001, // ~$0.001 per search on basic
  };
}
