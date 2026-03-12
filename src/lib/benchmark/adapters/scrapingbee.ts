import type { ToolCallResult } from './types';

export async function callScrapingBee(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY?.trim();
  if (!apiKey) throw new Error('SCRAPINGBEE_API_KEY not set');

  const url = query.startsWith('http') ? query : `https://${query}`;
  const renderJs = (config?.render_js as boolean) ?? true;

  const params = new URLSearchParams({
    api_key: apiKey,
    url,
    render_js: String(renderJs),
    extract_rules: JSON.stringify({ title: 'title', text: 'body' }),
  });

  const start = performance.now();
  const response = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`, {
    signal: AbortSignal.timeout(45000),
  });
  const latencyMs = Math.round(performance.now() - start);

  let data: unknown;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { html: text.slice(0, 5000) };
  }

  if (!response.ok) {
    console.error('[ScrapingBee] API error:', {
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
    });
  }

  return {
    statusCode: response.status,
    latencyMs,
    resultCount: response.ok ? 1 : 0,
    response: data,
    costUsd: 0.003, // ~$0.003 per JS-rendered scrape
  };
}
