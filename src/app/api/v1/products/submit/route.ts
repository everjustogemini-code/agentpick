import { NextRequest } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { authenticateAgent } from '@/lib/auth';
import { checkRateLimit, submitLimiterAuth, submitLimiterAnon } from '@/lib/rate-limit';
import { uniqueSlug } from '@/lib/slugify';
import { apiError } from '@/types';

const CATEGORY_RANKING_SLUGS: Record<string, string> = {
  search_research: 'best-search-apis-for-agents',
  web_crawling: 'best-web-crawling-tools-for-agents',
  code_compute: 'best-code-execution-tools-for-agents',
  storage_memory: 'best-storage-tools-for-agents',
  communication: 'best-communication-apis-for-agents',
  payments_commerce: 'best-payment-apis-for-agents',
  finance_data: 'best-finance-data-apis-for-agents',
  auth_identity: 'best-auth-tools-for-agents',
  scheduling: 'best-scheduling-apis-for-agents',
  ai_models: 'best-ai-model-apis',
  observability: 'best-observability-tools-for-agents',
};

const VALID_CATEGORIES = [
  'search_research', 'web_crawling', 'code_compute', 'storage_memory',
  'communication', 'payments_commerce', 'finance_data', 'auth_identity',
  'scheduling', 'ai_models', 'observability',
] as const;

function isValidUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

interface SubmitBody {
  name: string;
  url: string;
  api_endpoint?: string;
  tagline?: string;
  description?: string;
  category: string;
  tags?: string[];
  submitted_by?: 'agent' | 'human';
}

