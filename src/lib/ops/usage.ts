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

/** Map adapter slugs (e.g. "exa-search") to vault service names (e.g. "exa"). */
const SLUG_TO_VAULT_SERVICE: Record<string, string> = {
  tavily: "tavily",
  "exa-search": "exa",
  "serper-api": "serper",
  "brave-search": "brave",
  "jina-reader": "jina",
  "firecrawl-api": "firecrawl",
};

/** Resolve a product slug to its vault service name. */
export function vaultServiceForSlug(slug: string): string | undefined {
  return SLUG_TO_VAULT_SERVICE[slug] ?? undefined;
}
