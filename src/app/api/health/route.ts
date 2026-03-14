import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const startTime = Date.now();

export async function GET(_request: NextRequest) {
  const checks: Record<string, unknown> = {};
  let overallStatus = 'ok';

  // DB check
  try {
    await (prisma as any).$queryRaw`SELECT 1`;
    checks.db = { status: 'ok' };
  } catch (err) {
    checks.db = { status: 'error', message: err instanceof Error ? err.message : 'unknown' };
    overallStatus = 'degraded';
  }

  // Memory
  const mem = process.memoryUsage();
  checks.memory = {
    rss_mb: Math.round(mem.rss / 1024 / 1024),
    heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
    heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
  };

  // Uptime
  checks.uptime_s = Math.round(process.uptime());

  // Version / commit
  checks.version = process.env.npm_package_version ?? '0.0.0';
  checks.commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
    ?? process.env.GIT_COMMIT?.slice(0, 7)
    ?? 'local';

  const status = overallStatus === 'ok' ? 200 : 503;

  return Response.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status },
  );
}
