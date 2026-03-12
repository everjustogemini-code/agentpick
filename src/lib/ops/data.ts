import { ensureAgentIdentity, listAgentDirectory } from "./agent-adapter";
import { DEFAULT_DISTRIBUTION, DEFAULT_EVALUATOR_MODEL, DEFAULT_QUERYSET_SIZE, DOMAIN_DEFINITIONS, FREQUENCY_OPTIONS } from "./constants";
import { decryptSecret, encryptSecret } from "./crypto";
import { prisma } from "./prisma";
import { probeVaultKey } from "./service-probes";
import type {
  AgentListItem,
  ApiKeyVaultSnapshot,
  CreateAgentInput,
  DashboardSnapshot,
  OpsSettingsSnapshot,
  QueryItem,
  QuerySetSnapshot,
  SaveApiKeyInput,
  SaveQuerySetInput,
  SeedBlueprint,
  StatusSnapshot,
  UpdateAgentInput,
  BenchmarkRunSnapshot,
} from "./types";
import {
  buildBenchmarkDisplayName,
  buildDefaultDescription,
  findDomain,
  findModel,
  formatPercent,
  formatRelativeTime,
  getDefaultEvaluatorModel,
  getFrequencyMs,
  maskSecret,
  normalizeDisplayName,
  pickDefaultSubdomain,
  startOfToday,
} from "./utils";

const db = prisma as any;

function serializeRun(record: any): BenchmarkRunSnapshot {
  return {
    id: record.id,
    configId: record.configId,
    configDisplayName: record.config?.displayName ?? "Unknown agent",
    startedAt: record.startedAt.toISOString(),
    completedAt: record.completedAt?.toISOString() ?? null,
    status: record.status,
    error: record.error ?? null,
    queriesRun: record.queriesRun ?? 0,
    toolsTested: record.toolsTested ?? 0,
    testsCompleted: record.testsCompleted ?? 0,
    avgRelevance: record.avgRelevance ?? null,
    avgLatencyMs: record.avgLatencyMs ?? null,
    successRate: record.successRate ?? null,
    results: Array.isArray(record.results) ? record.results : [],
  };
}

function serializeApiKey(record: any): ApiKeyVaultSnapshot {
  const decrypted = decryptSecret(record.apiKey ?? "");
  return {
    id: record.id,
    service: record.service,
    displayName: record.displayName,
    tier: record.tier,
    monthlyLimit: record.monthlyLimit ?? null,
    usedThisMonth: record.usedThisMonth ?? 0,
    status: record.status,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    notes: record.notes ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    keyPreview: maskSecret(decrypted),
  };
}

function serializeQuerySet(record: any): QuerySetSnapshot {
  return {
    id: record.id,
    name: record.name,
    domain: record.domain,
    description: record.description ?? null,
    version: record.version ?? 1,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    queries: Array.isArray(record.queries) ? record.queries : [],
  };
}

function serializeConfig(record: any): AgentListItem {
  return {
    id: record.id,
    agentId: record.agentId,
    displayName: record.displayName,
    domain: record.domain,
    subdomain: record.subdomain ?? null,
    description: record.description ?? null,
    modelProvider: record.modelProvider,
    modelName: record.modelName,
    evaluatorModel: record.evaluatorModel,
    testFrequency: record.testFrequency,
    queriesPerRun: record.queriesPerRun,
    toolsPerQuery: record.toolsPerQuery,
    complexity: Array.isArray(record.complexity) ? record.complexity : [],
    toolSlugs: Array.isArray(record.toolSlugs) ? record.toolSlugs : [],
    querySetId: record.querySetId ?? null,
    customQueries: Array.isArray(record.customQueries) ? record.customQueries : [],
    isActive: record.isActive,
    lastRunAt: record.lastRunAt?.toISOString() ?? null,
    lastRunSuccess: typeof record.lastRunSuccess === "boolean" ? record.lastRunSuccess : null,
    totalRuns: record.totalRuns ?? 0,
    totalTests: record.totalTests ?? 0,
    avgSuccessRate: record.avgSuccessRate ?? null,
    consecutiveFails: record.consecutiveFails ?? 0,
    openclawEnabled: record.openclawEnabled ?? false,
    openclawConfig: record.openclawConfig ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    recentRuns: Array.isArray(record.runs) ? record.runs.map(serializeRun) : [],
  };
}

