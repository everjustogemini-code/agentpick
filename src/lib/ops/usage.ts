import { prisma } from "./prisma";
import { withRetry } from "@/lib/prisma";

const db = prisma as any;

/**
 * Increment usedThisMonth on a vault key. If the month has changed since
 * the last increment (detected via updatedAt), reset to 1 instead.
 * Fire-and-forget — callers should not await this in the hot path.
 */
export async function trackVaultUsage(service: string) {
  try {
    // withRetry: findUnique can fail with P1017/fetch-failed when called after a
    // long external tool API call invalidates the Neon HTTP connection. Without
    // withRetry the Prisma singleton is NOT cleared on failure, leaving it stale
    // for subsequent withRetry-wrapped calls in the same serverless instance (e.g.
    // recordTrace's product.findUnique). The stale singleton then forces an extra
    // retry cycle in those calls, wasting one of the three retry slots.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await withRetry(() => db.apiKeyVault.findUnique({ where: { service } })) as any;
    if (!record) return;

    const now = new Date();
    const lastUpdate = record.updatedAt ? new Date(record.updatedAt) : now;
    const monthChanged =
      now.getUTCFullYear() !== lastUpdate.getUTCFullYear() ||
      now.getUTCMonth() !== lastUpdate.getUTCMonth();

    // withRetry: same P1017/fetch-failed transient error pattern as findUnique above.
    await withRetry(() => db.apiKeyVault.update({
      where: { service },
      data: {
        usedThisMonth: monthChanged ? 1 : (record.usedThisMonth ?? 0) + 1,
      },
    }));
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
  serpapi: "serpapi",
  "serpapi-google": "serpapi",
  serper: "serper",
  "serper-api": "serper",
  "jina-ai": "jina",
  jina: "jina",
  "jina-reader": "jina",
  firecrawl: "firecrawl",
  "firecrawl-api": "firecrawl",
  brave: "brave",
  "brave-search": "brave",
  "perplexity-api": "perplexity",
  "perplexity-search": "perplexity",
  perplexity: "perplexity",
  "you-search": "you",
  you: "you",
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
  "voyage-ai": "voyage",
  "voyage-embed": "voyage", // backward-compat alias
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
