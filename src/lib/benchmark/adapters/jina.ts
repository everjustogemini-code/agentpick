import type { ToolCallResult } from './types';

export async function callJina(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error('JINA_API_KEY not set');

  const start = performance.now();
  const response = await fetch('https://s.jina.ai/' + encodeURIComponent(query), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-Return-Format': 'text',
    },
    signal: AbortSignal.timeout(30000),
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
