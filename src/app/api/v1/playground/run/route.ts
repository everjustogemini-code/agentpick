import { NextRequest } from 'next/server';
import { hashApiKey } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

const PLAYGROUND_AGENT_TOKEN = 'ah_internal_playground_demo';

async function getPlaygroundAgent() {
  const apiKeyHash = hashApiKey(PLAYGROUND_AGENT_TOKEN);
  return prisma.agent.upsert({
    where: { apiKeyHash },
    update: { lastActiveAt: new Date(), isRestricted: false },
    create: {
      apiKeyHash,
      name: 'playground-agent',
      modelFamily: 'internal',
      orchestrator: 'agentpick-playground',
      description: 'Internal agent used for the public API playground.',
      isRestricted: false,
    },
    select: { id: true },
  });
}

export async function POST(request: NextRequest) {
  const demoKey = process.env.PLAYGROUND_DEMO_KEY ?? PLAYGROUND_AGENT_TOKEN;

  let body: { endpoint?: string; query?: string; strategy?: string; apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { endpoint = 'search', query, strategy = 'auto', apiKey } = body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return Response.json({ error: 'query is required.' }, { status: 400 });
  }

  const validEndpoints = ['search', 'crawl', 'embed', 'finance'];
  if (!validEndpoints.includes(endpoint)) {
    return Response.json({ error: `endpoint must be one of: ${validEndpoints.join(', ')}` }, { status: 400 });
  }

  // Determine if using demo key path
  const isDemo = !apiKey || apiKey === demoKey;

  if (isDemo) {
    // Rate limit by IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const db = prisma as any;

    // Atomic upsert: increment count, get new value
    const record = await db.playgroundRateLimit.upsert({
      where: { ip_date: { ip, date: today } },
      create: { ip, date: today, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });

    if (record.count > 10) {
      return Response.json(
        { error: 'Demo limit reached', cta: 'Sign up free to continue' },
        { status: 429 },
      );
    }
  }

  // Ensure playground agent exists in DB when using demo token
  if (isDemo) {
    await getPlaygroundAgent();
  }

  // Build the authorization header
  const authKey = isDemo ? demoKey : apiKey!;

  // Derive base URL from request
  const reqUrl = new URL(request.url);
  const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;

  // Build params based on endpoint type
  let params: Record<string, unknown>;
  if (endpoint === 'finance') {
    params = { query, ticker: query.toUpperCase() };
  } else if (endpoint === 'crawl') {
    params = { url: query.startsWith('http') ? query : `https://${query}` };
  } else if (endpoint === 'embed') {
    params = { text: query };
  } else {
    params = { query };
  }

  // Forward to real route
  try {
    const upstream = await fetch(`${baseUrl}/api/v1/route/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`,
      },
      body: JSON.stringify({ params, strategy }),
    });

    const data = await upstream.json();
    return Response.json(data, { status: upstream.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Router error';
    return Response.json({ error: message }, { status: 502 });
  }
}
