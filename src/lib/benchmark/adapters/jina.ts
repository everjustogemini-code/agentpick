import type { ToolCallResult } from './types';

export async function callJina(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.JINA_API_KEY?.trim();
  if (!apiKey) throw new Error('JINA_API_KEY not set');

  const start = performance.now();
  // Use Jina Reader (r.jina.ai) for URL inputs (crawl capability) and
  // Jina Search (s.jina.ai) for text queries (search capability).
  const isUrl = query.startsWith('http://') || query.startsWith('https://');
  const jinaUrl = isUrl
    ? 'https://r.jina.ai/' + query
    : 'https://s.jina.ai/' + encodeURIComponent(query);
  const response = await fetch(jinaUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-Return-Format': 'text',
    },
    signal: AbortSignal.timeout(8000),
  });
  const latencyMs = Math.round(performance.now() - start);

  let data: unknown;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { text: text.slice(0, 2000) };
  }

  const resultCount = Array.isArray(data) ? data.length : 1;
  return {
    statusCode: response.status,
    latencyMs,
    resultCount,
    response: data,
    costUsd: 0, // Free tier
  };
}
