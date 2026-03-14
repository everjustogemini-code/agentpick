import type { ToolCallResult } from './types';

export async function callJinaEmbed(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.JINA_API_KEY?.trim();
  if (!apiKey) throw new Error('JINA_API_KEY not set');

  const model = (config?.model as string) || 'jina-embeddings-v3';
  const input = (config?.texts as string[]) || [query];

  const start = performance.now();
  const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input,
      task: 'text-matching',
    }),
    signal: AbortSignal.timeout(8000),
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();

  if (!response.ok) {
    console.error('[Jina Embed] API error:', {
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
    });
  }

  const embeddings = (data as any)?.data ?? [];
  const tokens = (data as any)?.usage?.total_tokens ?? 0;

  return {
    statusCode: response.status,
    latencyMs,
    resultCount: embeddings.length,
    response: { dimensions: embeddings[0]?.embedding?.length ?? 0, tokens, count: embeddings.length },
    costUsd: (tokens / 1000000) * 0.02, // ~$0.02 per 1M tokens
  };
}
