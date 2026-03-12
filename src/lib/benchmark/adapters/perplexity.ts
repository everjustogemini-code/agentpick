import type { ToolCallResult } from './types';

export async function callPerplexity(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY?.trim();
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY not set');

  const model = (config?.model as string) || 'sonar';

  const start = performance.now();
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: query }],
      max_tokens: 512,
      return_citations: true,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();

  if (!response.ok) {
    console.error('[Perplexity] API error:', {
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
    });
  }

  const citations = (data as any)?.citations ?? [];
  return {
    statusCode: response.status,
    latencyMs,
    resultCount: citations.length || (response.ok ? 1 : 0),
    response: data,
    costUsd: 0.005, // ~$0.005 per sonar query
  };
}
