import { createHash, randomBytes } from 'crypto';
import { prisma, withRetry } from './prisma';

export function hashApiKey(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateApiKey(): string {
  return `ah_live_sk_${randomBytes(32).toString('hex')}`;
}

export async function authenticateAgent(request: Request) {
  // Support Bearer header or ?token= query param (for GET-only runtimes like ChatGPT Actions)
  let token: string | null = null;
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // RFC 6750: Bearer scheme is case-insensitive; extract token after "Bearer "
    const lower = authHeader.toLowerCase();
    if (lower.startsWith('bearer ')) {
      const candidate = authHeader.slice(7);
      if (candidate.startsWith('ah_')) token = candidate;
    }
  }
  if (!token) {
    const url = new URL(request.url);
    const qToken = url.searchParams.get('token');
    if (qToken?.startsWith('ah_')) token = qToken;
  }
  if (!token) return null;
  const hash = hashApiKey(token);
  const agent = await prisma.agent.findUnique({ where: { apiKeyHash: hash } });

  if (!agent || agent.isRestricted) return null;

  // Fire-and-forget lastActiveAt update.
  // Use withRetry (1 attempt, no retries) so any connection failure clears the Prisma
  // singleton. Without this, a raw prisma.agent.update failure leaves the singleton in
  // a broken state, which the next withRetry call must recover from with an extra retry.
  withRetry(() => prisma.agent.update({
    where: { id: agent.id },
    data: { lastActiveAt: new Date() },
  }), 1).catch(() => {});

  return agent;
}
