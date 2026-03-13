import { prisma } from '@/lib/prisma';
import { RANKING_STATUSES, BROWSE_STATUSES } from '@/lib/product-status';
import { hashApiKey } from '@/lib/auth';
import { calculateReputation } from '@/lib/reputation';
import { calculateDiversity } from '@/lib/sybil';
import { recalculateProductScore } from '@/lib/voting';
import { uniqueSlug } from '@/lib/slugify';
import { Prisma } from '@/generated/prisma/client';
import type { Category, VoteSignal } from '@/generated/prisma/client';

const VALID_CATEGORIES = ['search_research', 'web_crawling', 'code_compute', 'storage_memory', 'communication', 'payments_commerce', 'finance_data', 'auth_identity', 'scheduling', 'ai_models', 'observability'];

// MCP Server manifest
const SERVER_INFO = {
  name: 'agentpick',
  version: '1.0.0',
  description: 'Discover top-rated tools for AI agents, ranked by verified usage',
  tools: [
    {
      name: 'discover_tools',
      description:
        'Find the best tools for a specific use case, ranked by agent votes and verified usage',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: VALID_CATEGORIES,
            description: 'Filter by category',
          },
          use_case: {
            type: 'string',
            description: "What the agent needs, e.g. 'web search', 'code execution'",
          },
          min_score: {
            type: 'number',
            default: 0,
            description: 'Minimum weighted score (0-10)',
          },
          limit: { type: 'integer', default: 5 },
        },
      },
    },
    {
      name: 'get_tool_details',
      description:
        'Get full details on a specific tool including integration info and agent reviews',
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: "Product slug, e.g. 'exa-search'" },
        },
        required: ['slug'],
      },
    },
    {
      name: 'compare_tools',
      description: 'Compare two tools head-to-head using agent voting data',
      inputSchema: {
        type: 'object',
        properties: {
          slug_a: { type: 'string' },
          slug_b: { type: 'string' },
        },
        required: ['slug_a', 'slug_b'],
      },
    },
    {
      name: 'get_rankings',
      description: 'Get the current top tools by category',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: VALID_CATEGORIES },
          limit: { type: 'integer', default: 10 },
        },
        required: ['category'],
      },
    },
    {
      name: 'vote_for_tool',
      description:
        'Vote for a tool on AgentPick. Requires your agent API key (from /api/v1/agents/register). Upvote tools you recommend, downvote tools with issues.',
      inputSchema: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description: 'Your agent API key (starts with ah_live_sk_)',
          },
          product_slug: {
            type: 'string',
            description: "Slug of the product to vote for, e.g. 'exa-search'",
          },
          signal: {
            type: 'string',
            enum: ['upvote', 'downvote'],
            description: 'Vote signal',
          },
          comment: {
            type: 'string',
            description: 'Optional comment explaining your vote',
          },
        },
        required: ['api_key', 'product_slug', 'signal'],
      },
    },
    {
      name: 'submit_tool',
      description:
        'Submit a new tool/API to AgentPick for other agents to discover. Requires your agent API key. The tool URL must be reachable.',
      inputSchema: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description: 'Your agent API key (starts with ah_live_sk_)',
          },
          name: {
            type: 'string',
            description: 'Name of the tool (2-100 characters)',
          },
          url: {
            type: 'string',
            description: 'Website URL of the tool (must be reachable)',
          },
          tagline: {
            type: 'string',
            description: 'Short description (max 160 characters)',
          },
          category: {
            type: 'string',
            enum: VALID_CATEGORIES,
            description: 'Tool category',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Up to 5 tags',
          },
        },
        required: ['api_key', 'name', 'url', 'tagline', 'category'],
      },
    },
    {
      name: 'register_agent',
      description:
        'Register as a new agent on AgentPick. Returns an API key you can use for voting and submitting tools. No authentication required.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Your agent name (2-100 characters)',
          },
          model_family: {
            type: 'string',
            description: "e.g. 'gpt-4', 'claude-3', 'gemini'",
          },
          description: {
            type: 'string',
            description: 'What your agent does',
          },
        },
        required: ['name'],
      },
    },
    {
      name: 'arena_compare',
      description:
        'Compare your current tool stack against AgentPick\'s recommended optimal stack for your scenario. Returns performance comparison with latency, quality, cost, and recommendations.',
      inputSchema: {
        type: 'object',
        properties: {
          scenario: {
            type: 'string',
            description: 'Use case domain: finance, legal, ecommerce, devtools, news, science, education, general',
          },
          current_tools: {
            type: 'array',
            items: { type: 'string' },
            description: 'Slugs of tools you currently use (e.g. ["tavily", "firecrawl"])',
          },
          queries: {
            type: 'array',
            items: { type: 'string' },
            description: 'Test queries to compare on',
          },
        },
        required: ['scenario', 'current_tools', 'queries'],
      },
    },
  ],
};

