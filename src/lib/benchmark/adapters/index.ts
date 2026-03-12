import type { ToolCallResult } from './types';
import { callTavily } from './tavily';
import { callExa } from './exa';
import { callSerper } from './serper';
import { callBrave } from './brave';
import { callJina } from './jina';
import { callFirecrawl } from './firecrawl';
// New search adapters
import { callPerplexity } from './perplexity';
import { callYou } from './you';
import { callSerpApi } from './serpapi';
import { callBing } from './bing';
// Crawling adapters
import { callApify } from './apify';
import { callScrapingBee } from './scrapingbee';
import { callBrowserbase } from './browserbase';
// Finance data adapters
import { callPolygon } from './polygon';
import { callAlphaVantage } from './alphavantage';
import { callFMP } from './fmp';
// Embedding adapters
import { callOpenAIEmbed } from './openai-embed';
import { callCohereEmbed } from './cohere-embed';
import { callVoyageEmbed } from './voyage-embed';
import { callJinaEmbed } from './jina-embed';

import { trackVaultUsage, vaultServiceForSlug } from '@/lib/ops/usage';

export type { ToolCallResult };

// Maps product slugs (as stored in the Product table) to their API adapter functions.
// Aliases are included so both DB slugs and vault/ops slugs resolve correctly.
const ADAPTERS: Record<string, (query: string, config?: Record<string, unknown>) => Promise<ToolCallResult>> = {
  // === Search ===
  tavily: callTavily,
  'exa-search': callExa,
  serpapi: callSerper,
  'jina-ai': callJina,
  firecrawl: callFirecrawl,
  'perplexity-search': callPerplexity,
  'you-search': callYou,
  'serpapi-google': callSerpApi,
  'bing-web-search': callBing,
  // Search aliases
  exa: callExa,
  serper: callSerper,
  brave: callBrave,
  jina: callJina,
  perplexity: callPerplexity,
  you: callYou,
  bing: callBing,
  'serper-api': callSerper,
  'brave-search': callBrave,
  'jina-reader': callJina,
  'firecrawl-api': callFirecrawl,

  // === Crawling ===
  apify: callApify,
  scrapingbee: callScrapingBee,
  browserbase: callBrowserbase,
  'apify-scraper': callApify,
  'scrapingbee-api': callScrapingBee,
  'browserbase-api': callBrowserbase,

  // === Finance Data ===
  polygon: callPolygon,
  'polygon-io': callPolygon,
  alphavantage: callAlphaVantage,
  'alpha-vantage': callAlphaVantage,
  fmp: callFMP,
  'financial-modeling-prep': callFMP,

  // === Embedding ===
  'openai-embed': callOpenAIEmbed,
  'openai-embeddings': callOpenAIEmbed,
  'cohere-embed': callCohereEmbed,
  'cohere-embeddings': callCohereEmbed,
  'voyage-embed': callVoyageEmbed,
  'voyage-embeddings': callVoyageEmbed,
  voyage: callVoyageEmbed,
  'jina-embed': callJinaEmbed,
  'jina-embeddings': callJinaEmbed,
};

// Product slugs that exist in the Product table AND have working adapters.
export const BENCHMARKABLE_SLUGS = [
  // Search
  'tavily', 'exa-search', 'serpapi', 'jina-ai', 'firecrawl',
  'perplexity-search', 'you-search', 'serpapi-google', 'bing-web-search',
  // Crawling
  'apify', 'scrapingbee', 'browserbase',
  // Finance
  'polygon-io', 'alpha-vantage', 'financial-modeling-prep',
  // Embedding
  'openai-embed', 'cohere-embed', 'voyage-embed', 'jina-embed',
];

export async function callToolAPI(
  slug: string,
  query: string,
  config?: Record<string, unknown>,
): Promise<ToolCallResult> {
  const adapter = ADAPTERS[slug];
  if (!adapter) {
    return {
      statusCode: 501,
      latencyMs: 0,
      resultCount: 0,
      response: { error: `No adapter for ${slug}` },
      costUsd: 0,
    };
  }

  try {
    const result = await adapter(query, config);

    // Fire-and-forget usage tracking — map slug to vault service name
    if (result.statusCode >= 200 && result.statusCode < 500) {
      const vaultService = vaultServiceForSlug(slug);
      if (vaultService) {
        trackVaultUsage(vaultService).catch(() => {});
      }
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      statusCode: 500,
      latencyMs: 0,
      resultCount: 0,
      response: { error: message },
      costUsd: 0,
    };
  }
}

// Maps domains to the product category they belong to
export const DOMAIN_TO_CATEGORY: Record<string, string> = {
  finance: 'finance_data',
  legal: 'search_research',
  healthcare: 'search_research',
  ecommerce: 'search_research',
  devtools: 'search_research',
  education: 'search_research',
  news: 'search_research',
  science: 'search_research',
  general: 'search_research',
  multilingual: 'search_research',
  crawling: 'web_crawling',
  embedding: 'storage_memory',
};

// Maps domains to the task type for telemetry
export const DOMAIN_TO_TASK: Record<string, string> = {
  finance: 'finance_data',
  legal: 'search',
  healthcare: 'search',
  ecommerce: 'search',
  devtools: 'search',
  education: 'search',
  news: 'search',
  science: 'search',
  general: 'search',
  multilingual: 'search',
  crawling: 'crawl',
  embedding: 'embed',
};
