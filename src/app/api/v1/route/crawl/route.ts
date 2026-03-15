import { NextRequest } from 'next/server';
import { handleRouteRequest } from '@/lib/router/handler';
import { apiError } from '@/types';
import { z } from 'zod';

const CrawlBody = z.union([
  z.object({ params: z.object({ url: z.string().url() }) }),
  z.object({ url: z.string().url() }),
])

export async function POST(request: NextRequest) {
  // Normalize flat { url } body to nested { params: { url } }
  try {
    const raw = await request.json();
    const parsed = CrawlBody.safeParse(raw);
    if (parsed.success && !('params' in parsed.data) && 'url' in parsed.data) {
      // Extract SDK control fields; everything else becomes params (url, maxDepth, etc.)
      // This mirrors handler.ts flat-body normalization so extra crawl params are preserved.
      const { tool, tool_api_key, fallback, strategy, priority_tools, priority, priorityTools, ...paramRest } = raw as Record<string, unknown>;
      const normalized = { tool, tool_api_key, fallback, strategy, priority_tools, priority, priorityTools, params: paramRest };
      const newReq = new NextRequest(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(normalized),
      });
      return handleRouteRequest(newReq, 'crawl');
    }
    // Re-create request so handler can read body
    const newReq = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(raw),
    });
    return handleRouteRequest(newReq, 'crawl');
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }
}

export async function GET(request: NextRequest) {
  return handleRouteRequest(request, 'crawl');
}
