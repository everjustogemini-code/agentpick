import type { ToolCallResult } from './types';

/**
 * Resend email adapter.
 * Sends a transactional email via the Resend API.
 * Expects config.to, config.from, config.subject; uses query as the email body/text.
 */
export async function callResend(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const to = (config?.to as string) ?? 'test@example.com';
  const from = (config?.from as string) ?? 'AgentPick <noreply@agentpick.dev>';
  const subject = (config?.subject as string) ?? 'Message from AgentPick Agent';
  const html = (config?.html as string) ?? undefined;
  const text = (config?.text as string) ?? query;

  const body: Record<string, unknown> = { from, to, subject, text };
  if (html) body.html = html;

  const start = performance.now();
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('[Resend] API error:', {
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
    });
    return {
      statusCode: response.status,
      latencyMs,
      resultCount: 0,
      response: { error: (data as any)?.message ?? response.statusText },
      costUsd: 0,
    };
  }

  const emailId: string = (data as any)?.id ?? '';

  return {
    statusCode: response.status,
    latencyMs,
    resultCount: emailId ? 1 : 0,
    response: { id: emailId, to, subject },
    costUsd: 0.0, // Resend free tier covers 3000 emails/mo
  };
}
