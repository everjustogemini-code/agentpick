import { NextRequest } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { redis } from '@/lib/redis';
import { authenticateAgent } from '@/lib/auth';
import { calculateReputation } from '@/lib/reputation';
import { calculateDiversity } from '@/lib/sybil';
import { recalculateProductScore } from '@/lib/voting';
import { checkRateLimit, voteLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';
import { BROWSE_STATUSES } from '@/lib/product-status';
import type { VoteSignal } from '@/generated/prisma/client';

/**
 * Simple vote endpoint — no proof of integration required.
 * Agents can quickly upvote/downvote tools they've used.
 * Votes without proof get 0.5x weight (vs 1.0x for proof-backed votes).
 */

interface SimpleVoteBody {
  product_slug: string;
  signal: 'upvote' | 'downvote';
  comment?: string;
}

async function handleSimpleVote(request: NextRequest, body: SimpleVoteBody) {
  // 1. Authenticate
  const agent = await authenticateAgent(request);
  if (!agent) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  // 2. Rate limit
  const { limited, retryAfter } = await checkRateLimit(voteLimiter, agent.id);
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many votes. Slow down.', 429, { retry_after: retryAfter });
  }

  if (!body.product_slug || !body.signal) {
    return apiError('VALIDATION_ERROR', 'product_slug and signal are required.', 400);
  }

  const signalUpper = body.signal.toUpperCase();
  if (signalUpper !== 'UPVOTE' && signalUpper !== 'DOWNVOTE') {
    return apiError('VALIDATION_ERROR', 'signal must be "upvote" or "downvote".', 400);
  }

  // 4. Find product (accept any browsable status, not just APPROVED)
  const product = await withRetry(() => prisma.product.findFirst({
    where: {
      slug: body.product_slug,
      status: { in: BROWSE_STATUSES },
    },
  }));
  if (!product) {
    return apiError('NOT_FOUND', `Product "${body.product_slug}" not found.`, 404);
  }

  const signal: VoteSignal = signalUpper as VoteSignal;

  // 5. Calculate weights — simple votes get 0.5x base weight (no proof)
  const rawWeight = 0.5;
  const reputationMult = agent.reputationScore;
  const diversityMult = await calculateDiversity(agent, product.id);
  const finalWeight = Math.round(rawWeight * reputationMult * diversityMult * 1000) / 1000;

  // 6. Upsert vote
  try {
    const existingVote = await withRetry(() => prisma.vote.findUnique({
      where: {
        productId_agentId: {
          productId: product.id,
          agentId: agent.id,
        },
      },
      select: { id: true, signal: true, proofVerified: true },
    }));

    // Don't overwrite a proof-backed vote with a simple one
    if (existingVote?.proofVerified) {
      return Response.json({
        vote_id: existingVote.id,
        updated: false,
        message: 'You already have a proof-backed vote for this product. Use POST /api/v1/vote to update it with new proof.',
      });
    }

    const isUpdate = !!existingVote;
    const previousSignal = existingVote?.signal ?? null;

    // Simple votes count as verified (lightweight verification via API key auth)
    const simpleHash = `simple:${agent.id}:${product.id}:${Date.now()}`;
    const voteData = {
      proofHash: simpleHash,
      proofVerified: true,
      proofDetails: Prisma.JsonNull,
      rawWeight,
      reputationMult,
      diversityMult,
      finalWeight,
      signal,
      comment: body.comment ?? null,
    };

    const vote = await withRetry(() => prisma.vote.upsert({
      where: {
        productId_agentId: {
          productId: product.id,
          agentId: agent.id,
        },
      },
      create: {
        productId: product.id,
        agentId: agent.id,
        ...voteData,
      },
      update: voteData,
    }));

    // 7. Update agent stats (only on new vote)
    if (!isUpdate) {
      const updatedAgent = await withRetry(() => prisma.agent.update({
        where: { id: agent.id },
        data: { totalVotes: { increment: 1 }, verifiedVotes: { increment: 1 } },
      }));
      const newReputation = calculateReputation(updatedAgent);
      await withRetry(() => prisma.agent.update({
        where: { id: agent.id },
        data: { reputationScore: newReputation },
      }));
    }

    // 8. Recalculate product score
    const newScore = await recalculateProductScore(product.id);

    // 9. Invalidate caches
    try {
      const pipeline = redis.pipeline();
      pipeline.del(`product:${body.product_slug}`);
      const listKeys = await redis.keys('products:*');
      for (const key of listKeys) {
        pipeline.del(key);
      }
      await pipeline.exec();
    } catch {
      // Redis down — stale cache will expire
    }

    return Response.json({
      vote_id: vote.id,
      updated: isUpdate,
      ...(isUpdate && previousSignal ? { previous_signal: previousSignal.toLowerCase() } : {}),
      weight: {
        raw: rawWeight,
        reputation_multiplier: reputationMult,
        diversity_multiplier: diversityMult,
        final: finalWeight,
        note: 'Simple votes get 0.5x base weight. Use POST /api/v1/vote with proof for full weight.',
      },
      product_new_score: Math.round(newScore * 100) / 100,
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return apiError('DUPLICATE', 'Duplicate vote detected.', 409);
    }
    throw err;
  }
}

/** GET fallback for runtimes that only support GET (e.g. ChatGPT Actions) */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const body: SimpleVoteBody = {
    product_slug: url.searchParams.get('product_slug') ?? '',
    signal: (url.searchParams.get('signal') ?? '') as 'upvote' | 'downvote',
    comment: url.searchParams.get('comment') ?? undefined,
  };
  return handleSimpleVote(request, body);
}

export async function POST(request: NextRequest) {
  let body: SimpleVoteBody;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }
  return handleSimpleVote(request, body);
}
