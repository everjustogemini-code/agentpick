import type { ToolCallResult } from './types';

export async function callExa(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.EXA_API_KEY?.trim();
  if (!apiKey) throw new Error('EXA_API_KEY not set');

  const start = performance.now();
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      query,
      type: (config?.type as string) || 'neural',
      numResults: (config?.numResults as number) || 10,
      useAutoprompt: true,
      contents: { text: { maxCharacters: 1000 } },
    }),
    signal: AbortSignal.timeout(8000),
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();
  return {
    statusCode: response.status,
    latencyMs,
    resultCount: data.results?.length || 0,
    response: data,
    costUsd: 0.002, // ~$0.002 per neural search with contents
  };
}