async function getVaultRecordByService(service: string) {
  return db.apiKeyVault.findUnique({ where: { service } });
}

async function resolveEncryptedToolKeys(toolSlugs: string[]) {
  const toolApiKeys: Record<string, string> = {};

  for (const slug of toolSlugs) {
    const record = await getVaultRecordByService(slug === "exa" ? "exa" : slug);
    if (record?.apiKey) {
      toolApiKeys[slug] = record.apiKey;
    }
  }

  return toolApiKeys;
}

async function resolveEncryptedModelKey(modelProvider: string) {
  const record = await getVaultRecordByService(modelProvider);
  return record?.apiKey ?? "";
}

export async function ensureOpsSettings(): Promise<OpsSettingsSnapshot> {
  const record = await db.benchmarkOpsSettings.upsert({
    where: { id: process.env.AGENTPICK_OPS_SETTINGS_ID ?? "agentpick-ops-settings" },
    update: {},
    create: {
      id: process.env.AGENTPICK_OPS_SETTINGS_ID ?? "agentpick-ops-settings",
      defaultFrequency: "every_2h",
      autoPauseAfter: 5,
      heartbeatInterval: "every_5m",
      alertEmail: true,
      alertOpenclaw: true,
    },
  });

  return {
    id: record.id,
    defaultFrequency: record.defaultFrequency,
    autoPauseAfter: record.autoPauseAfter,
    heartbeatInterval: record.heartbeatInterval,
    openclawWorkspace: record.openclawWorkspace ?? null,
    exportBaseUrl: record.exportBaseUrl ?? null,
    alertEmail: record.alertEmail,
    alertOpenclaw: record.alertOpenclaw,
  };
}

export async function updateOpsSettings(input: Partial<OpsSettingsSnapshot>) {
  await ensureOpsSettings();
  const updated = await db.benchmarkOpsSettings.update({
    where: { id: process.env.AGENTPICK_OPS_SETTINGS_ID ?? "agentpick-ops-settings" },
    data: {
      defaultFrequency: input.defaultFrequency,
      autoPauseAfter: input.autoPauseAfter,
      heartbeatInterval: input.heartbeatInterval,
      openclawWorkspace: input.openclawWorkspace,
      exportBaseUrl: input.exportBaseUrl,
      alertEmail: input.alertEmail,
      alertOpenclaw: input.alertOpenclaw,
    },
  });

  return {
    id: updated.id,
    defaultFrequency: updated.defaultFrequency,
    autoPauseAfter: updated.autoPauseAfter,
    heartbeatInterval: updated.heartbeatInterval,
    openclawWorkspace: updated.openclawWorkspace ?? null,
    exportBaseUrl: updated.exportBaseUrl ?? null,
    alertEmail: updated.alertEmail,
    alertOpenclaw: updated.alertOpenclaw,
  } satisfies OpsSettingsSnapshot;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [configs, runs, keys] = await Promise.all([
    db.benchmarkAgentConfig.findMany(),
    db.benchmarkAgentRun.findMany({
      take: 6,
      orderBy: { startedAt: "desc" },
      include: { config: true },
    }),
    db.apiKeyVault.findMany({ orderBy: { service: "asc" } }),
  ]);

  const today = startOfToday();
  const testsToday = await db.benchmarkAgentRun.aggregate({
    _sum: { testsCompleted: true },
    where: { startedAt: { gte: today } },
  });

  const totalAgents = configs.length;
  const activeAgents = configs.filter((config: any) => config.isActive).length;
  const pausedAgents = totalAgents - activeAgents;
  const avgSuccessRate =
    totalAgents > 0
      ? configs.reduce((sum: number, config: any) => sum + (config.avgSuccessRate ?? 0), 0) / totalAgents
      : 0;

  const domainCoverage = DOMAIN_DEFINITIONS.map((domain) => {
    const matching = configs.filter((config: any) => config.domain === domain.slug);
    const tests = matching.reduce((sum: number, config: any) => sum + (config.totalTests ?? 0), 0);
    const avg = matching.length
      ? matching.reduce((sum: number, config: any) => sum + (config.avgSuccessRate ?? 0), 0) / matching.length
      : null;

    return {
      domain: domain.label,
      agents: matching.length,
      tests,
      avgSuccessRate: avg,
    };
  }).filter((item) => item.agents > 0);

  return {
    totalAgents,
    activeAgents,
    pausedAgents,
    testsToday: testsToday._sum.testsCompleted ?? 0,
    avgSuccessRate,
    recentRuns: runs.map(serializeRun),
    apiKeys: keys.map(serializeApiKey),
    domainCoverage,
  };
}

