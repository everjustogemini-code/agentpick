import type { ToolCallResult } from './types';

export async function callTavily(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY not set');

  const start = performance.now();
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: (config?.depth as string) || 'basic',
      max_results: (config?.maxResults as number) || 10,
      include_answer: true,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();
  return {
    statusCode: response.status,
    latencyMs,
    resultCount: data.results?.length || 0,
    response: data,
    costUsd: 0.001, // ~$0.001 per search on basic
  };
}
