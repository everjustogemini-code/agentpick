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
      const normalized = { ...raw, params: { url: (parsed.data as { url: string }).url } };
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
