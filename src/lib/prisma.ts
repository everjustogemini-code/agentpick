import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaCreatedAt: number | undefined;
};

function getConnectionString(): string {
  // Prefer DIRECT_URL for the pg adapter (bypasses pgbouncer which doesn't support prepared statements)
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL!;

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
  const adapter = new PrismaPg({ connectionString: getConnectionString() });
  return new PrismaClient({ adapter });
}

// In dev, recreate the client every 5 minutes to avoid stale connections
const MAX_AGE_MS = 5 * 60 * 1000;

function getPrismaClient(): PrismaClient {
  const now = Date.now();
  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaCreatedAt &&
    now - globalForPrisma.prismaCreatedAt < MAX_AGE_MS
  ) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaCreatedAt = now;
  }
  return client;
}

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
