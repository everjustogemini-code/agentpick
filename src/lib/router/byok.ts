import { prisma, withRetry } from '@/lib/prisma';
import { decryptSecret, encryptSecret } from '@/lib/ops/crypto';
import { vaultServiceForSlug } from '@/lib/ops/usage';

const db = prisma;

export type ByokKeyStatus = 'active' | 'inactive';

type ByokServiceDefinition = {
  service: string;
  displayName: string;
  envVar: string;
  placeholder: string;
};

type StoredByokKey = {
  service: string;
  displayName: string;
  encryptedKey: string;
  keyPreview: string;
  status: ByokKeyStatus;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
};

type StoredByokMap = Record<string, StoredByokKey>;

export type ByokKeyListItem = Omit<StoredByokKey, 'encryptedKey'>;

export const BYOK_SERVICE_CATALOG: ByokServiceDefinition[] = [
  { service: 'exa', displayName: 'Exa', envVar: 'EXA_API_KEY', placeholder: 'exa_...' },
  { service: 'tavily', displayName: 'Tavily', envVar: 'TAVILY_API_KEY', placeholder: 'tvly-...' },
  { service: 'serper', displayName: 'Serper', envVar: 'SERPER_API_KEY', placeholder: 'serper_...' },
  { service: 'serpapi', displayName: 'SerpApi', envVar: 'SERPAPI_KEY', placeholder: 'serpapi_...' },
  { service: 'brave', displayName: 'Brave Search', envVar: 'BRAVE_API_KEY', placeholder: 'BSA_...' },
  { service: 'jina', displayName: 'Jina AI', envVar: 'JINA_API_KEY', placeholder: 'jina_...' },
  { service: 'firecrawl', displayName: 'Firecrawl', envVar: 'FIRECRAWL_API_KEY', placeholder: 'fc_...' },
  { service: 'perplexity', displayName: 'Perplexity', envVar: 'PERPLEXITY_API_KEY', placeholder: 'pplx_...' },
  { service: 'you', displayName: 'You.com', envVar: 'YOU_API_KEY', placeholder: 'you_...' },
  { service: 'bing', displayName: 'Bing Search', envVar: 'BING_API_KEY', placeholder: 'bing_...' },
  { service: 'apify', displayName: 'Apify', envVar: 'APIFY_API_KEY', placeholder: 'apify_api_...' },
  { service: 'scrapingbee', displayName: 'ScrapingBee', envVar: 'SCRAPINGBEE_API_KEY', placeholder: 'scrapingbee_...' },
  { service: 'browserbase', displayName: 'Browserbase', envVar: 'BROWSERBASE_API_KEY', placeholder: 'bb_live_...' },
  { service: 'polygon', displayName: 'Polygon', envVar: 'POLYGON_API_KEY', placeholder: 'polygon_...' },
  { service: 'alphavantage', displayName: 'Alpha Vantage', envVar: 'ALPHAVANTAGE_API_KEY', placeholder: 'alpha_...' },
  { service: 'fmp', displayName: 'Financial Modeling Prep', envVar: 'FMP_API_KEY', placeholder: 'fmp_...' },
  { service: 'openai', displayName: 'OpenAI Embeddings', envVar: 'OPENAI_API_KEY', placeholder: 'sk-...' },
  { service: 'cohere', displayName: 'Cohere Embeddings', envVar: 'COHERE_API_KEY', placeholder: 'co_...' },
  { service: 'voyage', displayName: 'Voyage AI', envVar: 'VOYAGE_API_KEY', placeholder: 'pa-...' },
  { service: 'e2b', displayName: 'E2B Code Execution', envVar: 'E2B_API_KEY', placeholder: 'e2b_...' },
  { service: 'resend', displayName: 'Resend Email', envVar: 'RESEND_API_KEY', placeholder: 're_...' },
  { service: 'edenai', displayName: 'Eden AI', envVar: 'EDENAI_API_KEY', placeholder: 'eden_...' },
];

const BYOK_SERVICE_MAP = Object.fromEntries(
  BYOK_SERVICE_CATALOG.map((service) => [service.service, service]),
) as Record<string, ByokServiceDefinition>;

