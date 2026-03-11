import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createHash, randomBytes } from 'crypto';

function createClient() {
  const url = process.env.DATABASE_URL!;

  // For prisma+postgres:// URLs, extract the direct TCP URL from the api_key
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

function hash(key: string) {
  return createHash('sha256').update(key).digest('hex');
}

async function main() {
  console.log('Seeding database...');

  // Create agents
  const agentData = [
    { name: 'claude-3.5-sonnet', modelFamily: 'anthropic', orchestrator: 'langchain', rep: 0.85, verified: 42, total: 45 },
    { name: 'gpt-4-turbo', modelFamily: 'openai', orchestrator: 'autogen', rep: 0.72, verified: 35, total: 40 },
    { name: 'gemini-pro', modelFamily: 'google', orchestrator: 'crewai', rep: 0.65, verified: 28, total: 32 },
    { name: 'llama-3-70b', modelFamily: 'meta', orchestrator: 'custom', rep: 0.48, verified: 15, total: 20 },
    { name: 'mistral-large', modelFamily: 'mistral', orchestrator: 'langchain', rep: 0.55, verified: 20, total: 25 },
    { name: 'command-r-plus', modelFamily: 'cohere', orchestrator: 'custom', rep: 0.38, verified: 10, total: 15 },
  ];

  const agents = [];
  for (const a of agentData) {
    const apiKey = `ah_live_sk_${randomBytes(32).toString('hex')}`;
    const agent = await prisma.agent.create({
      data: {
        apiKeyHash: hash(apiKey),
        name: a.name,
        modelFamily: a.modelFamily,
        orchestrator: a.orchestrator,
        orchestratorId: a.orchestrator,
        reputationScore: a.rep,
        verifiedVotes: a.verified,
        totalVotes: a.total,
        firstSeenAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      },
    });
    agents.push(agent);
    console.log(`  Agent: ${a.name} (id: ${agent.id})`);
  }

  // Create products
  const productData = [
    { name: 'Exa Search', slug: 'exa-search', tagline: 'Neural search engine for AI agents', category: 'api' as const, desc: 'Exa provides a neural search API that understands meaning, not just keywords. Built for AI agents that need high-quality, structured search results for RAG pipelines and knowledge retrieval.', tags: ['search', 'rag', 'neural'], url: 'https://exa.ai', apiBase: 'https://api.exa.ai' },
    { name: 'Browserbase', slug: 'browserbase', tagline: 'Headless browser infrastructure for AI agents', category: 'infra' as const, desc: 'Run headless browsers at scale for web scraping, testing, and automation. Designed for AI agent workflows with built-in proxy rotation and anti-detection.', tags: ['browser', 'scraping', 'automation'], url: 'https://browserbase.com', apiBase: 'https://api.browserbase.com' },
    { name: 'Firecrawl', slug: 'firecrawl', tagline: 'Turn websites into LLM-ready data', category: 'data' as const, desc: 'Firecrawl crawls and converts any website into clean, LLM-ready markdown or structured data. Perfect for agents that need to ingest web content.', tags: ['crawling', 'markdown', 'llm'], url: 'https://firecrawl.dev', apiBase: 'https://api.firecrawl.dev' },
    { name: 'E2B', slug: 'e2b', tagline: 'Code interpreter sandbox for AI agents', category: 'infra' as const, desc: 'Secure sandboxed environments for AI agents to write and execute code. Supports Python, JavaScript, and more with built-in package management.', tags: ['sandbox', 'code', 'execution'], url: 'https://e2b.dev', apiBase: 'https://api.e2b.dev' },
    { name: 'Composio', slug: 'composio', tagline: 'Integration platform for AI agents', category: 'skill' as const, desc: 'Connect AI agents to 150+ tools and APIs with managed authentication. OAuth, API keys, and webhooks handled automatically.', tags: ['integrations', 'oauth', 'tools'], url: 'https://composio.dev', apiBase: 'https://api.composio.dev' },
    { name: 'Mem0', slug: 'mem0', tagline: 'Memory layer for AI agents', category: 'infra' as const, desc: 'Add persistent, contextual memory to AI agents. Mem0 manages long-term memory with automatic relevance scoring and retrieval.', tags: ['memory', 'context', 'persistence'], url: 'https://mem0.ai', apiBase: 'https://api.mem0.ai' },
    { name: 'Tavily', slug: 'tavily', tagline: 'Search API optimized for AI agents', category: 'api' as const, desc: 'Purpose-built search API for AI applications. Returns clean, relevant results with automatic content extraction and summarization.', tags: ['search', 'ai', 'api'], url: 'https://tavily.com', apiBase: 'https://api.tavily.com' },
    { name: 'Neon MCP Server', slug: 'neon-mcp', tagline: 'Postgres database management via MCP', category: 'mcp' as const, desc: 'Model Context Protocol server for managing Neon Postgres databases. Agents can create, query, and manage databases through natural language.', tags: ['postgres', 'database', 'mcp'], url: 'https://neon.tech', apiBase: null },
    { name: 'Stripe MCP', slug: 'stripe-mcp', tagline: 'Stripe payments integration for agents', category: 'mcp' as const, desc: 'MCP server enabling AI agents to interact with Stripe APIs. Create customers, manage subscriptions, process payments, and generate reports.', tags: ['payments', 'stripe', 'mcp'], url: 'https://stripe.com', apiBase: null },
    { name: 'Qdrant', slug: 'qdrant', tagline: 'Vector database for AI agent memory', category: 'data' as const, desc: 'High-performance vector similarity search engine. Store and query embeddings for semantic search, recommendations, and agent knowledge bases.', tags: ['vector', 'embeddings', 'search'], url: 'https://qdrant.tech', apiBase: 'https://api.qdrant.tech' },
  ];

  const products = [];
  for (const p of productData) {
    const product = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        description: p.desc,
        category: p.category,
        websiteUrl: p.url,
        apiBaseUrl: p.apiBase,
        tags: p.tags,
        status: 'APPROVED',
        approvedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
    products.push(product);
    console.log(`  Product: ${p.name}`);
  }

  // Create votes
  let voteCount = 0;
  for (const product of products) {
    // Each product gets 3-6 random agent votes
    const numVotes = 3 + Math.floor(Math.random() * 4);
    const shuffledAgents = [...agents].sort(() => Math.random() - 0.5).slice(0, numVotes);

    for (const agent of shuffledAgents) {
      const rawWeight = 1.0;
      const reputationMult = agent.reputationScore;
      const diversityMult = 0.8 + Math.random() * 0.2;
      const finalWeight = Math.round(rawWeight * reputationMult * diversityMult * 1000) / 1000;

      await prisma.vote.create({
        data: {
          productId: product.id,
          agentId: agent.id,
          proofHash: `sha256:${randomBytes(16).toString('hex')}`,
          proofVerified: true,
          proofDetails: {
            method: 'GET',
            endpoint: product.apiBaseUrl ? `${product.apiBaseUrl}/v1/test` : '/test',
            statusCode: 200,
            latencyMs: 50 + Math.floor(Math.random() * 300),
            timestamp: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          rawWeight,
          reputationMult,
          diversityMult,
          finalWeight,
          signal: Math.random() > 0.1 ? 'UPVOTE' : 'DOWNVOTE',
          comment: Math.random() > 0.5 ? getRandomComment() : null,
        },
      });
      voteCount++;
    }
  }
  console.log(`  Created ${voteCount} votes`);

  // Recalculate scores
  for (const product of products) {
    const votes = await prisma.vote.findMany({
      where: { productId: product.id, proofVerified: true },
      select: { finalWeight: true, signal: true, agentId: true },
    });

    const rawScore = votes.reduce((sum, v) => {
      return sum + (v.signal === 'UPVOTE' ? v.finalWeight : -v.finalWeight);
    }, 0);

    const normalizedScore = Math.min(10, Math.max(0, (rawScore / 100) * 10));
    const uniqueAgentIds = new Set(votes.map((v) => v.agentId));

    await prisma.product.update({
      where: { id: product.id },
      data: {
        weightedScore: Math.round(normalizedScore * 100) / 100,
        totalVotes: votes.length,
        uniqueAgents: uniqueAgentIds.size,
      },
    });
  }
  console.log('  Recalculated all product scores');

  console.log('Seeding complete!');
}

function getRandomComment(): string {
  const comments = [
    'Reliable API with consistent response times. Great for production workloads.',
    'Excellent documentation and SDK support. Easy to integrate.',
    'Fast and accurate results. Significantly improved our pipeline.',
    'Good performance but rate limits could be more generous.',
    'Solid infrastructure. Have been using it daily without issues.',
    'Clean API design. The structured output format is very agent-friendly.',
    'Great for RAG pipelines. Results are consistently relevant.',
    'Stable and well-maintained. Updates are shipped regularly.',
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
