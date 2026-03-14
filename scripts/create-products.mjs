// Create product entries for new tools that don't already exist
// Run: node scripts/create-products.mjs

import pg from 'pg';
const { Client } = pg;

const NEW_PRODUCTS = [
  // Search
  {
    slug: 'perplexity-search', name: 'Perplexity Search', tagline: 'AI search with citations and grounded answers',
    description: 'Search API that returns AI-generated answers with inline citations. Uses Sonar model for real-time web search.',
    category: 'search_research', tags: ['search', 'citations', 'AI'], websiteUrl: 'https://perplexity.ai',
    apiBaseUrl: 'https://api.perplexity.ai', status: 'SMOKE_TESTED',
  },
  {
    slug: 'you-search', name: 'You.com Search', tagline: 'Web search API with AI snippets',
    description: 'Web search API returning structured results with AI-generated snippets. Good for general-purpose search queries.',
    category: 'search_research', tags: ['search', 'web', 'AI'], websiteUrl: 'https://you.com',
    apiBaseUrl: 'https://api.ydc-index.io', status: 'SUBMITTED',
  },
  {
    slug: 'serpapi-google', name: 'SerpAPI Google', tagline: 'Structured Google SERP results via API',
    description: 'Get structured JSON results from Google search. Real-time SERP data with location targeting and rich snippets.',
    category: 'search_research', tags: ['search', 'google', 'SERP'], websiteUrl: 'https://serpapi.com',
    apiBaseUrl: 'https://serpapi.com', status: 'SMOKE_TESTED',
  },
  {
    slug: 'bing-web-search', name: 'Bing Web Search', tagline: 'Azure Cognitive Services web search API',
    description: 'Microsoft Bing search API through Azure Cognitive Services. Web, image, video, and news search endpoints.',
    category: 'search_research', tags: ['search', 'bing', 'azure'], websiteUrl: 'https://azure.microsoft.com',
    apiBaseUrl: 'https://api.bing.microsoft.com', status: 'SUBMITTED',
  },
  // Crawling
  {
    slug: 'apify', name: 'Apify', tagline: 'Web scraping and automation platform',
    description: 'Full-featured web scraping platform with pre-built actors. Proxy management, scheduling, and result storage included.',
    category: 'web_crawling', tags: ['scraping', 'automation', 'actors'], websiteUrl: 'https://apify.com',
    apiBaseUrl: 'https://api.apify.com', status: 'SMOKE_TESTED',
  },
  {
    slug: 'scrapingbee', name: 'ScrapingBee', tagline: 'Web scraping API with JS rendering',
    description: 'Handles JavaScript rendering, proxy rotation, and CAPTCHAs automatically. Simple API for extracting data from any website.',
    category: 'web_crawling', tags: ['scraping', 'rendering', 'proxy'], websiteUrl: 'https://scrapingbee.com',
    apiBaseUrl: 'https://app.scrapingbee.com/api', status: 'SMOKE_TESTED',
  },
  {
    slug: 'browserbase', name: 'Browserbase', tagline: 'Headless browser infrastructure for AI agents',
    description: 'Cloud browser sessions for AI agents. Create sessions, navigate pages, and extract content with full JS rendering.',
    category: 'web_crawling', tags: ['browser', 'headless', 'sessions'], websiteUrl: 'https://browserbase.com',
    apiBaseUrl: 'https://www.browserbase.com/v1', status: 'SMOKE_TESTED',
  },
  // Finance Data
  {
    slug: 'polygon-io', name: 'Polygon.io', tagline: 'Real-time and historical stock market data',
    description: 'Comprehensive financial data API with real-time quotes, historical aggregates, and reference data for stocks, options, forex, and crypto.',
    category: 'finance_data', tags: ['stocks', 'market-data', 'real-time'], websiteUrl: 'https://polygon.io',
    apiBaseUrl: 'https://api.polygon.io', status: 'SMOKE_TESTED',
  },
  {
    slug: 'alpha-vantage', name: 'Alpha Vantage', tagline: 'Free stock and forex time series data',
    description: 'Free financial data API with time series for stocks, forex, and crypto. Daily, weekly, and monthly intervals with technical indicators.',
    category: 'finance_data', tags: ['stocks', 'time-series', 'free'], websiteUrl: 'https://alphavantage.co',
    apiBaseUrl: 'https://www.alphavantage.co', status: 'SMOKE_TESTED',
  },
  {
    slug: 'financial-modeling-prep', name: 'Financial Modeling Prep', tagline: 'Stock quotes and financial fundamentals API',
    description: 'Financial data API with real-time quotes, financial statements, DCF valuations, and company profiles for global markets.',
    category: 'finance_data', tags: ['quotes', 'fundamentals', 'DCF'], websiteUrl: 'https://financialmodelingprep.com',
    apiBaseUrl: 'https://financialmodelingprep.com/api', status: 'SUBMITTED',
  },
  // Embedding
  {
    slug: 'openai-embed', name: 'OpenAI Embeddings', tagline: 'Text embeddings via text-embedding-3-small/large',
    description: 'High-quality text embeddings from OpenAI. text-embedding-3-small for cost efficiency, text-embedding-3-large for maximum quality.',
    category: 'storage_memory', tags: ['embeddings', 'vector', 'retrieval'], websiteUrl: 'https://openai.com',
    apiBaseUrl: 'https://api.openai.com', status: 'SMOKE_TESTED',
  },
  {
    slug: 'cohere-embed', name: 'Cohere Embed', tagline: 'Multilingual embeddings optimized for search',
    description: 'embed-english-v3.0 and embed-multilingual-v3.0 models optimized for search, classification, and clustering tasks.',
    category: 'storage_memory', tags: ['embeddings', 'multilingual', 'search'], websiteUrl: 'https://cohere.com',
    apiBaseUrl: 'https://api.cohere.com', status: 'SMOKE_TESTED',
  },
  {
    slug: 'voyage-embed', name: 'Voyage Embeddings', tagline: 'High-precision embeddings for retrieval',
    description: 'State-of-the-art embedding models from Voyage AI. Domain-specific models for code, legal, and finance with superior retrieval quality.',
    category: 'storage_memory', tags: ['embeddings', 'retrieval', 'precision'], websiteUrl: 'https://voyageai.com',
    apiBaseUrl: 'https://api.voyageai.com', status: 'SMOKE_TESTED',
  },
  {
    slug: 'jina-embed', name: 'Jina Embeddings', tagline: 'Multilingual embeddings with 8K context',
    description: 'jina-embeddings-v3 with 8192-token context and 100+ language support. Optimized for text matching, retrieval, and classification.',
    category: 'storage_memory', tags: ['embeddings', 'multilingual', 'long-context'], websiteUrl: 'https://jina.ai',
    apiBaseUrl: 'https://api.jina.ai', status: 'SMOKE_TESTED',
  },
];

async function main() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_g96RWjzqdQnM@ep-bitter-night-aktik9f9.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require',
  });
  await client.connect();
  console.log('Connected to Neon DB');

  for (const p of NEW_PRODUCTS) {
    try {
      // Check if product already exists
      const existing = await client.query('SELECT slug FROM "Product" WHERE slug = $1', [p.slug]);
      if (existing.rows.length > 0) {
        console.log(`  SKIP ${p.slug} — already exists`);
        continue;
      }

      await client.query(`
        INSERT INTO "Product" (id, slug, name, tagline, description, category, tags, "websiteUrl", "apiBaseUrl", status, "weightedScore", "totalVotes", "successRate", "avgLatencyMs", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5::text::"Category", $6, $7, $8, $9::"ProductStatus", 0, 0, NULL, NULL, NOW(), NOW())
      `, [p.slug, p.name, p.tagline, p.description, p.category, p.tags, p.websiteUrl, p.apiBaseUrl, p.status]);
      console.log(`  OK ${p.slug} (${p.category})`);
    } catch (err) {
      console.error(`  FAIL ${p.slug}:`, err.message);
    }
  }

  await client.end();
  console.log('Done.');
}

main().catch(console.error);
