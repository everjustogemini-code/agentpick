import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAgent } from '@/lib/auth';
import { checkRateLimit, productsLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';

export async function GET(request: NextRequest) {
  // Auth optional but tracked
  const agent = await authenticateAgent(request);

  // Rate limit
  const rateLimitKey = agent
    ? `queries:${agent.id}`
    : `queries:${request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'}`;
  const { limited, retryAfter } = await checkRateLimit(productsLimiter, rateLimitKey);
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many requests. Try again later.', 429, { retry_after: retryAfter });
  }

  const domain = request.nextUrl.searchParams.get('domain');
  if (!domain) {
    return apiError('VALIDATION_ERROR', 'domain query parameter is required.', 400);
  }

  // Fetch queries from QuerySet table
  const querySet = await prisma.querySet.findFirst({
    where: { domain },
    select: {
      id: true,
      domain: true,
      queries: true,
      updatedAt: true,
    },
  });

  if (!querySet) {
    return apiError('NOT_FOUND', `No query set found for domain "${domain}".`, 404);
  }

  const queries = Array.isArray(querySet.queries)
    ? (querySet.queries as Array<{ query: string; intent?: string; complexity?: string }>)
    : [];

  return Response.json({
    domain: querySet.domain,
    queries: queries.map((q) => ({
      query: q.query,
      intent: q.intent ?? null,
      complexity: q.complexity ?? null,
    })),
    total: queries.length,
    updated_at: querySet.updatedAt.toISOString(),
  });
}