async function handleSubmit(request: NextRequest, body: SubmitBody) {
  // --- Auth (optional) ---
  const agent = await authenticateAgent(request);

  // --- Rate limit by agent ID (50/hr) or IP (5/hr) ---
  const limiter = agent ? submitLimiterAuth : submitLimiterAnon;
  const rateLimitKey = agent
    ? agent.id
    : request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const { limited, retryAfter } = await checkRateLimit(limiter, rateLimitKey);
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many submissions. Try again later.', 429, { retry_after: retryAfter });
  }

  // --- Validate required fields ---
  if (!body.name || typeof body.name !== 'string' || body.name.length < 2 || body.name.length > 100) {
    return apiError('VALIDATION_ERROR', 'name is required (2-100 characters).', 400);
  }
  if (!body.url || !isValidUrl(body.url)) {
    return apiError('VALIDATION_ERROR', 'url must be a valid HTTP(S) URL.', 400);
  }
  if (body.api_endpoint && !isValidUrl(body.api_endpoint)) {
    return apiError('VALIDATION_ERROR', 'api_endpoint must be a valid URL.', 400);
  }
  // Accept "description" as alias for "tagline"
  if (!body.tagline && body.description) {
    body.tagline = body.description;
  }
  if (!body.tagline || typeof body.tagline !== 'string' || body.tagline.length > 160) {
    return apiError('VALIDATION_ERROR', 'tagline or description required (max 160 chars).', 400);
  }
  if (!body.category || !VALID_CATEGORIES.includes(body.category as (typeof VALID_CATEGORIES)[number])) {
    return apiError('VALIDATION_ERROR', `category must be one of: ${VALID_CATEGORIES.join(', ')}`, 400);
  }
  if (body.tags) {
    if (!Array.isArray(body.tags) || body.tags.length > 5) {
      return apiError('VALIDATION_ERROR', 'tags must be an array (max 5).', 400);
    }
    if (body.tags.some((t: unknown) => typeof t !== 'string' || (t as string).length > 30)) {
      return apiError('VALIDATION_ERROR', 'Each tag must be a string (max 30 chars).', 400);
    }
  }
  if (body.submitted_by && !['agent', 'human'].includes(body.submitted_by)) {
    return apiError('VALIDATION_ERROR', 'submitted_by must be "agent" or "human".', 400);
  }

  // --- Auto-approve rule 1: No duplicates (name or URL) ---
  const existing = await withRetry(() => prisma.product.findFirst({
    where: {
      OR: [
        { websiteUrl: body.url },
        { name: { equals: body.name, mode: 'insensitive' } },
      ],
    },
    select: { slug: true, name: true, status: true },
  }));
  if (existing) {
    return apiError(
      'DUPLICATE',
      `A product matching this name or URL already exists: ${existing.name}`,
      409,
      { details: { existing_slug: existing.slug, existing_status: existing.status } },
    );
  }

  // --- Auto-approve rule 2: URL must be reachable (HEAD → 2xx) ---
  let urlReachable = false;
  let httpStatus = 0;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(body.url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'AgentPick-SubmitCheck/1.0' },
    });
    clearTimeout(timeout);
    httpStatus = resp.status;
    // 405 = HEAD not supported but site exists — try GET
    if (resp.status === 405) {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 8000);
      const resp2 = await fetch(body.url, {
        method: 'GET',
        signal: controller2.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'AgentPick-SubmitCheck/1.0' },
      });
      clearTimeout(timeout2);
      httpStatus = resp2.status;
      urlReachable = resp2.ok;
    } else {
      urlReachable = resp.ok;
    }
  } catch {
    urlReachable = false;
  }

  if (!urlReachable) {
    return apiError(
      'URL_UNREACHABLE',
      `The URL ${body.url} is not reachable (HTTP ${httpStatus || 'timeout'}). Product not created.`,
      422,
      { details: { url: body.url, http_status: httpStatus || null } },
    );
  }

  // --- All checks passed → auto-approve as SUBMITTED ---
  const slug = await uniqueSlug(body.name);
  const submittedBy = agent
    ? `agent:${agent.id}:${body.submitted_by ?? 'agent'}`
    : body.submitted_by ?? 'anonymous';

  const product = await withRetry(() => prisma.product.create({
    data: {
      slug,
      name: body.name,
      tagline: body.tagline!,
      description: body.tagline!, // tagline doubles as short description
      category: body.category as (typeof VALID_CATEGORIES)[number],
      websiteUrl: body.url,
      apiBaseUrl: body.api_endpoint ?? null,
      tags: body.tags ?? [],
      status: 'SMOKE_TESTED', // URL reachability verified — immediately voteable
      submittedBy,
      submittedByAgentId: agent?.id ?? null,
    },
  }));

  const productUrl = `https://agentpick.dev/products/${product.slug}`;
  const rankingUrl = CATEGORY_RANKING_SLUGS[body.category]
    ? `https://agentpick.dev/rankings/${CATEGORY_RANKING_SLUGS[body.category]}`
    : null;

  return Response.json(
    {
      product_id: product.id,
      slug: product.slug,
      status: product.status,
      url: productUrl,
      ranking_url: rankingUrl,
      message: `${body.name} is now live on AgentPick. ${agent ? 'You are credited as the discoverer.' : 'Product published.'}`,
      share_text: `I discovered ${body.name} and added it to AgentPick — the network where agents choose software. ${productUrl}`,
      next_steps: [
        `Vote for this tool: POST /api/v1/vote/simple with {"product_slug": "${product.slug}", "signal": "upvote"}`,
        `Check stats later: GET /api/v1/products/${product.slug}/stats`,
      ],
    },
    { status: 201 },
  );
}

/** GET fallback for runtimes that only support GET (e.g. ChatGPT Actions) */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tagsParam = url.searchParams.get('tags');
  const body: SubmitBody = {
    name: url.searchParams.get('name') ?? '',
    url: url.searchParams.get('url') ?? '',
    api_endpoint: url.searchParams.get('api_endpoint') ?? undefined,
    tagline: url.searchParams.get('tagline') ?? url.searchParams.get('description') ?? undefined,
    description: url.searchParams.get('description') ?? undefined,
    category: url.searchParams.get('category') ?? '',
    tags: tagsParam ? tagsParam.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    submitted_by: (url.searchParams.get('submitted_by') as 'agent' | 'human') ?? undefined,
  };
  return handleSubmit(request, body);
}

export async function POST(request: NextRequest) {
  let body: SubmitBody;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }
  return handleSubmit(request, body);
}
