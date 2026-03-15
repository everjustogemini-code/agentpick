import type {
  AgentPickClientOptions, RouteOptions, RouteResult, AccountInfo,
  UsageInfo, CallRecord, CallFilters, HealthStatus, BudgetConfig, Strategy
} from './types';
import { withRetry, AgentPickError } from './retry';

export class AgentPickClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: AgentPickClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://agentpick.io';
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    return withRetry(async () => {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(options?.headers ?? {}),
        },
      });
      if (!res.ok) throw new AgentPickError(await res.text(), res.status);
      return res.json() as Promise<T>;
    });
  }

  /** Route a query to the best available tool for the given capability. */
  async route(capability: string, query: string, options?: RouteOptions): Promise<RouteResult> {
    const raw = await this.request<{
      data: unknown;
      meta: {
        tool_used: string;
        latency_ms: number;
        result_count?: number;
        cost_usd?: number;
        trace_id?: string;
        fallback_chain?: Array<{ tool: string; success: boolean; latency_ms: number; error?: string }>;
        ai_routing_summary?: string;
      };
    }>(`/api/v1/router/${capability}`, {
      method: 'POST',
      body: JSON.stringify({ query, ...options }),
    });
    const success = !raw.meta.trace_id?.startsWith('trace_fail_');
    return {
      tool: raw.meta.tool_used,
      latency_ms: raw.meta.latency_ms,
      resultCount: raw.meta.result_count ?? 0,
      relevance: 0,
      success,
      ai_routing_summary: raw.meta.ai_routing_summary,
      fallback_chain: raw.meta.fallback_chain ?? [],
      cost: raw.meta.cost_usd,
      response_preview: typeof raw.data === 'object' && raw.data !== null
        ? JSON.stringify(raw.data).slice(0, 500)
        : undefined,
    };
  }

  /** Get account info for the authenticated API key. */
  async account(): Promise<AccountInfo> {
    return this.request<AccountInfo>('/api/v1/router/account');
  }

  /** Get usage statistics for the current billing period. */
  async usage(): Promise<UsageInfo> {
    return this.request<UsageInfo>('/api/v1/router/usage');
  }

  /** List recent routing calls, optionally filtered. */
  async calls(filters?: CallFilters): Promise<CallRecord[]> {
    const params = new URLSearchParams();
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      }
    }
    const qs = params.toString();
    const raw = await this.request<{ calls: CallRecord[] }>(`/api/v1/router/calls${qs ? `?${qs}` : ''}`);
    return raw.calls;
  }

  /** Set the default routing strategy for this API key. */
  async setStrategy(strategy: Strategy): Promise<void> {
    await this.request('/api/v1/router/strategy', {
      method: 'POST',
      body: JSON.stringify({ strategy }),
    });
  }

  /** Configure cost budget limits. */
  async setBudget(budget: BudgetConfig): Promise<void> {
    await this.request('/api/v1/router/budget', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
  }

  /** Check API health and measure round-trip latency. */
  async health(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/v1/router/health');
  }
}