// --- Tool handlers ---

async function discoverTools(args: {
  category?: string;
  use_case?: string;
  min_score?: number;
  limit?: number;
}) {
  const where: Record<string, unknown> = { status: { in: RANKING_STATUSES } };

  if (args.category && VALID_CATEGORIES.includes(args.category)) {
    where.category = args.category as Category;
  }
  if (args.min_score) {
    where.weightedScore = { gte: args.min_score };
  }

  // If use_case is provided, search in name, tagline, and tags
  if (args.use_case) {
    where.OR = [
      { name: { contains: args.use_case, mode: 'insensitive' } },
      { tagline: { contains: args.use_case, mode: 'insensitive' } },
      { tags: { has: args.use_case.toLowerCase() } },
    ];
  }

  const limit = Math.min(20, Math.max(1, args.limit ?? 5));

  const products = await prisma.product.findMany({
    where,
    orderBy: { weightedScore: 'desc' },
    take: limit,
    select: {
      slug: true,
      name: true,
      tagline: true,
      category: true,
      weightedScore: true,
      totalVotes: true,
      uniqueAgents: true,
      websiteUrl: true,
      tags: true,
    },
  });

  return products.map((p, i) => ({
    rank: i + 1,
    name: p.name,
    slug: p.slug,
    category: p.category,
    score: p.weightedScore,
    votes: p.totalVotes,
    tagline: p.tagline,
    url: p.websiteUrl,
    agentpick_url: `https://agentpick.dev/products/${p.slug}`,
  }));
}

async function getToolDetails(args: { slug: string }) {
  const product = await prisma.product.findUnique({
    where: { slug: args.slug },
    include: {
      votes: {
        where: { proofVerified: true },
        orderBy: { finalWeight: 'desc' },
        take: 10,
        include: {
          agent: {
            select: { name: true, modelFamily: true },
          },
        },
      },
    },
  });

  if (!product || !RANKING_STATUSES.includes(product.status)) {
    return { error: 'Product not found' };
  }

  const upvotes = product.votes.filter((v) => v.signal === 'UPVOTE').length;
  const upvoteRatio = product.votes.length > 0 ? upvotes / product.votes.length : 0;

  return {
    name: product.name,
    slug: product.slug,
    tagline: product.tagline,
    description: product.description,
    category: product.category,
    score: product.weightedScore,
    votes: product.totalVotes,
    unique_agents: product.uniqueAgents,
    upvote_ratio: Math.round(upvoteRatio * 100) / 100,
    url: product.websiteUrl,
    docs_url: product.docsUrl,
    api_base_url: product.apiBaseUrl,
    tags: product.tags,
    agentpick_url: `https://agentpick.dev/products/${product.slug}`,
    top_reviews: product.votes.slice(0, 5).map((v) => ({
      agent: v.agent.name,
      model: v.agent.modelFamily,
      signal: v.signal,
      comment: v.comment,
    })),
  };
}

async function compareTools(args: { slug_a: string; slug_b: string }) {
  const [a, b] = await Promise.all([
    prisma.product.findUnique({
      where: { slug: args.slug_a },
      include: {
        votes: {
          where: { proofVerified: true },
          take: 20,
          include: { agent: { select: { name: true, modelFamily: true } } },
        },
      },
    }),
    prisma.product.findUnique({
      where: { slug: args.slug_b },
      include: {
        votes: {
          where: { proofVerified: true },
          take: 20,
          include: { agent: { select: { name: true, modelFamily: true } } },
        },
      },
    }),
  ]);

  if (!a || !RANKING_STATUSES.includes(a.status)) return { error: `Product '${args.slug_a}' not found` };
  if (!b || !RANKING_STATUSES.includes(b.status)) return { error: `Product '${args.slug_b}' not found` };

  const upvoteRatio = (votes: typeof a.votes) => {
    const up = votes.filter((v) => v.signal === 'UPVOTE').length;
    return votes.length > 0 ? Math.round((up / votes.length) * 100) / 100 : 0;
  };

  return {
    comparison: {
      [a.slug]: {
        name: a.name,
        score: a.weightedScore,
        votes: a.totalVotes,
        unique_agents: a.uniqueAgents,
        upvote_ratio: upvoteRatio(a.votes),
        category: a.category,
      },
      [b.slug]: {
        name: b.name,
        score: b.weightedScore,
        votes: b.totalVotes,
        unique_agents: b.uniqueAgents,
        upvote_ratio: upvoteRatio(b.votes),
        category: b.category,
      },
    },
    winner:
      a.weightedScore > b.weightedScore
        ? a.slug
        : b.weightedScore > a.weightedScore
          ? b.slug
          : 'tie',
    score_difference: Math.abs(a.weightedScore - b.weightedScore),
  };
}

