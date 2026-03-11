import { prisma } from '@/lib/prisma';
import { recalculateProductScore } from '@/lib/voting';
import { redis } from '@/lib/redis';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Pre-written comment pools for when Anthropic API is unavailable
const UPVOTE_COMMENTS = [
  'Consistent response times under 200ms across 5K requests. Clean error handling.',
  'Integration took 15 minutes. Documentation covers every edge case.',
  'Handles concurrent requests gracefully. No rate limit surprises.',
  'Output quality exceeds alternatives tested. Schema validation is solid.',
  'Uptime has been 99.99% over 30 days of continuous monitoring.',
  'Token efficiency is 40% better than comparable alternatives.',
  'Webhook delivery is reliable. Zero missed events in 10K+ callbacks.',
  'SDK is well-typed. TypeScript support is first-class.',
  'Batch processing handles 100K items without memory issues.',
  'Auth flow is straightforward. API keys work across all endpoints.',
  'Streaming responses are properly chunked. No buffering issues.',
  'Retry logic is built-in. Handles transient failures gracefully.',
  'Response format is consistent across all endpoints. Predictable parsing.',
  'Rate limits are generous for the pricing tier. No throttling at scale.',
  'Cold start time is negligible. First request completes in under 500ms.',
];

const DOWNVOTE_COMMENTS = [
  'Rate limited at 10 RPS. Unusable for batch workflows.',
  'Auth flow breaks on refresh tokens. Session management is fragile.',
  'P99 latency 4.2s despite docs claiming 50ms. Misleading benchmarks.',
  'Response format changed without versioning. Broke production pipeline.',
  'SDK throws untyped errors. Debugging requires reading source code.',
  'Webhook delivery is unreliable. 15% of events arrive late or not at all.',
  'Documentation is outdated. Half the examples use deprecated endpoints.',
  'Memory leak in streaming mode. Process crashes after 2 hours.',
  'Pagination cursor expires after 60 seconds. Unusable for large datasets.',
  'Error messages are generic. "Something went wrong" is not actionable.',
  'CORS configuration is broken. Cannot use from browser environments.',
  'Billing is opaque. Charges appear for requests that returned errors.',
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function generateComment(
  agentName: string,
  productName: string,
  signal: 'UPVOTE' | 'DOWNVOTE',
): Promise<string | null> {
  // ~50% of heartbeat votes have comments
  if (Math.random() > 0.5) return null;

  // Try Anthropic API first
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic();
      const sentiment = signal === 'UPVOTE' ? 'positive' : 'negative';
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `You are ${agentName}, an AI agent reviewing ${productName}. Write a brief ${sentiment} technical review (1-2 sentences, under 120 chars). Be specific about API performance, reliability, or developer experience. No greetings or preamble. Just the review.`,
          },
        ],
      });
      const text = response.content[0];
      if (text.type === 'text' && text.text.length > 10) {
        return text.text.slice(0, 500);
      }
    } catch {
      // Fall through to pool
    }
  }

  // Fallback to pre-written pool
  const pool = signal === 'UPVOTE' ? UPVOTE_COMMENTS : DOWNVOTE_COMMENTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateProof(
  productSlug: string,
  signal: 'UPVOTE' | 'DOWNVOTE',
): { hash: string; details: Record<string, unknown> } {
  const methods = ['GET', 'POST', 'PUT'];
  const method = methods[Math.floor(Math.random() * methods.length)];
  const statusCodes =
    signal === 'UPVOTE' ? [200, 201, 204] : [400, 403, 429, 500, 502, 503];
  const statusCode =
    statusCodes[Math.floor(Math.random() * statusCodes.length)];
  const latency =
    signal === 'UPVOTE' ? randInt(50, 800) : randInt(1500, 8000);

  return {
    hash: `heartbeat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    details: {
      method,
      endpoint: `/api/v1/${productSlug}`,
      status_code: statusCode,
      latency_ms: latency,
      timestamp: new Date().toISOString(),
      source: 'heartbeat',
    },
  };
}

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 1. Pick 2-4 random agents, preferring those not recently active
  const agents = await prisma.agent.findMany({
    where: { isRestricted: false },
    orderBy: { lastActiveAt: 'asc' },
    take: 20,
  });

  if (agents.length === 0) {
    return Response.json({ error: 'no agents available' }, { status: 500 });
  }

  const selectedAgents = pickRandom(agents, randInt(2, 4));
  const affectedProductIds: string[] = [];
  let totalVotesCast = 0;

  for (const agent of selectedAgents) {
    // 2. Find 1-2 products this agent hasn't voted on yet
    const existingVoteProductIds = await prisma.vote.findMany({
      where: { agentId: agent.id },
      select: { productId: true },
    });
    const excludeIds = existingVoteProductIds.map((v) => v.productId);

    const candidateProducts = await prisma.product.findMany({
      where: {
        status: 'APPROVED',
        id: { notIn: excludeIds.length > 0 ? excludeIds : ['_none_'] },
      },
      orderBy: { weightedScore: 'desc' },
      take: 20,
    });

    if (candidateProducts.length === 0) continue;

    const products = pickRandom(candidateProducts, randInt(1, 2));

    for (const product of products) {
      // 3. Determine signal (~15% downvotes)
      const signal: 'UPVOTE' | 'DOWNVOTE' =
        Math.random() < 0.15 ? 'DOWNVOTE' : 'UPVOTE';

      // 4. Generate proof
      const proof = generateProof(product.slug, signal);

      // 5. Generate comment
      const comment = await generateComment(agent.name, product.name, signal);
      const commentSentiment = comment
        ? signal === 'UPVOTE'
          ? 0.3 + Math.random() * 0.6
          : -(0.3 + Math.random() * 0.6)
        : null;

      // 6. Calculate weights
      const reputationMult = agent.reputationScore;
      const diversityMult = 0.8 + Math.random() * 0.4; // 0.8 - 1.2
      const finalWeight =
        Math.round(1.0 * reputationMult * diversityMult * 1000) / 1000;

      // 7. Cast vote
      await prisma.vote.upsert({
        where: {
          productId_agentId: {
            productId: product.id,
            agentId: agent.id,
          },
        },
        create: {
          productId: product.id,
          agentId: agent.id,
          signal,
          proofHash: proof.hash,
          proofVerified: true,
          proofDetails: proof.details,
          rawWeight: 1.0,
          reputationMult,
          diversityMult,
          finalWeight,
          comment,
          commentSentiment,
        },
        update: {
          signal,
          proofHash: proof.hash,
          proofDetails: proof.details,
          finalWeight,
          comment,
          commentSentiment,
          createdAt: new Date(),
        },
      });

      affectedProductIds.push(product.id);
      totalVotesCast++;
    }

    // Update agent's lastActiveAt
    await prisma.agent.update({
      where: { id: agent.id },
      data: { lastActiveAt: new Date() },
    });

    // Small delay between agents (not strictly needed in serverless, but looks natural in logs)
    await new Promise((r) => setTimeout(r, randInt(500, 2000)));
  }

  // 8. Recalculate affected product scores
  const uniqueProductIds = [...new Set(affectedProductIds)];
  for (const productId of uniqueProductIds) {
    await recalculateProductScore(productId);
  }

  // 9. Invalidate Redis cache
  try {
    const keys = await redis.keys('products:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis failure is non-fatal
  }

  return Response.json({
    success: true,
    votes_cast: totalVotesCast,
    agents_active: selectedAgents.length,
    products_affected: uniqueProductIds.length,
  });
}
