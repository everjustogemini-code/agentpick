export type Strategy = 'MOST_ACCURATE' | 'FASTEST' | 'CHEAPEST' | 'BALANCED' | 'AUTO' | 'MANUAL';

export interface RouteOptions {
  strategy?: Strategy;
  tools?: string[];
}

export interface FallbackAttempt {
  tool: string;
  success: boolean;
  latency_ms: number;
  error?: string;
}

export interface RouteResult {
  tool: string;
  latency_ms: number;
  resultCount: number;
  relevance: number;
  success: boolean;
  ai_routing_summary?: string;
  fallback_chain: FallbackAttempt[];
  cost?: number;
  response_preview?: string;
}

export interface CallRecord {
  id: string;
  query: string;
  capability: string;
  toolRequested: string | null;
  toolUsed: string;
  strategyUsed: string;
  latencyMs: number;
  costUsd: number;
  resultCount: number | null;
  byokUsed: boolean;
  success: boolean;
  fallbackUsed: boolean;
  fallbackFrom: string | null;
  fallbackChain: string[];
  statusCode: number;
  traceId: string;
  aiClassification: Record<string, unknown> | null;
  createdAt: string;
}

export interface AccountInfo {
  id: string;
  email: string | null;
  plan: string;
  planLabel: string;
  planSlug: string;
  strategy: string;
  priorityTools: string[];
  excludedTools: string[];
  fallbackEnabled: boolean;
  maxFallbacks: number;
  latencyBudgetMs: number | null;
  monthlyBudgetUsd: number | null;
  spentThisMonth: number;
  totalCalls: number;
  totalFallbacks: number;
  billingCycleStart: string;
  usage: {
    monthlyLimit: number | null;
    monthlyUsed: number;
    monthlyRemaining: number | null;
    includedCallsUsed: number;
    overageCalls: number;
    overagePerCall: number | null;
    overageCostUsd: number;
    hardCapped: boolean;
  };
  createdAt: string;
}

export interface UsageInfo {
  plan: string;
  plan_label: string;
  daily_limit: number;
  daily_used: number;
  daily_remaining: number;
  monthlyLimit: number | null;
  callsThisMonth: number;
  strategy: string;
  stats: {
    period: { days: number; since: string };
    totalCalls: number;
    successRate: number;
    fallbackRate: number;
    avgLatencyMs: number;
    totalCostUsd: number;
    totalToolCostUsd: number;
    byokSavingsUsd: number;
    byokCalls: number;
    byokCoverageRate: number;
    byCapability: Record<string, { calls: number; avgLatency: number; successRate: number }>;
    byTool: Record<string, { calls: number; avgLatency: number }>;
    byStrategy: Record<string, { calls: number; avgLatency: number; successRate: number }>;
    aiRouting: {
      totalAiRoutedCalls: number;
      byType: Record<string, number>;
      byDomain: Record<string, number>;
    };
  };
  ai_routing_summary: {
    totalAiRoutedCalls: number;
    byType: Record<string, number>;
    byDomain: Record<string, number>;
  };
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  latency_ms: number;
}

export interface BudgetConfig {
  monthly_budget_usd: number;
}

export interface CallFilters {
  capability?: string;
  strategy?: Strategy;
  tool?: string;
  from?: string;  // ISO date
  to?: string;    // ISO date
  limit?: number;
}

export interface AgentPickClientOptions {
  apiKey: string;
  baseUrl?: string;
}