export async function listBenchmarkAgents(filters?: { domain?: string; provider?: string; active?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.domain && filters.domain !== "all") where.domain = filters.domain;
  if (filters?.provider && filters.provider !== "all") where.modelProvider = filters.provider;
  if (filters?.active === "active") where.isActive = true;
  if (filters?.active === "paused") where.isActive = false;

  const configs = await db.benchmarkAgentConfig.findMany({
    where,
    orderBy: [{ domain: "asc" }, { displayName: "asc" }],
    include: {
      runs: {
        take: 5,
        orderBy: { startedAt: "desc" },
        include: { config: true },
      },
    },
  });

  return configs.map(serializeConfig);
}

export async function getBenchmarkAgentById(id: string) {
  const record = await db.benchmarkAgentConfig.findUnique({
    where: { id },
    include: {
      runs: {
        take: 10,
        orderBy: { startedAt: "desc" },
        include: { config: true },
      },
      querySet: true,
    },
  });

  return record ? serializeConfig(record) : null;
}

export async function getAgentPageBootstrap(id?: string) {
  const [agents, querySets, apiKeys, settings, agentDirectory] = await Promise.all([
    id ? getBenchmarkAgentById(id) : Promise.resolve(null),
    listQuerySets(),
    listApiKeys(),
    ensureOpsSettings(),
    listAgentDirectory(),
  ]);

  return { agent: agents, querySets, apiKeys, settings, agentDirectory };
}

export async function createBenchmarkAgent(input: CreateAgentInput) {
  const domain = input.domain;
  const providerModel = findModel(input.modelProvider);
  const domainMeta = findDomain(domain);
  const existingInDomain = await db.benchmarkAgentConfig.count({ where: { domain, modelProvider: input.modelProvider } });
  const displayName = normalizeDisplayName(
    input.displayName || buildBenchmarkDisplayName(domain, input.modelProvider, existingInDomain + 1),
  );
  const toolSlugs = input.toolSlugs?.length ? input.toolSlugs : domainMeta.suggestedTools;
  const subdomain = input.subdomain || pickDefaultSubdomain(domain);
  const description = input.description || buildDefaultDescription(domain, subdomain, toolSlugs);
  const agentId = input.agentId || (await ensureAgentIdentity({ displayName, domain, description }));
  const modelApiKey = await resolveEncryptedModelKey(input.modelProvider);
  const toolApiKeys = await resolveEncryptedToolKeys(toolSlugs);

  const created = await db.benchmarkAgentConfig.create({
    data: {
      agentId,
      displayName,
      domain,
      subdomain,
      description,
      modelProvider: providerModel.provider,
      modelName: input.modelName || providerModel.modelName,
      modelApiKey,
      evaluatorModel: getDefaultEvaluatorModel(input.evaluatorModel),
      testFrequency: input.testFrequency ?? "every_2h",
      queriesPerRun: input.queriesPerRun ?? 3,
      toolsPerQuery: input.toolsPerQuery ?? 4,
      complexity: input.complexity?.length ? input.complexity : ["simple", "medium", "complex"],
      toolSlugs,
      toolApiKeys,
      querySetId: input.querySetId || null,
      customQueries: input.customQueries ?? [],
      isActive: input.isActive ?? false,
      openclawEnabled: input.openclawEnabled ?? false,
      openclawConfig: input.openclawConfig ?? null,
    },
  });

  return getBenchmarkAgentById(created.id);
}

