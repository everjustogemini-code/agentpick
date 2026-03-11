import { createHash, randomBytes } from 'crypto';
import { prisma } from './prisma';

export function hashApiKey(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateApiKey(): string {
  return `ah_live_sk_${randomBytes(32).toString('hex')}`;
}

export async function authenticateAgent(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ah_')) return null;

  const token = authHeader.slice(7);
  const hash = hashApiKey(token);
  const agent = await prisma.agent.findUnique({ where: { apiKeyHash: hash } });

  if (!agent || agent.isRestricted) return null;

  // Fire-and-forget lastActiveAt update
  prisma.agent
    .update({
      where: { id: agent.id },
      data: { lastActiveAt: new Date() },
    })
    .catch(() => {});

  return agent;
}