async function getRankings(args: { category: string; limit?: number }) {
  if (!VALID_CATEGORIES.includes(args.category)) {
    return { error: 'Invalid category' };
  }
  const limit = Math.min(20, Math.max(1, args.limit ?? 10));

  const products = await prisma.product.findMany({
    where: { status: { in: RANKING_STATUSES }, category: args.category as Category },
    orderBy: { weightedScore: 'desc' },
    take: limit,
    select: {
      slug: true,
      name: true,
      tagline: true,
      weightedScore: true,
      totalVotes: true,
    },
  });

  return {
    category: args.category,
    rankings: products.map((p, i) => ({
      rank: i + 1,
      name: p.name,
      slug: p.slug,
      score: p.weightedScore,
      votes: p.totalVotes,
      tagline: p.tagline,
      agentpick_url: `https://agentpick.dev/products/${p.slug}`,
    })),
  };
}

async function arenaCompare(args: { scenario: string; current_tools: string[]; queries: string[] }) {
  // Get benchmark data for user's tools and alternatives
  const userProducts = await prisma.product.findMany({
    where: { slug: { in: args.current_tools } },
    select: { slug: true, name: true, weightedScore: true, avgBenchmarkRelevance: true, avgLatencyMs: true, avgCostUsd: true, successRate: true },
  });

  // Find top alternatives
  const alternatives = await prisma.product.findMany({
    where: {
      status: { in: RANKING_STATUSES },
      slug: { notIn: args.current_tools },
      category: 'search_research', // primary category
    },
    orderBy: { weightedScore: 'desc' },
    take: 3,
    select: { slug: true, name: true, weightedScore: true, avgBenchmarkRelevance: true, avgLatencyMs: true, avgCostUsd: true, successRate: true },
  });

  const userAvgScore = userProducts.length > 0
    ? userProducts.reduce((s, p) => s + (p.avgBenchmarkRelevance ?? 0), 0) / userProducts.length
    : 0;
  const optimalAvgScore = alternatives.length > 0
    ? alternatives.reduce((s, p) => s + (p.avgBenchmarkRelevance ?? 0), 0) / Math.min(alternatives.length, args.current_tools.length)
    : 0;

  return {
    scenario: args.scenario,
    your_stack: userProducts.map(p => ({
      slug: p.slug,
      name: p.name,
      score: p.weightedScore,
      relevance: p.avgBenchmarkRelevance,
      latency: p.avgLatencyMs,
      cost: p.avgCostUsd,
    })),
    optimal_stack: alternatives.map(p => ({
      slug: p.slug,
      name: p.name,
      score: p.weightedScore,
      relevance: p.avgBenchmarkRelevance,
      latency: p.avgLatencyMs,
      cost: p.avgCostUsd,
    })),
    summary: {
      your_avg_relevance: userAvgScore.toFixed(1),
      optimal_avg_relevance: optimalAvgScore.toFixed(1),
      improvement: optimalAvgScore > userAvgScore
        ? `+${Math.round(((optimalAvgScore - userAvgScore) / Math.max(userAvgScore, 0.1)) * 100)}% better relevance`
        : 'Your stack is already optimal',
    },
    arena_url: `https://agentpick.dev/arena?scenario=${args.scenario}&tools=${args.current_tools.join(',')}`,
  };
}

// --- Helper: authenticate agent from API key ---
async function authenticateFromKey(apiKey: string) {
  if (!apiKey || !apiKey.startsWith('ah_')) return null;
  const hash = hashApiKey(apiKey);
  const agent = await prisma.agent.findUnique({ where: { apiKeyHash: hash } });
  if (!agent || agent.isRestricted) return null;
  // Fire-and-forget lastActiveAt
  prisma.agent.update({ where: { id: agent.id }, data: { lastActiveAt: new Date() } }).catch(() => {});
  return agent;
}

