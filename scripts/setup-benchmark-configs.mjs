// Create BenchmarkAgentConfig records for new domains and trigger test runs
import pg from 'pg';
const { Client } = pg;

const CONFIGS = [
  // Finance Data agents
  {
    name: 'benchmark-findata-claude-01', domain: 'finance_data', subdomain: 'quotes',
    modelProvider: 'anthropic', modelName: 'claude-sonnet-4',
    toolSlugs: ['polygon-io', 'alpha-vantage', 'financial-modeling-prep'],
    complexity: ['simple', 'medium', 'complex'],
  },
  {
    name: 'benchmark-findata-gpt-01', domain: 'finance_data', subdomain: 'historical',
    modelProvider: 'openai', modelName: 'gpt-4o',
    toolSlugs: ['polygon-io', 'alpha-vantage', 'financial-modeling-prep'],
    complexity: ['simple', 'medium', 'complex'],
  },
  // Crawling agents
  {
    name: 'benchmark-crawl-claude-01', domain: 'crawling', subdomain: 'js-rendered',
    modelProvider: 'anthropic', modelName: 'claude-sonnet-4',
    toolSlugs: ['apify', 'scrapingbee', 'browserbase', 'firecrawl', 'jina-ai'],
    complexity: ['simple', 'medium', 'complex'],
  },
  // Embedding agents
  {
    name: 'benchmark-embed-claude-01', domain: 'embedding', subdomain: 'passage-embed',
    modelProvider: 'anthropic', modelName: 'claude-sonnet-4',
    toolSlugs: ['openai-embed', 'cohere-embed', 'voyage-embed', 'jina-embed'],
    complexity: ['simple', 'medium'],
  },
  {
    name: 'benchmark-embed-gpt-01', domain: 'embedding', subdomain: 'retrieval',
    modelProvider: 'openai', modelName: 'gpt-4o',
    toolSlugs: ['openai-embed', 'cohere-embed', 'voyage-embed', 'jina-embed'],
    complexity: ['simple', 'medium'],
  },
];

// Also update existing finance agents to add new finance tools
const FINANCE_TOOL_ADDITIONS = ['polygon-io', 'alpha-vantage', 'financial-modeling-prep'];
const SEARCH_TOOL_ADDITIONS = ['perplexity-search', 'serpapi-google'];
const CRAWL_TOOL_ADDITIONS = ['apify', 'scrapingbee', 'browserbase'];

async function main() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_g96RWjzqdQnM@ep-bitter-night-aktik9f9.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require',
  });
  await client.connect();
  console.log('Connected to Neon DB');

  // 1. Create new configs
  for (const cfg of CONFIGS) {
    try {
      // First create an Agent record
      const agentId = `agent_${cfg.name}_${Date.now()}`;
      await client.query(`
        INSERT INTO "Agent" (id, "name", "apiKeyHash", "reputationScore", "modelFamily", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 0.5, $4, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET "updatedAt" = NOW()
        RETURNING id
      `, [agentId, cfg.name, `hash_${cfg.name}`, cfg.modelProvider === 'anthropic' ? 'Claude' : cfg.modelProvider === 'openai' ? 'GPT-4' : 'Gemini']);

      // Get the agent ID (might be existing)
      const agentRes = await client.query('SELECT id FROM "Agent" WHERE name = $1', [cfg.name]);
      const realAgentId = agentRes.rows[0]?.id || agentId;

      // Create config
      const configId = `cfg_${cfg.name}_${Date.now()}`;
      await client.query(`
        INSERT INTO "BenchmarkAgentConfig" (
          id, "agentId", "displayName", domain, subdomain,
          "modelProvider", "modelName", "modelApiKey", "evaluatorModel",
          "testFrequency", "queriesPerRun", "toolsPerQuery", complexity,
          "toolSlugs", "toolApiKeys",
          "isActive", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, '', 'claude-sonnet-4', 'every_2h', 3, 4, $8, $9, '{}'::jsonb, true, NOW(), NOW())
        ON CONFLICT ("agentId") DO UPDATE SET
          "toolSlugs" = $9, domain = $4, subdomain = $5, "updatedAt" = NOW()
      `, [configId, realAgentId, cfg.name, cfg.domain, cfg.subdomain,
          cfg.modelProvider, cfg.modelName, cfg.complexity, cfg.toolSlugs]);
      console.log(`  OK ${cfg.name} (${cfg.domain})`);
    } catch (err) {
      console.error(`  FAIL ${cfg.name}:`, err.message);
    }
  }

  // 2. Update existing finance agents to include new finance tools
  console.log('\nUpdating existing agent tool lists...');
  const finAgents = await client.query(`
    SELECT id, "displayName", "toolSlugs" FROM "BenchmarkAgentConfig"
    WHERE domain = 'finance' AND "isActive" = true
  `);
  for (const agent of finAgents.rows) {
    const currentSlugs = agent.toolSlugs || [];
    const newSlugs = [...new Set([...currentSlugs, ...FINANCE_TOOL_ADDITIONS])];
    await client.query('UPDATE "BenchmarkAgentConfig" SET "toolSlugs" = $1, "updatedAt" = NOW() WHERE id = $2', [newSlugs, agent.id]);
    console.log(`  Updated finance agent ${agent.displayName}: +${FINANCE_TOOL_ADDITIONS.length} tools`);
  }

  // Update general/search agents
  const searchAgents = await client.query(`
    SELECT id, "displayName", "toolSlugs" FROM "BenchmarkAgentConfig"
    WHERE domain IN ('general', 'news', 'devtools') AND "isActive" = true
  `);
  for (const agent of searchAgents.rows) {
    const currentSlugs = agent.toolSlugs || [];
    const newSlugs = [...new Set([...currentSlugs, ...SEARCH_TOOL_ADDITIONS])];
    await client.query('UPDATE "BenchmarkAgentConfig" SET "toolSlugs" = $1, "updatedAt" = NOW() WHERE id = $2', [newSlugs, agent.id]);
    console.log(`  Updated search agent ${agent.displayName}: +${SEARCH_TOOL_ADDITIONS.length} tools`);
  }

  await client.end();
  console.log('\nDone.');
}

main().catch(console.error);
