import type { ToolCallResult } from './types';

export async function callCohereEmbed(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.COHERE_API_KEY?.trim();
  if (!apiKey) throw new Error('COHERE_API_KEY not set');

  const model = (config?.model as string) || 'embed-english-v3.0';
  const texts = (config?.texts as string[]) || [query];
  const inputType = (config?.inputType as string) || 'search_query';

  const start = performance.now();
  const response = await fetch('https://api.cohere.com/v1/embed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      texts,
      input_type: inputType,
      truncate: 'END',
    }),
    signal: AbortSignal.timeout(30000),
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();

  if (!response.ok) {
    console.error('[Cohere Embed] API error:', {
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
    });
  }

  const embeddings = (data as any)?.embeddings ?? [];
  const tokens = (data as any)?.meta?.billed_units?.input_tokens ?? 0;

  return {
    statusCode: response.status,
    latencyMs,
    resultCount: embeddings.length,
    response: { dimensions: embeddings[0]?.length ?? 0, tokens, count: embeddings.length },
    costUsd: (tokens / 1000000) * 0.1, // ~$0.1 per 1M tokens
  };
}
