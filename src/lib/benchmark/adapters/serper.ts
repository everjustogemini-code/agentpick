import type { ToolCallResult } from './types';

export async function callSerper(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.SERPER_API_KEY?.trim();
  if (!apiKey) throw new Error('SERPER_API_KEY not set');

  const start = performance.now();
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      q: query,
      num: (config?.num as number) || 10,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();
  const resultCount = (data.organic?.length || 0) + (data.knowledgeGraph ? 1 : 0);
  return {
    statusCode: response.status,
    latencyMs,
    resultCount,
    response: data,
    costUsd: 0.0005, // ~$0.0005 per search
  };
}
