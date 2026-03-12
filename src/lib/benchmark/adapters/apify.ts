import type { ToolCallResult } from './types';

export async function callApify(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.APIFY_API_KEY?.trim();
  if (!apiKey) throw new Error('APIFY_API_KEY not set');

  // query = URL to scrape (for crawling adapters, "query" is typically a URL)
  const url = query.startsWith('http') ? query : `https://${query}`;
  const actorId = (config?.actorId as string) || 'apify~web-scraper';

  const start = performance.now();

  // Start the actor run synchronously (waits for result)
  const response = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: [{ url }],
        maxPagesPerCrawl: 1,
        pageFunction: `async function pageFunction(context) {
          const { page, request } = context;
          const title = await page.title();
          const text = await page.$eval('body', el => el.innerText.slice(0, 5000));
          return { url: request.url, title, text };
        }`,
      }),
      signal: AbortSignal.timeout(60000), // Apify runs can be slow
    },
  );
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();

  if (!response.ok) {
    console.error('[Apify] API error:', {
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
    });
  }

  const items = Array.isArray(data) ? data : [];
  return {
    statusCode: response.status,
    latencyMs,
    resultCount: items.length,
    response: data,
    costUsd: 0.005, // ~$0.005 per simple scrape
  };
}