function maskKey(value: string) {
  if (!value) return '';
  if (value.length <= 10) return `${value.slice(0, 2)}...${value.slice(-2)}`;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function coerceStatus(value: unknown): ByokKeyStatus {
  return value === 'inactive' ? 'inactive' : 'active';
}

export function normalizeByokService(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  const catalogMatch = BYOK_SERVICE_MAP[normalized];
  if (catalogMatch) return catalogMatch.service;

  const vaultService = vaultServiceForSlug(normalized);
  if (vaultService && BYOK_SERVICE_MAP[vaultService]) {
    return vaultService;
  }

  return null;
}

export function getByokServiceDefinition(service: string) {
  const normalized = normalizeByokService(service);
  return normalized ? BYOK_SERVICE_MAP[normalized] : null;
}

export function getByokEnvVarForService(service: string) {
  return getByokServiceDefinition(service)?.envVar ?? null;
}

export function parseByokKeys(raw: unknown): StoredByokMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const parsed: StoredByokMap = {};

  for (const [service, value] of Object.entries(raw as Record<string, unknown>)) {
    const normalizedService = normalizeByokService(service);
    if (!normalizedService || !value || typeof value !== 'object' || Array.isArray(value)) {
      continue;
    }

    const record = value as Partial<StoredByokKey>;
    if (typeof record.encryptedKey !== 'string' || record.encryptedKey.length === 0) {
      continue;
    }

    const definition = BYOK_SERVICE_MAP[normalizedService];
    parsed[normalizedService] = {
      service: normalizedService,
      displayName: typeof record.displayName === 'string' && record.displayName.trim().length > 0
        ? record.displayName
        : definition.displayName,
      encryptedKey: record.encryptedKey,
      keyPreview: typeof record.keyPreview === 'string' && record.keyPreview.trim().length > 0
        ? record.keyPreview
        : maskKey(decryptSecret(record.encryptedKey)),
      status: coerceStatus(record.status),
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString(),
      lastUsedAt: typeof record.lastUsedAt === 'string' ? record.lastUsedAt : null,
    };
  }

  return parsed;
}

export function listByokKeys(raw: unknown): ByokKeyListItem[] {
  const parsed = parseByokKeys(raw);
  return Object.values(parsed)
    .map((record) => {
      const { encryptedKey, ...item } = record;
      void encryptedKey;
      return item;
    })
    .sort((left, right) => left.displayName.localeCompare(right.displayName));
}

export function getByokCatalog() {
  return BYOK_SERVICE_CATALOG.map(({ service, displayName, placeholder }) => ({
    service,
    displayName,
    placeholder,
  }));
}

export async function saveByokKey(
  developerId: string,
  rawKeys: unknown,
  input: {
    service: string;
    apiKey: string;
    status?: ByokKeyStatus;
  },
) {
  const service = normalizeByokService(input.service);
  if (!service) {
    throw new Error('Unsupported BYOK service.');
  }

  const trimmedApiKey = input.apiKey.trim();
  if (trimmedApiKey.length < 6) {
    throw new Error('API key must be at least 6 characters.');
  }

  const now = new Date().toISOString();
  const existing = parseByokKeys(rawKeys);
  const definition = BYOK_SERVICE_MAP[service];
  const createdAt = existing[service]?.createdAt ?? now;

  existing[service] = {
    service,
    displayName: definition.displayName,
    encryptedKey: encryptSecret(trimmedApiKey),
    keyPreview: maskKey(trimmedApiKey),
    status: input.status ?? existing[service]?.status ?? 'active',
    createdAt,
    updatedAt: now,
    lastUsedAt: existing[service]?.lastUsedAt ?? null,
  };

  // withRetry: developerAccount.update can fail with P1017/fetch-failed after the prior
  // ensureDeveloperAccount call clears the Neon singleton on a transient error. Without
  // retry, saveByokKey throws and the route handler returns a spurious 400 to the user.
  const updated = await withRetry(() => db.developerAccount.update({
    where: { id: developerId },
    data: { byokKeys: existing },
    select: { byokKeys: true },
  }));

  return listByokKeys(updated.byokKeys).find((item) => item.service === service) ?? null;
}

