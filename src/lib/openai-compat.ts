import { randomBytes } from 'crypto';

// Types
export interface ParsedOpenAIRequest {
  query: string;       // extracted from messages[-1].content
  domain: string;      // inferred or pinned from model string
  capability: string;  // e.g. "search", "finance", "auto"
  stream: boolean;
  model: string;       // original model field, e.g. "agentpick/auto"
}

export interface OpenAIChatCompletion {
  id: string;                  // "chatcmpl-" + random
  object: 'chat.completion';
  created: number;             // Unix seconds
  model: string;
  choices: Array<{
    index: number;
    message: { role: 'assistant'; content: string };
    finish_reason: 'stop';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  'x-agentpick-tool': string;
  'x-agentpick-latency-ms': number;
}

export interface OpenAIChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: { content?: string; role?: 'assistant' };
    finish_reason: 'stop' | null;
  }>;
}

/**
 * Parse an incoming OpenAI-format request body.
 * Extracts the last user message as query.
 * Derives capability from model: "agentpick/search" → "search", "agentpick/auto" → "auto".
 */
export function parseOpenAIRequest(body: unknown): ParsedOpenAIRequest {
  const b = body as Record<string, unknown>;
  const messages = Array.isArray(b.messages) ? b.messages : [];
  const lastUserMsg = [...messages].reverse().find(
    (m: unknown) => (m as Record<string, unknown>).role === 'user'
  );
  const query = typeof (lastUserMsg as Record<string, unknown>)?.content === 'string'
    ? (lastUserMsg as Record<string, unknown>).content as string
    : '';

  const model = typeof b.model === 'string' ? b.model : 'agentpick/auto';
  // Extract capability from "agentpick/<capability>" pattern
  const capabilityMatch = model.match(/^agentpick\/(.+)$/);
  const capability = capabilityMatch ? capabilityMatch[1] : 'auto';

  // Domain is the same as capability for routing purposes
  const domain = capability;

  const stream = b.stream === true;

  return { query, domain, capability, stream, model };
}

/**
 * Shape a router result into an OpenAI chat.completions response object.
 */
export function shapeOpenAIResponse(opts: {
  content: string;
  tool: string;
  latencyMs: number;
  model: string;
}): OpenAIChatCompletion {
  const { content, tool, latencyMs, model } = opts;
  const id = `chatcmpl-${randomBytes(12).toString('hex')}`;
  const prompt_tokens = Math.ceil(0); // query length unknown here, callers can override
  const completion_tokens = Math.ceil(content.length / 4);
  const total_tokens = prompt_tokens + completion_tokens;

  return {
    id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content },
        finish_reason: 'stop',
      },
    ],
    usage: { prompt_tokens, completion_tokens, total_tokens },
    'x-agentpick-tool': tool,
    'x-agentpick-latency-ms': latencyMs,
  };
}

/**
 * Shape a router result into an OpenAI chat.completions response object with query for token counting.
 */
export function shapeOpenAIResponseWithQuery(opts: {
  content: string;
  tool: string;
  latencyMs: number;
  model: string;
  query: string;
}): OpenAIChatCompletion {
  const { content, tool, latencyMs, model, query } = opts;
  const id = `chatcmpl-${randomBytes(12).toString('hex')}`;
  const prompt_tokens = Math.ceil(query.length / 4);
  const completion_tokens = Math.ceil(content.length / 4);
  const total_tokens = prompt_tokens + completion_tokens;

  return {
    id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content },
        finish_reason: 'stop',
      },
    ],
    usage: { prompt_tokens, completion_tokens, total_tokens },
    'x-agentpick-tool': tool,
    'x-agentpick-latency-ms': latencyMs,
  };
}

/**
 * Yield SSE lines for a streaming response.
 * Format: "data: <JSON>\n\n" for each chunk, then "data: [DONE]\n\n".
 * Splits content into ~10-word chunks to simulate streaming.
 */
export async function* streamOpenAIChunks(opts: {
  content: string;
  tool: string;
  model: string;
}): AsyncGenerator<string> {
  const { content, model } = opts;
  const id = `chatcmpl-${randomBytes(12).toString('hex')}`;
  const created = Math.floor(Date.now() / 1000);

  // First chunk: role delta
  const roleChunk: OpenAIChatCompletionChunk = {
    id,
    object: 'chat.completion.chunk',
    created,
    model,
    choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
  };
  yield `data: ${JSON.stringify(roleChunk)}\n\n`;

  // Split content into ~10-word chunks
  const words = content.split(' ');
  const chunkSize = 10;
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkWords = words.slice(i, i + chunkSize);
    const chunkContent = (i === 0 ? '' : ' ') + chunkWords.join(' ');
    const chunk: OpenAIChatCompletionChunk = {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta: { content: chunkContent }, finish_reason: null }],
    };
    yield `data: ${JSON.stringify(chunk)}\n\n`;
  }

  // Final chunk with finish_reason
  const finalChunk: OpenAIChatCompletionChunk = {
    id,
    object: 'chat.completion.chunk',
    created,
    model,
    choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
  };
  yield `data: ${JSON.stringify(finalChunk)}\n\n`;

  yield 'data: [DONE]\n\n';
}