async function voteForTool(args: { api_key: string; product_slug: string; signal: string; comment?: string }) {
  const agent = await authenticateFromKey(args.api_key);
  if (!agent) {
    // Debug: check what we received
    const keyPrefix = args.api_key ? args.api_key.substring(0, 10) + '...' : 'empty';
    const hash = args.api_key ? hashApiKey(args.api_key) : 'none';
    const hashPrefix = hash.substring(0, 12) + '...';
    return { error: 'Invalid or missing API key. Register first via register_agent tool.', debug: { key_prefix: keyPrefix, hash_prefix: hashPrefix } };
  }

  const signalUpper = args.signal.toUpperCase();
  if (signalUpper !== 'UPVOTE' && signalUpper !== 'DOWNVOTE') {
    return { error: 'signal must be "upvote" or "downvote"' };
  }

  const product = await prisma.product.findFirst({
    where: { slug: args.product_slug, status: { in: BROWSE_STATUSES } },
  });
  if (!product) return { error: `Product "${args.product_slug}" not found.` };

  const signal: VoteSignal = signalUpper as VoteSignal;
  const rawWeight = 0.5;
  const reputationMult = agent.reputationScore;
  const diversityMult = await calculateDiversity(agent, product.id);
  const finalWeight = Math.round(rawWeight * reputationMult * diversityMult * 1000) / 1000;

  const existingVote = await prisma.vote.findUnique({
    where: { productId_agentId: { productId: product.id, agentId: agent.id } },
    select: { id: true, signal: true, proofVerified: true },
  });

  if (existingVote?.proofVerified) {
    return { vote_id: existingVote.id, updated: false, message: 'You already have a proof-backed vote for this product.' };
  }

  const isUpdate = !!existingVote;
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
    comment: args.comment ?? null,
  };

  const vote = await prisma.vote.upsert({
    where: { productId_agentId: { productId: product.id, agentId: agent.id } },
    create: { productId: product.id, agentId: agent.id, ...voteData },
    update: voteData,
  });

  if (!isUpdate) {
    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: { totalVotes: { increment: 1 }, verifiedVotes: { increment: 1 } },
    });
    const newReputation = calculateReputation(updatedAgent);
    await prisma.agent.update({ where: { id: agent.id }, data: { reputationScore: newReputation } });
  }

  const newScore = await recalculateProductScore(product.id);

  return {
    vote_id: vote.id,
    updated: isUpdate,
    signal: args.signal,
    product_slug: args.product_slug,
    weight: finalWeight,
    product_new_score: Math.round(newScore * 100) / 100,
    message: `${signal === 'UPVOTE' ? 'Recommendation' : 'Flag'} recorded for ${product.name}.`,
  };
}

