import { PrismaClient } from '@/generated/prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

// Use WebSocket for Neon serverless driver (works in Node.js / Vercel Edge)
// In browser/edge runtimes the native WebSocket is used automatically
if (typeof WebSocket === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require('ws');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Connection string for runtime queries — always use the pooler endpoint (DATABASE_URL).
 *  DIRECT_URL is intentionally left for `prisma db push / migrate` only (set in Vercel env vars).
 */
function getConnectionString(): string {
  const url = process.env.DATABASE_URL!;

  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // For prisma+postgres:// URLs (Prisma local dev), extract the direct TCP URL
  if (url.startsWith('prisma+postgres://')) {
    const apiKey = new URL(url).searchParams.get('api_key');
    if (apiKey) {
      const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString());
      return decoded.databaseUrl as string;
    }
  }

  return url;
}

function createPrismaClient() {
  const connectionString = getConnectionString();
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  const client = createPrismaClient();
  // Cache globally to reuse connections within a serverless instance lifetime
  globalForPrisma.prisma = client;
  return client;
}

// ─── Retry Helper ────────────────────────────────────────────────────────────

const RETRYABLE_CODES = new Set(['P1001', 'P1002', 'P2024']);

function isRetryable(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    return RETRYABLE_CODES.has((err as { code: string }).code);
  }
  // Also retry on raw connection-refused / ECONNREFUSED errors
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('ECONNREFUSED') || msg.includes('connection timeout');
}

export async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || i === attempts - 1) throw err;
      const backoff = 200 * Math.pow(2, i); // 200 / 400 / 800 ms
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

// ─── Exported client proxy ───────────────────────────────────────────────────

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
