import { prisma } from "./prisma";

const db = prisma as any;

/**
 * Increment usedThisMonth on a vault key. If the month has changed since
 * the last increment (detected via updatedAt), reset to 1 instead.
 * Fire-and-forget — callers should not await this in the hot path.
 */
export async function trackVaultUsage(service: string) {
  try {
    const record = await db.apiKeyVault.findUnique({ where: { service } });
    if (!record) return;

    const now = new Date();
    const lastUpdate = record.updatedAt ? new Date(record.updatedAt) : now;
    const monthChanged =
      now.getUTCFullYear() !== lastUpdate.getUTCFullYear() ||
      now.getUTCMonth() !== lastUpdate.getUTCMonth();

    await db.apiKeyVault.update({
      where: { service },
      data: {
        usedThisMonth: monthChanged ? 1 : (record.usedThisMonth ?? 0) + 1,
      },
    });
  } catch {
    // Silently swallow — usage tracking must never break a benchmark run
  }
}

/** Map any slug variant to its vault service name. */
const SLUG_TO_VAULT_SERVICE: Record<string, string> = {
  // Search
  tavily: "tavily",
  "exa-search": "exa",
  exa: "exa",
  serpapi: "serper",
  serper: "serper",
  "serper-api": "serper",
  "jina-ai": "jina",
  jina: "jina",
  "jina-reader": "jina",
  firecrawl: "firecrawl",
  "firecrawl-api": "firecrawl",
  brave: "brave",
  "brave-search": "brave",
  "perplexity-search": "perplexity",
  perplexity: "perplexity",
  "you-search": "you",
  you: "you",
  "serpapi-google": "serpapi",
  "bing-web-search": "bing",
  bing: "bing",
  // Crawling
  apify: "apify",
  "apify-scraper": "apify",
  scrapingbee: "scrapingbee",
  "scrapingbee-api": "scrapingbee",
  browserbase: "browserbase",
  "browserbase-api": "browserbase",
  // Finance
  polygon: "polygon",
  "polygon-io": "polygon",
  alphavantage: "alphavantage",
  "alpha-vantage": "alphavantage",
  fmp: "fmp",
  "financial-modeling-prep": "fmp",
  // Embedding
  "openai-embed": "openai",
  "openai-embeddings": "openai",
  "cohere-embed": "cohere",
  "cohere-embeddings": "cohere",
  "voyage-embed": "voyage",
  "voyage-embeddings": "voyage",
  voyage: "voyage",
  "jina-embed": "jina",
  "jina-embeddings": "jina",
  "edenai-embed": "edenai",
  // Code Execution
  e2b: "e2b",
  "e2b-code": "e2b",
  // Communication
  resend: "resend",
  "resend-email": "resend",
  // Translation
  "edenai-translation": "edenai",
  // OCR
  "edenai-ocr": "edenai",
};

/** Resolve a product slug to its vault service name. */
export function vaultServiceForSlug(slug: string): string | undefined {
  return SLUG_TO_VAULT_SERVICE[slug] ?? undefined;
}
