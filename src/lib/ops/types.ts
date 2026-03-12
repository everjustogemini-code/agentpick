export type Complexity = "simple" | "medium" | "complex";

export type Frequency =
  | "every_30m"
  | "every_1h"
  | "every_2h"
  | "every_6h"
  | "daily";

export type HeartbeatFrequency = "every_5m" | "every_15m" | "every_30m" | "every_1h";

export type RunStatus = "running" | "completed" | "failed" | "timeout";

export interface DomainDefinition {
  slug: string;
  code: string;
  label: string;
  subdomains: string[];
  suggestedTools: string[];
}

export interface ModelDefinition {
  slug: string;
  provider: string;
  label: string;
  modelName: string;
  evaluatorCompatible: boolean;
}

export interface ToolDefinition {
  slug: string;
  label: string;
  description: string;
}

export interface QueryItem {
  query: string;
  complexity: Complexity;
  intent: string;
}

export interface ApiKeyVaultSnapshot {
  id: string;
  service: string;
  displayName: string;
  tier: string;
  monthlyLimit: number | null;
  usedThisMonth: number;
  status: string;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  keyPreview: string;
}

export interface BenchmarkRunResultItem {
  query: string;
  tool: string;
  success: boolean;
  latencyMs: number | null;
  relevance: number | null;
  status: string;
  error?: string | null;
  meta?: Record<string, unknown>;
}

export interface BenchmarkRunSnapshot {
  id: string;
  configId: string;
  configDisplayName: string;
  startedAt: string;
  completedAt: string | null;
  status: RunStatus;
  error: string | null;
  queriesRun: number;
  toolsTested: number;
  testsCompleted: number;
  avgRelevance: number | null;
  avgLatencyMs: number | null;
  successRate: number | null;
  results: BenchmarkRunResultItem[];
}

export interface AgentListItem {
  id: string;
  agentId: string;
  displayName: string;
  domain: string;
  subdomain: string | null;
  description: string | null;
  modelProvider: string;
  modelName: string;
  evaluatorModel: string;
  testFrequency: Frequency;
  queriesPerRun: number;
  toolsPerQuery: number;
  complexity: Complexity[];
  toolSlugs: string[];
  querySetId: string | null;
  customQueries: string[];
  isActive: boolean;
  lastRunAt: string | null;
  lastRunSuccess: boolean | null;
  totalRuns: number;
  totalTests: number;
  avgSuccessRate: number | null;
  consecutiveFails: number;
  openclawEnabled: boolean;
  openclawConfig: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  recentRuns: BenchmarkRunSnapshot[];
}

export interface QuerySetSnapshot {
  id: string;
  name: string;
  domain: string;
  description: string | null;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  queries: QueryItem[];
}

export interface DashboardSnapshot {
  totalAgents: number;
  activeAgents: number;
  pausedAgents: number;
  testsToday: number;
  avgSuccessRate: number;
  recentRuns: BenchmarkRunSnapshot[];
  apiKeys: ApiKeyVaultSnapshot[];
  domainCoverage: Array<{
    domain: string;
    agents: number;
    tests: number;
    avgSuccessRate: number | null;
  }>;
}

export interface OpsSettingsSnapshot {
  id: string;
  defaultFrequency: Frequency;
  autoPauseAfter: number;
  heartbeatInterval: HeartbeatFrequency;
  openclawWorkspace: string | null;
  exportBaseUrl: string | null;
  alertEmail: boolean;
  alertOpenclaw: boolean;
}

export interface StatusSnapshot {
  total_agents: number;
  active_agents: number;
  paused_agents: number;
  tests_last_hour: number;
  avg_success_rate: number;
  api_key_status: Record<string, { status: string; usage_pct: number | null }>;
  agents_with_failures: Array<{
    name: string;
    consecutive_fails: number;
    last_error: string | null;
  }>;
}

export interface CreateAgentInput {
  displayName?: string;
  domain: string;
  subdomain?: string | null;
  description?: string | null;
  modelProvider: string;
  modelName: string;
  evaluatorModel?: string;
  testFrequency?: Frequency;
  queriesPerRun?: number;
  toolsPerQuery?: number;
  complexity?: Complexity[];
  toolSlugs?: string[];
  querySetId?: string | null;
  customQueries?: string[];
  isActive?: boolean;
  openclawEnabled?: boolean;
  openclawConfig?: Record<string, unknown> | null;
  agentId?: string | null;
}

export interface UpdateAgentInput extends CreateAgentInput {
  id: string;
}

export interface SaveApiKeyInput {
  id?: string;
  service: string;
  displayName: string;
  apiKey: string;
  tier?: string;
  monthlyLimit?: number | null;
  usedThisMonth?: number;
  status?: string;
  expiresAt?: string | null;
  notes?: string | null;
}

export interface SaveQuerySetInput {
  id?: string;
  name: string;
  domain: string;
  description?: string | null;
  version?: number;
  isActive?: boolean;
  queries: QueryItem[];
}

export interface SeedBlueprint {
  displayName: string;
  domain: string;
  subdomain: string;
  description: string;
  modelProvider: string;
  modelName: string;
  evaluatorModel: string;
  toolSlugs: string[];
}
