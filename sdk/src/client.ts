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
    return this.request<RouteResult>(`/api/v1/router/${capability}`, {
      method: 'POST',
      body: JSON.stringify({ query, ...options }),
    });
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
    const params = new URLSearchParams(filters as Record<string, string>);
    return this.request<CallRecord[]>(`/api/v1/router/calls?${params}`);
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
