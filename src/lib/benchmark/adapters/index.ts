import type { ToolCallResult } from './types';
import { callTavily } from './tavily';
import { callExa } from './exa';
import { callSerper } from './serper';
import { callBrave } from './brave';
import { callJina } from './jina';
import { callFirecrawl } from './firecrawl';
import { trackVaultUsage, vaultServiceForSlug } from '@/lib/ops/usage';

export type { ToolCallResult };

// Maps product slugs to their API adapter functions
const ADAPTERS: Record<string, (query: string, config?: Record<string, unknown>) => Promise<ToolCallResult>> = {
  tavily: callTavily,
  'exa-search': callExa,
  'serper-api': callSerper,
  'brave-search': callBrave,
  'jina-reader': callJina,
  'firecrawl-api': callFirecrawl,
};

// Products that have working API adapters (used to filter which products to benchmark)
export const BENCHMARKABLE_SLUGS = Object.keys(ADAPTERS);

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
  finance: 'search_research',
  legal: 'search_research',
  healthcare: 'search_research',
  ecommerce: 'search_research',
  devtools: 'search_research',
  education: 'search_research',
  news: 'search_research',
  science: 'search_research',
  general: 'search_research',
  multilingual: 'search_research',
};

// Maps domains to the task type for telemetry
export const DOMAIN_TO_TASK: Record<string, string> = {
  finance: 'search',
  legal: 'search',
  healthcare: 'search',
  ecommerce: 'search',
  devtools: 'search',
  education: 'search',
  news: 'search',
  science: 'search',
  general: 'search',
  multilingual: 'search',
};
