import type { ToolCallResult } from './types';

export async function callBrowserbase(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.BROWSERBASE_API_KEY?.trim();
  const projectId = process.env.BROWSERBASE_PROJECT_ID?.trim();
  if (!apiKey) throw new Error('BROWSERBASE_API_KEY not set');
  if (!projectId) throw new Error('BROWSERBASE_PROJECT_ID not set');

  const url = query.startsWith('http') ? query : `https://${query}`;

  const start = performance.now();

  // Create a session
  const sessionRes = await fetch('https://www.browserbase.com/v1/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bb-api-key': apiKey,
    },
    body: JSON.stringify({
      projectId,
      browserSettings: { blockAds: true },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!sessionRes.ok) {
    const err = await sessionRes.text();
    console.error('[Browserbase] Session create error:', err.slice(0, 500));
    return {
      statusCode: sessionRes.status,
      latencyMs: Math.round(performance.now() - start),
      resultCount: 0,
      response: { error: err.slice(0, 500) },
      costUsd: 0,
    };
  }

  const session = await sessionRes.json();
  const sessionId = (session as any).id;

  // Navigate and extract content via the session
  const extractRes = await fetch(`https://www.browserbase.com/v1/sessions/${sessionId}/browser/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bb-api-key': apiKey,
    },
    body: JSON.stringify({
      url,
      wait: (config?.waitMs as number) || 3000,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const latencyMs = Math.round(performance.now() - start);

  let data: unknown;
  if (extractRes.ok) {
    data = await extractRes.json();
  } else {
    data = { error: (await extractRes.text()).slice(0, 500) };
  }

  // Cleanup session (fire-and-forget)
  fetch(`https://www.browserbase.com/v1/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { 'x-bb-api-key': apiKey },
  }).catch(() => {});

  return {
    statusCode: extractRes.status,
    latencyMs,
    resultCount: extractRes.ok ? 1 : 0,
    response: data,
    costUsd: 0.01, // ~$0.01 per session
  };
}
