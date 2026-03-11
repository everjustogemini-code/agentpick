import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAgent } from '@/lib/auth';
import { checkRateLimit, telemetryLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';
import type { TelemetryRequest } from '@/types';

function validateEvent(e: TelemetryRequest, idx: number): string | null {
  if (!e.tool || typeof e.tool !== 'string') return `events[${idx}]: tool is required`;
  if (!e.task || typeof e.task !== 'string') return `events[${idx}]: task is required`;
  if (typeof e.success !== 'boolean') return `events[${idx}]: success is required`;
  if (e.latency_ms !== undefined && (!Number.isInteger(e.latency_ms) || e.latency_ms <= 0 || e.latency_ms >= 300000))
    return `events[${idx}]: latency_ms must be > 0 and < 300000`;
  if (e.cost_usd !== undefined && (typeof e.cost_usd !== 'number' || e.cost_usd < 0))
    return `events[${idx}]: cost_usd must be >= 0`;
  return null;
}

export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  const { limited, retryAfter } = await checkRateLimit(telemetryLimiter, agent.id);
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many telemetry events.', 429, { retry_after: retryAfter });
  }

  let body: { events: TelemetryRequest[] };
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return apiError('VALIDATION_ERROR', 'events array is required and must not be empty.', 400);
  }
  if (body.events.length > 50) {
    return apiError('VALIDATION_ERROR', 'Maximum 50 events per batch.', 400);
  }

  for (let i = 0; i < body.events.length; i++) {
    const err = validateEvent(body.events[i], i);
    if (err) return apiError('VALIDATION_ERROR', err, 400);
  }

  // Resolve all unique tool slugs to products
  const uniqueSlugs = [...new Set(body.events.map((e) => e.tool))];
  const products = await prisma.product.findMany({
    where: { slug: { in: uniqueSlugs } },
    select: { id: true, slug: true },
  });
  const slugToProductId = new Map(products.map((p) => [p.slug, p.id]));

  // Batch insert all events
  const eventIds: string[] = [];
  const productCountIncrements = new Map<string, number>();

  for (const e of body.events) {
    const productId = slugToProductId.get(e.tool) ?? null;
    const created = await prisma.telemetryEvent.create({
      data: {
        agentId: agent.id,
        productId,
        tool: e.tool,
        task: e.task,
        success: e.success,
        statusCode: e.status_code ?? null,
        latencyMs: e.latency_ms ?? null,
        costUsd: e.cost_usd ?? null,
        context: e.context ?? null,
      },
    });
    eventIds.push(created.id);

    if (productId) {
      productCountIncrements.set(productId, (productCountIncrements.get(productId) ?? 0) + 1);
    }
  }

  // Update product telemetry counts
  for (const [productId, count] of productCountIncrements) {
    await prisma.product.update({
      where: { id: productId },
      data: { telemetryCount: { increment: count } },
    });
  }

  return Response.json({
    recorded: true,
    event_count: eventIds.length,
    event_ids: eventIds,
  });
}
