import type { ToolCallResult } from './types';

/**
 * E2B Code Execution adapter.
 * Executes code snippets in an E2B sandbox and returns stdout/stderr.
 * Uses the REST API directly to avoid adding a heavy SDK dependency.
 */
export async function callE2B(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.E2B_API_KEY?.trim();
  if (!apiKey) throw new Error('E2B_API_KEY not set');

  // `query` is the code to execute; language defaults to python
  const code = (config?.code as string) ?? query;
  const language = (config?.language as string) ?? 'python';

  const start = performance.now();

  // Step 1: Create a sandbox session
  const sandboxRes = await fetch('https://api.e2b.dev/sandboxes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ template: language === 'python' ? 'Python3' : 'Node' }),
    signal: AbortSignal.timeout(30000),
  });

  if (!sandboxRes.ok) {
    const err = await sandboxRes.json().catch(() => ({ message: sandboxRes.statusText }));
    const latencyMs = Math.round(performance.now() - start);
    return {
      statusCode: sandboxRes.status,
      latencyMs,
      resultCount: 0,
      response: { error: (err as any)?.message ?? sandboxRes.statusText },
      costUsd: 0,
    };
  }

  const sandbox = await sandboxRes.json() as { sandboxID?: string; sandbox_id?: string };
  const sandboxId = sandbox.sandboxID ?? sandbox.sandbox_id;

  try {
    // Step 2: Execute code
    const execRes = await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(30000),
    });

    const latencyMs = Math.round(performance.now() - start);
    const data = await execRes.json().catch(() => ({}));

    if (!execRes.ok) {
      return {
        statusCode: execRes.status,
        latencyMs,
        resultCount: 0,
        response: { error: (data as any)?.message ?? execRes.statusText },
        costUsd: 0,
      };
    }

    const stdout: string = (data as any)?.stdout ?? '';
    const stderr: string = (data as any)?.stderr ?? '';
    const exitCode: number = (data as any)?.exitCode ?? (data as any)?.exit_code ?? 0;

    return {
      statusCode: 200,
      latencyMs,
      resultCount: stdout.length > 0 ? 1 : 0,
      response: { stdout, stderr, exitCode, language },
      costUsd: 0.0001, // ~$0.0001 per execution (estimate)
    };
  } finally {
    // Step 3: Kill sandbox — fire and forget
    fetch(`https://api.e2b.dev/sandboxes/${sandboxId}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': apiKey },
    }).catch(() => {});
  }
}
