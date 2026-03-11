import { config } from 'dotenv';
config(); // load .env first
config({ path: '.env.local', override: true }); // .env.local overrides
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createHash, randomBytes } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { PRODUCTS } from './seed-data/products';
import { ALL_AGENTS, type SeedAgent } from './seed-data/agents';

// ============================================================
// Setup
// ============================================================

function createClient() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL!;
  if (url.startsWith('prisma+postgres://')) {
    const apiKey = new URL(url).searchParams.get('api_key');
    if (apiKey) {
      const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString());
      const tcpUrl = decoded.databaseUrl as string;
      const adapter = new PrismaPg({ connectionString: tcpUrl });
      return new PrismaClient({ adapter });
    }
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

const prisma = createClient();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function hash(key: string) {
  return createHash('sha256').update(key).digest('hex');
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(randBetween(min, max + 1));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================
// Comment generation via Anthropic API
// ============================================================

interface CommentRequest {
  agentName: string;
  agentPersona: string;
  commentStyle: string;
  languages: string[];
  productName: string;
  productTagline: string;
  productCategory: string;
  productTags: string[];
  signal: 'UPVOTE' | 'DOWNVOTE';
}

const commentCache = new Set<string>();

async function generateComment(req: CommentRequest): Promise<string> {
  const langInstruction = req.languages.includes('zh')
    ? 'Write in Chinese (Simplified). Technical terms can be in English.'
    : req.languages.includes('ja')
      ? 'Write in Japanese. Technical terms can be in English.'
      : '';

  const styleGuide: Record<string, string> = {
    'metrics-heavy': 'Focus on specific numbers, benchmarks, measurements. Example: "P95 latency: 182ms across 10K requests. Error rate: 0.02%."',
    'comparative': 'Compare with alternatives, highlight differentiators. Example: "2.3x faster than alternatives for structured results."',
    'concise': 'Minimal words, maximum signal. Example: "Works. Fast. Clean output."',
    'detailed': 'Multi-aspect evaluation with specific findings. Cover 2-3 aspects briefly.',
    'multilingual': langInstruction || 'Write a code-mixed comment (English + technical jargon).',
  };

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 120,
    system: `You are ${req.agentName}, ${req.agentPersona}.
Write a brief product review (1-2 sentences, max 80 words).
Style: ${styleGuide[req.commentStyle] || 'Concise technical evaluation.'}
${langInstruction}
Rules:
- No emotional language or exclamation marks
- Pure technical evaluation
- Be specific, not generic
- Never start with "I" or the product name
- Each review must be unique — vary structure and content`,
    messages: [{
      role: 'user',
      content: `Review: ${req.productName} — "${req.productTagline}"
Category: ${req.productCategory}. Tags: ${req.productTags.join(', ')}.
Verdict: ${req.signal === 'UPVOTE' ? 'positive' : 'negative'}.
${req.signal === 'DOWNVOTE' ? 'Focus on a specific technical issue or limitation.' : 'Highlight a specific strength or use case.'}`
    }]
  });

  const text = (response.content[0] as { type: 'text'; text: string }).text.trim();

  // Truncate to 500 chars (Prisma VarChar limit)
  const truncated = text.length > 490 ? text.slice(0, 490) + '...' : text;

  // Duplicate check
  if (commentCache.has(truncated)) {
    // Append a small variation
    const varied = truncated + ` [${req.agentName.split('-')[0]}]`;
    commentCache.add(varied);
    return varied.slice(0, 500);
  }

  commentCache.add(truncated);
  return truncated;
}

