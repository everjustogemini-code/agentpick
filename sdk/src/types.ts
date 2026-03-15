export type Strategy = 'MOST_ACCURATE' | 'FASTEST' | 'CHEAPEST' | 'BALANCED' | 'AUTO' | 'MANUAL' | 'auto';

export interface RouteOptions {
  strategy?: Strategy;
  budget?: number;
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
  strategy: Strategy;
  tool_used: string;
  latency_ms: number;
  classification_ms: number | null;
  total_ms: number | null;
  cost?: number;
  success: boolean;
  ai_routing_summary?: string;
  fallback_chain: string[];
  created_at: string;
}

export interface AccountInfo {
  id: string;
  email: string;
  plan: string;
  calls_remaining: number;
}

export interface UsageInfo {
  calls_today: number;
  calls_this_month: number;
  cost_this_month: number;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  latency_ms: number;
}

export interface BudgetConfig {
  max_cost_per_call?: number;
  max_cost_per_day?: number;
}

export interface CallFilters {
  capability?: string;
  strategy?: Strategy;
  tool?: string;
  from?: string;   // ISO date
  to?: string;     // ISO date
  limit?: number;
}

export interface AgentPickClientOptions {
  apiKey: string;
  baseUrl?: string;
}