export async function updateByokKey(
  developerId: string,
  rawKeys: unknown,
  input: {
    service: string;
    apiKey?: string;
    status?: ByokKeyStatus;
  },
) {
  const service = normalizeByokService(input.service);
  if (!service) {
    throw new Error('Unsupported BYOK service.');
  }

  const existing = parseByokKeys(rawKeys);
  const current = existing[service];
  if (!current) {
    throw new Error('No saved key found for that service.');
  }

  const nextApiKey = input.apiKey?.trim();
  if (input.apiKey !== undefined && (!nextApiKey || nextApiKey.length < 6)) {
    throw new Error('API key must be at least 6 characters.');
  }

  existing[service] = {
    ...current,
    encryptedKey: nextApiKey ? encryptSecret(nextApiKey) : current.encryptedKey,
    keyPreview: nextApiKey ? maskKey(nextApiKey) : current.keyPreview,
    status: input.status ?? current.status,
    updatedAt: new Date().toISOString(),
  };

  // withRetry: same transient P1017/fetch-failed pattern as saveByokKey.
  const updated = await withRetry(() => db.developerAccount.update({
    where: { id: developerId },
    data: { byokKeys: existing },
    select: { byokKeys: true },
  }));

  return listByokKeys(updated.byokKeys).find((item) => item.service === service) ?? null;
}

export async function deleteByokKey(developerId: string, rawKeys: unknown, service: string) {
  const normalizedService = normalizeByokService(service);
  if (!normalizedService) {
    throw new Error('Unsupported BYOK service.');
  }

  const existing = parseByokKeys(rawKeys);
  if (!existing[normalizedService]) {
    return false;
  }

  delete existing[normalizedService];

  // withRetry: same transient P1017/fetch-failed pattern as saveByokKey.
  await withRetry(() => db.developerAccount.update({
    where: { id: developerId },
    data: { byokKeys: existing },
  }));

  return true;
}

export function resolveStoredByokKeyForSlug(rawKeys: unknown, slug: string) {
  const service = normalizeByokService(vaultServiceForSlug(slug) ?? slug);
  if (!service) {
    return null;
  }

  const parsed = parseByokKeys(rawKeys);
  const record = parsed[service];
  if (!record || record.status !== 'active') {
    return null;
  }

  return {
    service,
    apiKey: decryptSecret(record.encryptedKey),
    keyPreview: record.keyPreview,
  };
}

export async function touchByokKeyUsage(developerId: string, rawKeys: unknown, slug: string) {
  const service = normalizeByokService(vaultServiceForSlug(slug) ?? slug);
  if (!service) return;

  const parsed = parseByokKeys(rawKeys);
  const record = parsed[service];
  if (!record) return;

  parsed[service] = {
    ...record,
    lastUsedAt: new Date().toISOString(),
    updatedAt: record.updatedAt,
  };

  await db.developerAccount.update({
    where: { id: developerId },
    data: { byokKeys: parsed },
  });
}

export async function getByokSummary(developerId: string, rawKeys: unknown, days = 30) {
  const keys = listByokKeys(rawKeys);
  const since = new Date();
  since.setDate(since.getDate() - days);

  // withRetry: aggregate and findFirst can fail with P1017/fetch-failed after the prior
  // ensureDeveloperAccount call clears the Neon singleton. Without retry, getByokSummary
  // throws and the keys GET/POST/PATCH/DELETE handlers return a spurious 500 to the user.
  const [aggregate, latestCall] = await Promise.all([
    withRetry(() => db.routerCall.aggregate({
      where: {
        developerId,
        byokUsed: true,
        createdAt: { gte: since },
      },
      _count: { _all: true },
      _sum: { costUsd: true },
    })),
    withRetry(() => db.routerCall.findFirst({
      where: {
        developerId,
        byokUsed: true,
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, toolUsed: true },
    })),
  ]);

  return {
    activeKeys: keys.filter((key) => key.status === 'active').length,
    totalKeys: keys.length,
    services: keys.map((key) => key.service),
    estimatedSavingsUsd: Number((aggregate._sum.costUsd ?? 0).toFixed(4)),
    byokCalls: aggregate._count._all ?? 0,
    lastByokAt: latestCall?.createdAt?.toISOString() ?? null,
    lastToolUsed: latestCall?.toolUsed ?? null,
  };
}