export async function updateBenchmarkAgent(input: UpdateAgentInput) {
  const existing = await db.benchmarkAgentConfig.findUnique({ where: { id: input.id } });
  if (!existing) {
    throw new Error("Agent config not found.");
  }

  const toolSlugs = input.toolSlugs?.length ? input.toolSlugs : existing.toolSlugs;
  const updated = await db.benchmarkAgentConfig.update({
    where: { id: input.id },
    data: {
      displayName: input.displayName ? normalizeDisplayName(input.displayName) : undefined,
      domain: input.domain,
      subdomain: input.subdomain,
      description: input.description,
      modelProvider: input.modelProvider,
      modelName: input.modelName,
      modelApiKey: await resolveEncryptedModelKey(input.modelProvider),
      evaluatorModel: input.evaluatorModel ?? existing.evaluatorModel ?? DEFAULT_EVALUATOR_MODEL,
      testFrequency: input.testFrequency,
      queriesPerRun: input.queriesPerRun,
      toolsPerQuery: input.toolsPerQuery,
      complexity: input.complexity?.length ? input.complexity : existing.complexity,
      toolSlugs,
      toolApiKeys: await resolveEncryptedToolKeys(toolSlugs),
      querySetId: input.querySetId || null,
      customQueries: input.customQueries ?? [],
      isActive: input.isActive,
      openclawEnabled: input.openclawEnabled,
      openclawConfig: input.openclawConfig ?? undefined,
    },
  });

  return getBenchmarkAgentById(updated.id);
}

export async function deleteBenchmarkAgent(id: string) {
  await db.benchmarkAgentRun.deleteMany({ where: { configId: id } });
  await db.benchmarkAgentConfig.delete({ where: { id } });
}

export async function listApiKeys() {
  const records = await db.apiKeyVault.findMany({
    where: { NOT: { service: { startsWith: "__" } } },
    orderBy: { service: "asc" },
  });
  return records.map(serializeApiKey);
}

export async function saveApiKey(input: SaveApiKeyInput) {
  const existing = input.id
    ? await db.apiKeyVault.findUnique({ where: { id: input.id } })
    : await db.apiKeyVault.findUnique({ where: { service: input.service } });

  if (!existing?.apiKey && !input.apiKey) {
    throw new Error("A new vault entry requires an API key.");
  }

  const payload = {
    service: input.service,
    displayName: input.displayName,
    apiKey: input.apiKey ? encryptSecret(input.apiKey) : existing?.apiKey ?? "",
    tier: input.tier ?? "free",
    monthlyLimit: input.monthlyLimit ?? null,
    usedThisMonth: input.usedThisMonth ?? 0,
    status: input.status ?? "active",
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    notes: input.notes ?? null,
  };

  const record = input.id
    ? await db.apiKeyVault.update({ where: { id: input.id }, data: payload })
    : await db.apiKeyVault.upsert({
        where: { service: input.service },
        update: payload,
        create: payload,
      });

  return serializeApiKey(record);
}

export async function deleteApiKey(id: string) {
  await db.apiKeyVault.delete({ where: { id } });
}

export async function testApiKey(id: string) {
  const record = await db.apiKeyVault.findUnique({ where: { id } });
  if (!record) throw new Error("API key not found.");
  const result = await probeVaultKey(record.service, record.apiKey);

  await db.apiKeyVault.update({
    where: { id },
    data: {
      status: result.ok ? "active" : result.status,
    },
  });

  return result;
}

export async function testAllApiKeys() {
  const keys = await db.apiKeyVault.findMany({
    where: { NOT: { service: { startsWith: "__" } } },
    orderBy: { service: "asc" },
  });
  const results = [];

  for (const key of keys) {
    const result = await testApiKey(key.id);
    results.push({ id: key.id, service: key.service, ...result });
  }

  return results;
}