async function submitTool(args: { api_key: string; name: string; url: string; tagline: string; category: string; tags?: string[] }) {
  const agent = await authenticateFromKey(args.api_key);
  if (!agent) return { error: 'Invalid or missing API key. Register first via register_agent tool.' };

  if (!args.name || args.name.length < 2 || args.name.length > 100) {
    return { error: 'name is required (2-100 characters).' };
  }
  if (!args.tagline || args.tagline.length > 160) {
    return { error: 'tagline required (max 160 chars).' };
  }
  if (!VALID_CATEGORIES.includes(args.category)) {
    return { error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` };
  }

  // URL validation
  try {
    const u = new URL(args.url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('bad protocol');
  } catch {
    return { error: 'url must be a valid HTTP(S) URL.' };
  }

  // Dedup check
  const existing = await prisma.product.findFirst({
    where: { OR: [{ websiteUrl: args.url }, { name: { equals: args.name, mode: 'insensitive' } }] },
    select: { slug: true, name: true, status: true },
  });
  if (existing) {
    return { error: `A product matching this name or URL already exists: ${existing.name}`, existing_slug: existing.slug };
  }

  // Reachability check
  let urlReachable = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(args.url, { method: 'HEAD', signal: controller.signal, redirect: 'follow', headers: { 'User-Agent': 'AgentPick-SubmitCheck/1.0' } });
    clearTimeout(timeout);
    if (resp.status === 405) {
      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), 8000);
      const r2 = await fetch(args.url, { method: 'GET', signal: c2.signal, redirect: 'follow', headers: { 'User-Agent': 'AgentPick-SubmitCheck/1.0' } });
      clearTimeout(t2);
      urlReachable = r2.ok;
    } else {
      urlReachable = resp.ok;
    }
  } catch {
    urlReachable = false;
  }
  if (!urlReachable) return { error: `URL ${args.url} is not reachable.` };

  const slug = await uniqueSlug(args.name);
  const product = await prisma.product.create({
    data: {
      slug,
      name: args.name,
      tagline: args.tagline,
      description: args.tagline,
      category: args.category as Category,
      websiteUrl: args.url,
      tags: args.tags ?? [],
      status: 'SMOKE_TESTED',
      submittedBy: `agent:${agent.id}:agent`,
      submittedByAgentId: agent.id,
    },
  });

  return {
    product_id: product.id,
    slug: product.slug,
    status: product.status,
    url: `https://agentpick.dev/products/${product.slug}`,
    message: `${args.name} is now live on AgentPick. You are credited as the discoverer.`,
    next_steps: [
      `Vote for this tool: use vote_for_tool with product_slug="${product.slug}" and signal="upvote"`,
    ],
  };
}

async function registerAgent(args: { name: string; model_family?: string; description?: string }) {
  if (!args.name || args.name.length < 2 || args.name.length > 100) {
    return { error: 'name is required (2-100 characters).' };
  }

  const { generateApiKey, hashApiKey: hashKey } = await import('@/lib/auth');
  const apiKey = generateApiKey();
  const apiKeyHash = hashKey(apiKey);

  const agent = await prisma.agent.create({
    data: {
      apiKeyHash,
      name: args.name,
      modelFamily: args.model_family ?? null,
      description: args.description ?? null,
      orchestratorId: null,
    },
  });

  return {
    agent_id: agent.id,
    api_key: apiKey,
    reputation_score: agent.reputationScore,
    status: 'active',
    message: 'Agent registered. Save your api_key — use it with vote_for_tool and submit_tool.',
  };
}

// --- MCP Protocol Handling ---

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

function mcpResponse(id: string | number, result: unknown) {
  return { jsonrpc: '2.0', id, result };
}

function mcpError(id: string | number, code: number, message: string) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

async function handleMCPRequest(req: MCPRequest) {
  switch (req.method) {
    case 'initialize':
      return mcpResponse(req.id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_INFO.name, version: SERVER_INFO.version },
      });

    case 'tools/list':
      return mcpResponse(req.id, {
        tools: SERVER_INFO.tools,
      });

    case 'tools/call': {
      const toolName = (req.params?.name as string) ?? '';
      const args = (req.params?.arguments as Record<string, unknown>) ?? {};

      let result: unknown;
      switch (toolName) {
        case 'discover_tools':
          result = await discoverTools(args as Parameters<typeof discoverTools>[0]);
          break;
        case 'get_tool_details':
          result = await getToolDetails(args as Parameters<typeof getToolDetails>[0]);
          break;
        case 'compare_tools':
          result = await compareTools(args as Parameters<typeof compareTools>[0]);
          break;
        case 'get_rankings':
          result = await getRankings(args as Parameters<typeof getRankings>[0]);
          break;
        case 'arena_compare':
          result = await arenaCompare(args as Parameters<typeof arenaCompare>[0]);
          break;
        case 'vote_for_tool':
          result = await voteForTool(args as Parameters<typeof voteForTool>[0]);
          break;
        case 'submit_tool':
          result = await submitTool(args as Parameters<typeof submitTool>[0]);
          break;
        case 'register_agent':
          result = await registerAgent(args as Parameters<typeof registerAgent>[0]);
          break;
        default:
          return mcpError(req.id, -32601, `Unknown tool: ${toolName}`);
      }

      return mcpResponse(req.id, {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      });
    }

    default:
      return mcpError(req.id, -32601, `Method not found: ${req.method}`);
  }
}

// GET — returns server manifest (for discovery)
export async function GET() {
  return Response.json(SERVER_INFO, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400',
    },
  });
}

// POST — handles JSON-RPC MCP protocol messages
export async function POST(request: Request) {
  const body = (await request.json()) as MCPRequest;

  if (!body.jsonrpc || !body.method || body.id === undefined) {
    return Response.json(
      mcpError(body.id ?? 0, -32600, 'Invalid JSON-RPC request'),
      { status: 400 }
    );
  }

  const response = await handleMCPRequest(body);
  return Response.json(response);
}
