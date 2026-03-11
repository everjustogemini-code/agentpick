import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uniqueSlug } from '@/lib/slugify';
import { checkRateLimit, submitLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';
import type { ProductSubmitRequest } from '@/types';

const VALID_CATEGORIES = ['api', 'mcp', 'skill', 'data', 'infra'] as const;

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { limited, retryAfter } = await checkRateLimit(submitLimiter, ip);
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many submissions.', 429, { retry_after: retryAfter });
  }

  let body: ProductSubmitRequest;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  // Validate required fields
  if (!body.name || body.name.length < 2 || body.name.length > 100) {
    return apiError('VALIDATION_ERROR', 'name must be 2-100 characters.', 400);
  }
  if (!body.tagline || body.tagline.length > 80) {
    return apiError('VALIDATION_ERROR', 'tagline is required (max 80 chars).', 400);
  }
  if (!body.description || body.description.length > 2000) {
    return apiError('VALIDATION_ERROR', 'description is required (max 2000 chars).', 400);
  }
  if (!body.category || !VALID_CATEGORIES.includes(body.category as typeof VALID_CATEGORIES[number])) {
    return apiError('VALIDATION_ERROR', `category must be one of: ${VALID_CATEGORIES.join(', ')}`, 400);
  }
  if (!body.website_url || !isValidUrl(body.website_url)) {
    return apiError('VALIDATION_ERROR', 'website_url must be a valid URL.', 400);
  }
  if (!body.submitter_email || !body.submitter_email.includes('@')) {
    return apiError('VALIDATION_ERROR', 'submitter_email must be a valid email.', 400);
  }
  if (body.docs_url && !isValidUrl(body.docs_url)) {
    return apiError('VALIDATION_ERROR', 'docs_url must be a valid URL.', 400);
  }
  if (body.api_base_url && !isValidUrl(body.api_base_url)) {
    return apiError('VALIDATION_ERROR', 'api_base_url must be a valid URL.', 400);
  }
  if (body.tags && body.tags.length > 5) {
    return apiError('VALIDATION_ERROR', 'Maximum 5 tags allowed.', 400);
  }

  const slug = await uniqueSlug(body.name);

  const product = await prisma.product.create({
    data: {
      slug,
      name: body.name,
      tagline: body.tagline,
      description: body.description,
      category: body.category,
      websiteUrl: body.website_url,
      docsUrl: body.docs_url ?? null,
      apiBaseUrl: body.api_base_url ?? null,
      tags: body.tags ?? [],
      submittedBy: body.submitter_email,
    },
  });

  return Response.json(
    {
      product_id: product.id,
      slug: product.slug,
      status: product.status,
      message: 'Product submitted for review.',
    },
    { status: 201 }
  );
}
