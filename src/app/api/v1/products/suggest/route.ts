import { NextRequest } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { authenticateAgent } from '@/lib/auth';
import { checkRateLimit, voteLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';

const VALID_CATEGORIES = ['search_research', 'web_crawling', 'code_compute', 'storage_memory', 'communication', 'payments_commerce', 'finance_data', 'auth_identity', 'scheduling', 'ai_models', 'observability'] as const;

interface SuggestRequest {
  name: string;
  url: string;
  tagline: string;
  category: (typeof VALID_CATEGORIES)[number];
  tags?: string[];
  discovered_via?: string;
  context?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const agent = await authenticateAgent(request);
  if (!agent) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  // 2. Rate limit (reuse vote limiter — 10/min is reasonable for suggestions too)
  const { limited, retryAfter } = await checkRateLimit(voteLimiter, `suggest:${agent.id}`);
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many suggestions. Slow down.', 429, { retry_after: retryAfter });
  }

  // 3. Parse body
  let body: SuggestRequest;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  // 4. Validate required fields
  if (!body.name || !body.url || !body.tagline || !body.category) {
    return apiError(
      'VALIDATION_ERROR',
      'name, url, tagline, and category are required.',
      400
    );
  }

  if (!VALID_CATEGORIES.includes(body.category)) {
    return apiError(
      'VALIDATION_ERROR',
      `category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      400
    );
  }

  if (body.name.length > 100) {
    return apiError('VALIDATION_ERROR', 'name must be 100 characters or less.', 400);
  }

  if (body.tagline.length > 80) {
    return apiError('VALIDATION_ERROR', 'tagline must be 80 characters or less.', 400);
  }

  // Validate URL format
  try {
    new URL(body.url);
  } catch {
    return apiError('VALIDATION_ERROR', 'url must be a valid URL.', 400);
  }

  // 5. Check for duplicate (by name or URL)
  const slug = slugify(body.name);
  const existing = await withRetry(() => prisma.product.findFirst({
    where: {
      OR: [
        { slug },
        { websiteUrl: body.url },
        { name: { equals: body.name, mode: 'insensitive' } },
      ],
    },
    select: { slug: true, name: true },
  }));

  if (existing) {
    return apiError(
      'DUPLICATE',
      `A product similar to "${body.name}" already exists (${existing.slug}).`,
      409,
      { details: { existing_slug: existing.slug } }
    );
  }

  // 6. Insert as PENDING
  const product = await withRetry(() => prisma.product.create({
    data: {
      slug,
      name: body.name,
      tagline: body.tagline,
      description: body.context || body.tagline,
      category: body.category,
      websiteUrl: body.url,
      tags: body.tags ?? [],
      status: 'PENDING',
      submittedBy: `agent:${agent.id}${body.discovered_via ? `:${body.discovered_via}` : ''}`,
    },
  }));

  return Response.json(
    {
      suggestion_id: product.id,
      slug: product.slug,
      status: 'pending_review',
    },
    { status: 201 }
  );
}