export async function listQuerySets() {
  const records = await db.querySet.findMany({ orderBy: [{ domain: "asc" }, { version: "desc" }] });
  return records.map(serializeQuerySet);
}

export function generateQuerySet(domain: string, count = DEFAULT_QUERYSET_SIZE): QueryItem[] {
  const domainMeta = findDomain(domain);
  const intents = [
    "Return authoritative sources with clear citations.",
    "Summarize the current state with key context and risks.",
    "Compare at least two credible sources.",
    "Surface anything that changed recently.",
    "Highlight the most decision-relevant facts first.",
  ];

  const stems = [
    `latest ${domainMeta.label.toLowerCase()} changes affecting ${domainMeta.subdomains[0]}`,
    `${domainMeta.label.toLowerCase()} best practices for ${domainMeta.subdomains[1] ?? domainMeta.subdomains[0]}`,
    `compare top tools for ${domainMeta.subdomains[2] ?? domainMeta.subdomains[0]} workflows`,
    `${domainMeta.label.toLowerCase()} regulations impacting ${domainMeta.subdomains[3] ?? domainMeta.subdomains[0]}`,
    `find primary sources about ${domainMeta.subdomains[0]} in ${domainMeta.label.toLowerCase()}`,
  ];

  const results: QueryItem[] = [];
  const complexity: QueryItem["complexity"][] = ["simple", "medium", "complex"];
  for (let index = 0; index < count; index += 1) {
    const stem = stems[index % stems.length];
    results.push({
      query: `${stem} (${index + 1})`,
      complexity: complexity[index % complexity.length],
      intent: intents[index % intents.length],
    });
  }

  return results;
}

export async function saveQuerySet(input: SaveQuerySetInput) {
  const payload = {
    name: input.name,
    domain: input.domain,
    description: input.description ?? null,
    version: input.version ?? 1,
    isActive: input.isActive ?? true,
    queries: input.queries,
  };

  const record =
    input.id && !input.id.startsWith("draft-")
      ? await db.querySet.update({ where: { id: input.id }, data: payload })
      : await db.querySet.create({ data: payload });

  return serializeQuerySet(record);
}

export async function deleteQuerySet(id: string) {
  await db.querySet.delete({ where: { id } });
}

export async function listRuns(filters?: { agentId?: string; status?: string; hours?: number }) {
  const where: Record<string, unknown> = {};
  if (filters?.status && filters.status !== "all") where.status = filters.status;
  if (filters?.agentId && filters.agentId !== "all") where.configId = filters.agentId;
  if (filters?.hours) {
    where.startedAt = { gte: new Date(Date.now() - filters.hours * 60 * 60 * 1000) };
  }

  const records = await db.benchmarkAgentRun.findMany({
    where,
    orderBy: { startedAt: "desc" },
    take: 100,
    include: { config: true },
  });

  return records.map(serializeRun);
}

export async function getRun(id: string) {
  const record = await db.benchmarkAgentRun.findUnique({
    where: { id },
    include: { config: true },
  });
  return record ? serializeRun(record) : null;
}

export async function getScheduleSnapshot() {
  const [settings, configs] = await Promise.all([ensureOpsSettings(), db.benchmarkAgentConfig.findMany()]);
  const buckets = FREQUENCY_OPTIONS.map((option) => ({
    frequency: option.value,
    label: option.label,
    count: configs.filter((config: any) => config.testFrequency === option.value).length,
  }));

  const dueNow = configs.filter((config: any) => {
    if (!config.isActive || !config.lastRunAt) return config.isActive;
    return Date.now() - new Date(config.lastRunAt).getTime() >= getFrequencyMs(config.testFrequency);
  }).length;

  return {
    settings,
    buckets,
    activeAgents: configs.filter((config: any) => config.isActive).length,
    dueNow,
  };
}

