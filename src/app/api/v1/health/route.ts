import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  const checks: Record<string, unknown> = {};
  let overallStatus = 'ok';

  try {
    const t0 = Date.now();
    await (prisma as any).$queryRaw`SELECT 1`;
    const latency = Date.now() - t0;
    checks.db = { status: 'ok', latency_ms: latency };
  } catch (err) {
    checks.db = {
      status: 'error',
      message: err instanceof Error ? err.message : 'unknown',
    };
    overallStatus = 'degraded';
  }

  const mem = process.memoryUsage();
  checks.memory = {
    rss_mb: Math.round(mem.rss / 1024 / 1024),
    heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
  };
  checks.uptime_s = Math.round(process.uptime());
  checks.commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local';

  return Response.json(
    { status: overallStatus, timestamp: new Date().toISOString(), checks },
    { status: overallStatus === 'ok' ? 200 : 503 },
  );
}
