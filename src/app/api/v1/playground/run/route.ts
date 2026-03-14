import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { routeRequest } from '@/lib/router/index';
import type { RouterRequest, Strategy } from '@/lib/router/index';
import { authenticateAgent } from '@/lib/auth';

export const maxDuration = 60;

const DEMO_AGENT_ID = 'playground-demo';

const STRATEGY_MAP: Record<string, Strategy> = {
  auto: 'auto',
  fastest: 'most_stable',
  cheapest: 'cheapest',
  best_quality: 'best_performance',
  balanced: 'balanced',
};

export async function POST(request: NextRequest) {
  const demoKey = process.env.PLAYGROUND_DEMO_KEY ?? 'DEMO_KEY';

  // Check Authorization header
  const authHeader = request.headers.get('Authorization') ?? '';
  const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let isDemo = true;
  let agentId = DEMO_AGENT_ID;

  if (bearerKey && bearerKey !== demoKey) {
    // Try to authenticate as a real user
    const agent = await authenticateAgent(request);
    if (agent) {
      isDemo = false;
      agentId = agent.id;
    }
  }

  let body: { query?: string; strategy?: string; endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { query, strategy = 'auto', endpoint = 'search' } = body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return Response.json({ error: 'query is required.' }, { status: 400 });
  }

  // Rate limit demo requests
  if (isDemo) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const db = prisma as any;
    const rateRecord = await db.playgroundRateLimit.findUnique({
      where: { ip_date: { ip, date: today } },
    });

    if (rateRecord && rateRecord.count >= 10) {
      return Response.json(
        {
          error: 'Demo limit reached',
          message: 'Sign up for free to continue',
        },
        { status: 429 },
      );
    }

    // Upsert rate limit
    await db.playgroundRateLimit.upsert({
      where: { ip_date: { ip, date: today } },
      create: { ip, date: today, count: 1 },
      update: { count: { increment: 1 } },
    });
  }

  // Build params based on endpoint type
  const capability = endpoint as string;
  let params: Record<string, unknown>;
  if (capability === 'finance') {
    params = { query, ticker: 'AAPL' };
  } else if (capability === 'crawl') {
    params = { url: query.startsWith('http') ? query : `https://${query}` };
  } else if (capability === 'embed') {
    params = { text: query };
  } else {
    params = { query };
  }

  const resolvedStrategy = STRATEGY_MAP[strategy] ?? 'auto';
  const routerReq: RouterRequest = {
    params,
    strategy: resolvedStrategy,
  };

  const start = Date.now();
  try {
    const { response } = await routeRequest(agentId, capability, routerReq);
    const latency_ms = Date.now() - start;

    return Response.json({
      result: response,
      latency_ms,
      tool_used: response.meta?.tool_used ?? null,
      demo: isDemo,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Router error';
    return Response.json({ error: message }, { status: 502 });
  }
}