async function generateCommentsBatch(
  requests: CommentRequest[],
  batchSize = 15,
): Promise<Map<number, string>> {
  const results = new Map<number, string>();
  let completed = 0;

  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const promises = batch.map(async (req, idx) => {
      try {
        const comment = await generateComment(req);
        results.set(i + idx, comment);
      } catch (err) {
        console.error(`  Comment generation failed for ${req.agentName} → ${req.productName}:`, (err as Error).message);
        // Fallback to a static comment
        const fallback = generateFallbackComment(req);
        results.set(i + idx, fallback);
      }
    });

    await Promise.all(promises);
    completed += batch.length;
    if (completed % 50 === 0 || completed === requests.length) {
      console.log(`  Comments generated: ${completed}/${requests.length}`);
    }

    // Small delay between batches to respect rate limits
    if (i + batchSize < requests.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}

function generateFallbackComment(req: CommentRequest): string {
  const upvoteComments = [
    `Solid ${req.productCategory} tool. Reliable performance in production.`,
    `Good integration experience. ${req.productTags[0]} support is well-implemented.`,
    `Consistent results across test scenarios. Documentation is clear.`,
    `Performs well for ${req.productTags[0]} workloads. Low overhead.`,
    `Clean API surface. Handles edge cases gracefully.`,
  ];
  const downvoteComments = [
    `Rate limits too restrictive for production usage in ${req.productCategory} workflows.`,
    `Latency spikes under load. Needs better connection pooling.`,
    `Documentation gaps for advanced ${req.productTags[0]} features.`,
    `SDK missing key features. Had to write custom wrapper.`,
    `Inconsistent behavior across regions. Reliability concerns.`,
  ];
  const pool = req.signal === 'UPVOTE' ? upvoteComments : downvoteComments;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============================================================
// Vote assignment logic
// ============================================================

interface VoteAssignment {
  agentIdx: number;
  productIdx: number;
  signal: 'UPVOTE' | 'DOWNVOTE';
  hasComment: boolean;
}

function generateVoteAssignments(
  agents: SeedAgent[],
  productCount: number,
  productCategories: string[],
  productTags: string[][],
): VoteAssignment[] {
  const assignments: VoteAssignment[] = [];
  const agentProductPairs = new Set<string>();

  for (let agentIdx = 0; agentIdx < agents.length; agentIdx++) {
    const agent = agents[agentIdx];
    const numVotes = randInt(agent.votesRange[0], agent.votesRange[1]);

    // Build candidate product list based on preferences
    let candidateProducts: number[] = [];
    if (agent.preferredCategories && agent.preferredCategories.length > 0) {
      // Prefer products in agent's preferred categories (70% from preferred, 30% any)
      const preferred: number[] = [];
      const others: number[] = [];
      for (let p = 0; p < productCount; p++) {
        if (agent.preferredCategories.includes(productCategories[p])) {
          preferred.push(p);
        } else {
          others.push(p);
        }
      }
      // Weighted: preferred products get 3x selection weight
      candidateProducts = [...shuffle(preferred), ...shuffle(preferred), ...shuffle(preferred), ...shuffle(others)];
    } else {
      candidateProducts = shuffle(Array.from({ length: productCount }, (_, i) => i));
    }

    // Pick unique products for this agent
    const selectedProducts = new Set<number>();
    for (const p of candidateProducts) {
      if (selectedProducts.size >= numVotes) break;
      const key = `${agentIdx}:${p}`;
      if (!agentProductPairs.has(key)) {
        selectedProducts.add(p);
        agentProductPairs.add(key);
      }
    }

    for (const productIdx of selectedProducts) {
      const isDownvote = Math.random() < agent.downvoteRate;
      const hasComment = Math.random() < agent.commentRate;

      assignments.push({
        agentIdx,
        productIdx,
        signal: isDownvote ? 'DOWNVOTE' : 'UPVOTE',
        hasComment,
      });
    }
  }

  return assignments;
}

// ============================================================
// Main seed function
// ============================================================

async function main() {
  console.log('=== AgentPick Phase 1 Seed ===');
  console.log(`Products: ${PRODUCTS.length} | Agents: ${ALL_AGENTS.length}`);
  console.log('');

  // 1. Clear existing data
  console.log('1. Clearing existing data...');
  await prisma.vote.deleteMany({});
  await prisma.agent.deleteMany({});
  await prisma.product.deleteMany({});
  console.log('   Done.');

  // 2. Insert products
  console.log('2. Inserting products...');
  const productRecords: Array<{ id: string; slug: string; apiBaseUrl: string | null; reputationScore?: number }> = [];
  for (const p of PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        category: p.category,
        websiteUrl: p.websiteUrl,
        apiBaseUrl: p.apiBaseUrl || null,
        tags: p.tags,
        status: 'APPROVED',
        approvedAt: new Date(Date.now() - randBetween(7, 60) * 24 * 60 * 60 * 1000),
      },
    });
    productRecords.push(product);
  }
  console.log(`   Inserted ${productRecords.length} products.`);

  // Category breakdown
  const catCounts: Record<string, number> = {};
  for (const p of PRODUCTS) {
    catCounts[p.category] = (catCounts[p.category] || 0) + 1;
  }
  console.log('   Categories:', catCounts);

  // 3. Insert agents
  console.log('3. Inserting agents...');
  const agentRecords: Array<{ id: string; reputationScore: number }> = [];
  const agentApiKeys: string[] = []; // Keep for logging only
  for (const a of ALL_AGENTS) {
    const apiKey = `ah_live_sk_${randomBytes(32).toString('hex')}`;
    const rep = Math.round(randBetween(a.reputationRange[0], a.reputationRange[1]) * 1000) / 1000;
    const agent = await prisma.agent.create({
      data: {
        apiKeyHash: hash(apiKey),
        name: a.name,
        modelFamily: a.modelFamily,
        orchestrator: a.orchestrator,
        orchestratorId: a.orchestrator,
        persona: a.persona,
        tier: a.tier,
        commentStyle: a.commentStyle,
        languages: a.languages,
        votingPreferences: a.preferredCategories
          ? { preferred_categories: a.preferredCategories, focus_tags: a.focusTags || [] }
          : undefined,
        reputationScore: rep,
        totalVotes: 0,
        verifiedVotes: 0,
        firstSeenAt: new Date(Date.now() - randBetween(14, 90) * 24 * 60 * 60 * 1000),
      },
    });
    agentRecords.push(agent);
    agentApiKeys.push(apiKey);
  }
  console.log(`   Inserted ${agentRecords.length} agents.`);

  // Tier breakdown
  const tierCounts = [0, 0, 0, 0, 0, 0];
  for (const a of ALL_AGENTS) tierCounts[a.tier]++;
  console.log(`   Tiers: T1=${tierCounts[1]}, T2=${tierCounts[2]}, T3=${tierCounts[3]}, T4=${tierCounts[4]}, T5=${tierCounts[5]}`);

  // 4. Generate vote assignments
  console.log('4. Generating vote assignments...');
  const productCategories = PRODUCTS.map(p => p.category);
  const productTags = PRODUCTS.map(p => p.tags);
  const assignments = generateVoteAssignments(ALL_AGENTS, PRODUCTS.length, productCategories, productTags);
  console.log(`   Total votes: ${assignments.length}`);

  const commentAssignments = assignments.filter(a => a.hasComment);
  console.log(`   Votes with comments: ${commentAssignments.length} (${Math.round(commentAssignments.length / assignments.length * 100)}%)`);

  const downvotes = assignments.filter(a => a.signal === 'DOWNVOTE');
  console.log(`   Downvotes: ${downvotes.length} (${Math.round(downvotes.length / assignments.length * 100)}%)`);

  // 5. Generate comments via Anthropic API
  console.log('5. Generating comments via Anthropic API...');
  const commentRequests: CommentRequest[] = commentAssignments.map(a => ({
    agentName: ALL_AGENTS[a.agentIdx].name,
    agentPersona: ALL_AGENTS[a.agentIdx].persona,
    commentStyle: ALL_AGENTS[a.agentIdx].commentStyle,
    languages: ALL_AGENTS[a.agentIdx].languages,
    productName: PRODUCTS[a.productIdx].name,
    productTagline: PRODUCTS[a.productIdx].tagline,
    productCategory: PRODUCTS[a.productIdx].category,
    productTags: PRODUCTS[a.productIdx].tags,
    signal: a.signal,
  }));

  const commentMap = await generateCommentsBatch(commentRequests, 15);
  console.log(`   Generated ${commentMap.size} comments.`);

  // 6. Insert votes
  console.log('6. Inserting votes...');
  let voteCount = 0;
  let commentIdx = 0;

  // Build a comment lookup: index in commentAssignments → comment text
  const commentLookup = new Map<string, string>();
  let caIdx = 0;
  for (const a of assignments) {
    if (a.hasComment) {
      const comment = commentMap.get(caIdx);
      if (comment) {
        commentLookup.set(`${a.agentIdx}:${a.productIdx}`, comment);
      }
      caIdx++;
    }
  }

  // Insert votes sequentially in small batches to avoid connection overload
  const VOTE_BATCH_SIZE = 5;
  for (let i = 0; i < assignments.length; i += VOTE_BATCH_SIZE) {
    const batch = assignments.slice(i, i + VOTE_BATCH_SIZE);
    const promises = batch.map(async (a) => {
      const agent = agentRecords[a.agentIdx];
      const product = productRecords[a.productIdx];

      const rawWeight = 1.0;
      const reputationMult = agent.reputationScore;
      const diversityMult = Math.round((0.7 + Math.random() * 0.3) * 1000) / 1000;
      const finalWeight = Math.round(rawWeight * reputationMult * diversityMult * 1000) / 1000;

      const latencyMs = 50 + Math.floor(Math.random() * 450);
      const statusCode = a.signal === 'UPVOTE'
        ? (200 + [0, 0, 0, 0, 1][Math.floor(Math.random() * 5)])
        : (400 + [0, 1, 3, 4, 22, 29][Math.floor(Math.random() * 6)]);

      const comment = commentLookup.get(`${a.agentIdx}:${a.productIdx}`) || null;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await prisma.vote.create({
            data: {
              productId: product.id,
              agentId: agent.id,
              proofHash: randomBytes(32).toString('hex'),
              proofVerified: true,
              proofDetails: {
                method: ['GET', 'POST', 'GET', 'GET'][Math.floor(Math.random() * 4)],
                endpoint: product.apiBaseUrl
                  ? `${product.apiBaseUrl}/v1/test`
                  : `https://${product.slug}.example.com/api/v1/health`,
                statusCode,
                latencyMs,
                timestamp: new Date(Date.now() - randBetween(1, 14) * 24 * 60 * 60 * 1000).toISOString(),
              },
              rawWeight,
              reputationMult,
              diversityMult,
              finalWeight,
              signal: a.signal,
              comment,
            },
          });
          break;
        } catch (err) {
          if (attempt === 2) throw err;
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    });

    await Promise.all(promises);
    voteCount += batch.length;
    if (voteCount % 100 === 0 || voteCount === assignments.length) {
      console.log(`   Votes inserted: ${voteCount}/${assignments.length}`);
    }
  }

  // 7. Update agent stats
  console.log('7. Updating agent stats...');
  for (let i = 0; i < agentRecords.length; i++) {
    const agent = agentRecords[i];
    const agentVotes = assignments.filter(a => a.agentIdx === i);
    if (agentVotes.length > 0) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: {
          totalVotes: agentVotes.length,
          verifiedVotes: agentVotes.length,
        },
      });
    }
  }
  console.log('   Done.');

  // 8. Recalculate product scores
  console.log('8. Recalculating product scores...');
  for (const product of productRecords) {
    const votes = await prisma.vote.findMany({
      where: { productId: product.id, proofVerified: true },
      select: { finalWeight: true, signal: true, agentId: true },
    });

    const rawScore = votes.reduce((sum, v) => {
      return sum + (v.signal === 'UPVOTE' ? v.finalWeight : -v.finalWeight);
    }, 0);

    const normalizedScore = Math.min(10, Math.max(0, (rawScore / 100) * 10));
    const uniqueAgentIds = new Set(votes.map(v => v.agentId));

    await prisma.product.update({
      where: { id: product.id },
      data: {
        weightedScore: Math.round(normalizedScore * 100) / 100,
        totalVotes: votes.length,
        uniqueAgents: uniqueAgentIds.size,
      },
    });
  }
  console.log('   Done.');

  // 9. Summary
  console.log('');
  console.log('=== Seed Summary ===');
  console.log(`Products: ${productRecords.length}`);
  console.log(`Agents: ${agentRecords.length}`);
  console.log(`Votes: ${voteCount} (${downvotes.length} downvotes, ${commentMap.size} with comments)`);

  // Top products by score
  const topProducts = await prisma.product.findMany({
    orderBy: { weightedScore: 'desc' },
    take: 10,
    select: { name: true, weightedScore: true, totalVotes: true, uniqueAgents: true, category: true },
  });
  console.log('');
  console.log('Top 10 products:');
  for (const p of topProducts) {
    console.log(`  ${p.name} (${p.category}): score=${p.weightedScore}, votes=${p.totalVotes}, agents=${p.uniqueAgents}`);
  }

  // Category averages
  console.log('');
  console.log('Category averages:');
  for (const cat of ['api', 'mcp', 'skill', 'data', 'infra', 'platform']) {
    const products = await prisma.product.findMany({
      where: { category: cat as any },
      select: { weightedScore: true, totalVotes: true },
    });
    const avgScore = products.reduce((s, p) => s + p.weightedScore, 0) / products.length;
    const avgVotes = products.reduce((s, p) => s + p.totalVotes, 0) / products.length;
    console.log(`  ${cat}: avg_score=${avgScore.toFixed(2)}, avg_votes=${avgVotes.toFixed(1)}, count=${products.length}`);
  }

  console.log('');
  console.log('=== Seed Complete ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
