import type { ToolCallResult } from './types';

export async function callFirecrawl(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not set');

  const start = performance.now();
  const response = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      limit: (config?.limit as number) || 5,
      scrapeOptions: { formats: ['markdown'] },
    }),
    signal: AbortSignal.timeout(8000), // Firecrawl can be slow
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();
  return {
    statusCode: response.status,
    latencyMs,
    resultCount: data.data?.length || 0,
    response: data,
    costUsd: 0.003, // ~$0.003 per search+scrape
  };
}
