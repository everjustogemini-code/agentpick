import type { ToolCallResult } from './types';

export async function callFirecrawl(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not set');

  const start = performance.now();
  // Use /v1/scrape for URL inputs (crawl capability) and /v1/search for text queries.
  const isUrl = query.startsWith('http://') || query.startsWith('https://');
  const fetchResponse = isUrl
    ? await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ url: query, formats: ['markdown'] }),
        signal: AbortSignal.timeout(8000),
      })
    : await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ query, limit: (config?.limit as number) || 5, scrapeOptions: { formats: ['markdown'] } }),
        signal: AbortSignal.timeout(8000),
      });
  const latencyMs = Math.round(performance.now() - start);

  const data = await fetchResponse.json();
  return {
    statusCode: fetchResponse.status,
    latencyMs,
    resultCount: isUrl ? (data.data ? 1 : 0) : (data.data?.length || 0),
    response: data,
    costUsd: 0.003, // ~$0.003 per search+scrape
  };
}