export async function getStatusSnapshot(): Promise<StatusSnapshot> {
  const [configs, runs, keys, latestFailures] = await Promise.all([
    db.benchmarkAgentConfig.findMany(),
    db.benchmarkAgentRun.findMany({
      where: { startedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      include: { config: true },
    }),
    db.apiKeyVault.findMany({ where: { NOT: { service: { startsWith: "__" } } } }),
    db.benchmarkAgentRun.findMany({
      where: { status: { in: ["failed", "timeout"] } },
      include: { config: true },
      orderBy: { startedAt: "desc" },
      take: 50,
    }),
  ]);

  return {
    total_agents: configs.length,
    active_agents: configs.filter((config: any) => config.isActive).length,
    paused_agents: configs.filter((config: any) => !config.isActive).length,
    tests_last_hour: runs.reduce((sum: number, run: any) => sum + (run.testsCompleted ?? 0), 0),
    avg_success_rate:
      configs.length > 0
        ? configs.reduce((sum: number, config: any) => sum + (config.avgSuccessRate ?? 0), 0) / configs.length
        : 0,
    api_key_status: Object.fromEntries(
      keys.map((key: any) => [
        key.service,
        {
          status: key.status,
          usage_pct: key.monthlyLimit ? Math.round(((key.usedThisMonth ?? 0) / key.monthlyLimit) * 100) : null,
        },
      ]),
    ),
    agents_with_failures: configs
      .filter((config: any) => (config.consecutiveFails ?? 0) >= 1)
      .sort((left: any, right: any) => (right.consecutiveFails ?? 0) - (left.consecutiveFails ?? 0))
      .slice(0, 5)
      .map((config: any) => ({
        name: config.displayName,
        consecutive_fails: config.consecutiveFails ?? 0,
        last_error: latestFailures.find((run: any) => run.configId === config.id)?.error ?? null,
      })),
  };
}

export async function buildOpsIndex() {
  const [dashboard, agents, querySets, runs, settings] = await Promise.all([
    getDashboardSnapshot(),
    listBenchmarkAgents(),
    listQuerySets(),
    listRuns({ hours: 24 }),
    ensureOpsSettings(),
  ]);

  return { dashboard, agents, querySets, runs, settings };
}

export async function getVaultExportMap() {
  const keys = await db.apiKeyVault.findMany();
  return Object.fromEntries(keys.map((record: any) => [record.service, decryptSecret(record.apiKey)]));
}

export async function getSeedPrerequisites() {
  const [querySets, keys] = await Promise.all([listQuerySets(), listApiKeys()]);
  return { querySets, keys };
}

export function summarizeAgentHealth(agent: AgentListItem) {
  return {
    name: agent.displayName,
    domain: findDomain(agent.domain).label,
    model: findModel(agent.modelProvider).label,
    frequency: agent.testFrequency,
    lastRun: formatRelativeTime(agent.lastRunAt),
    successRate: formatPercent(agent.avgSuccessRate),
  };
}

export async function buildSeedBlueprints(): Promise<SeedBlueprint[]> {
  const blueprints: SeedBlueprint[] = [];
  const modelCounts = new Map<string, number>();
  for (const entry of DEFAULT_DISTRIBUTION) {
    for (const modelCount of entry.models) {
      for (let index = 0; index < modelCount.count; index += 1) {
        const model = findModel(modelCount.slug);
        const key = `${entry.domain}-${model.slug}`;
        const next = (modelCounts.get(key) ?? 0) + 1;
        modelCounts.set(key, next);
        const domain = findDomain(entry.domain);
        const subdomain = domain.subdomains[index % domain.subdomains.length];
        const toolSlugs = domain.suggestedTools;

        blueprints.push({
          displayName: buildBenchmarkDisplayName(entry.domain, model.provider, next),
          domain: entry.domain,
          subdomain,
          description: buildDefaultDescription(entry.domain, subdomain, toolSlugs),
          modelProvider: model.provider,
          modelName: model.modelName,
          evaluatorModel: DEFAULT_EVALUATOR_MODEL,
          toolSlugs,
        });
      }
    }
  }

  return blueprints;
}
