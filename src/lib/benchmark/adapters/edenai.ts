import type { ToolCallResult } from './types';

const EDENAI_BASE = 'https://api.edenai.run/v2';

async function callEdenAI(
  feature: string,
  subfeature: string,
  payload: Record<string, unknown>,
  start: number,
  costPerCall: number,
): Promise<ToolCallResult> {
  const apiKey = process.env.EDENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('EDENAI_API_KEY not set');

  const response = await fetch(`${EDENAI_BASE}/${feature}/${subfeature}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ ...payload, response_as_dict: true, show_original_response: false }),
    signal: AbortSignal.timeout(30000),
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('[EdenAI] API error:', {
      feature,
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
    });
    return {
      statusCode: response.status,
      latencyMs,
      resultCount: 0,
      response: { error: (data as any)?.detail ?? response.statusText },
      costUsd: 0,
    };
  }

  return {
    statusCode: 200,
    latencyMs,
    resultCount: 1,
    response: data,
    costUsd: costPerCall,
  };
}

/**
 * Eden AI Embedding adapter.
 * Uses Eden AI as a fallback for the "embed" capability.
 */
export async function callEdenAIEmbed(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const texts = (config?.texts as string[]) ?? [query];
  const providers = (config?.providers as string[]) ?? ['openai'];
  const start = performance.now();
  return callEdenAI(
    'text',
    'embeddings',
    { texts, providers },
    start,
    0.0001,
  );
}

/**
 * Eden AI Translation adapter.
 * Translates text between languages.
 */
export async function callEdenAITranslation(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const text = (config?.text as string) ?? query;
  const sourceLang = (config?.source_language as string) ?? 'en';
  const targetLang = (config?.target_language as string) ?? 'fr';
  const providers = (config?.providers as string[]) ?? ['google'];
  const start = performance.now();
  return callEdenAI(
    'translation',
    'automatic_translation',
    { text, source_language: sourceLang, target_language: targetLang, providers },
    start,
    0.00015,
  );
}

/**
 * Eden AI OCR adapter.
 * Extracts text from images/documents.
 */
export async function callEdenAIOcr(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  // query or config.file_url should be an image URL
  const fileUrl = (config?.file_url as string) ?? (config?.url as string) ?? query;
  const providers = (config?.providers as string[]) ?? ['google'];
  const start = performance.now();
  return callEdenAI(
    'ocr',
    'ocr',
    { file_url: fileUrl, providers },
    start,
    0.001,
  );
}
