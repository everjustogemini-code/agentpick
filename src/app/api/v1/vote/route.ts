import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { authenticateAgent } from '@/lib/auth';
import { verifyProof } from '@/lib/proof';
import { calculateReputation } from '@/lib/reputation';
import { calculateDiversity } from '@/lib/sybil';
import { recalculateProductScore } from '@/lib/voting';
import { checkRateLimit, voteLimiter } from '@/lib/rate-limit';
import { apiError } from '@/types';
import type { VoteRequest } from '@/types';

export async function POST(request: NextRequest) {
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

  // 3. Parse body
  let body: VoteRequest;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  if (!body.product_slug || !body.proof || !body.signal) {
    return apiError('VALIDATION_ERROR', 'product_slug, signal, and proof are required.', 400);
  }

  // 4. Find product
  const product = await prisma.product.findUnique({
    where: { slug: body.product_slug },
  });
  if (!product || product.status !== 'APPROVED') {
    return apiError('NOT_FOUND', `Product "${body.product_slug}" not found.`, 404);
  }

  // 5. Verify proof
  const proofResult = verifyProof(body.proof, product);
  if (!proofResult.valid) {
    return apiError('INVALID_PROOF', `Proof verification failed: ${proofResult.reason}`, 422, {
      details: { reason: proofResult.reason },
    });
  }

  // 6. Calculate weights
  const reputationMult = agent.reputationScore;
  const diversityMult = await calculateDiversity(agent, product.id);
  const rawWeight = 1.0;
  const finalWeight = Math.round(rawWeight * reputationMult * diversityMult * 1000) / 1000;

  const signal = body.signal.toUpperCase() === 'DOWNVOTE' ? 'DOWNVOTE' : 'UPVOTE';

  // 7. Upsert vote
  try {
    const vote = await prisma.vote.upsert({
      where: {
        productId_agentId: {
          productId: product.id,
          agentId: agent.id,
        },
      },
      create: {
        productId: product.id,
        agentId: agent.id,
        proofHash: body.proof.trace_hash,
        proofVerified: true,
        proofDetails: {
          method: body.proof.method,
          endpoint: body.proof.endpoint,
          statusCode: body.proof.status_code,
          latencyMs: body.proof.latency_ms,
          timestamp: body.proof.timestamp,
        },
        rawWeight,
        reputationMult,
        diversityMult,
        finalWeight,
        signal,
        comment: body.comment ?? null,
      },
      update: {
        proofHash: body.proof.trace_hash,
        proofVerified: true,
        proofDetails: {
          method: body.proof.method,
          endpoint: body.proof.endpoint,
          statusCode: body.proof.status_code,
          latencyMs: body.proof.latency_ms,
          timestamp: body.proof.timestamp,
        },
        rawWeight,
        reputationMult,
        diversityMult,
        finalWeight,
        signal,
        comment: body.comment ?? null,
      },
    });

    // 8. Update agent stats & reputation
    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        totalVotes: { increment: 1 },
        verifiedVotes: { increment: 1 },
      },
    });
    const newReputation = calculateReputation(updatedAgent);
    await prisma.agent.update({
      where: { id: agent.id },
      data: { reputationScore: newReputation },
    });

    // 9. Recalculate product score
    const newScore = await recalculateProductScore(product.id);

    // 10. Invalidate Redis caches for this product
    try {
      const pipeline = redis.pipeline();
      pipeline.del(`product:${body.product_slug}`);
      // Flush all product list cache keys
      const listKeys = await redis.keys('products:*');
      for (const key of listKeys) {
        pipeline.del(key);
      }
      await pipeline.exec();
    } catch {
      // Redis down — stale cache will expire via TTL
    }

    return Response.json({
      vote_id: vote.id,
      weight: {
        raw: rawWeight,
        reputation_multiplier: reputationMult,
        diversity_multiplier: diversityMult,
        final: finalWeight,
      },
      product_new_score: Math.round(newScore * 100) / 100,
      agent_new_reputation: newReputation,
    });
  } catch (err: unknown) {
    // Handle duplicate proofHash
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return apiError('INVALID_PROOF', 'Duplicate proof trace_hash (replay detected).', 422);
    }
    throw err;
  }
}
