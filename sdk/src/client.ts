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
    this.baseUrl = options.baseUrl ?? 'https://agentpick.dev';
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

  /**
   * Route a query to the best available tool for the given capability.
   * @param capability - The capability to route (e.g. 'search', 'crawl', 'embed')
   * @param query - The query string to pass to the selected tool
   * @param options - Optional strategy and tool overrides
   */
  async route(capability: string, query: string, options?: RouteOptions): Promise<RouteResult> {
    const raw = await this.request<{
      data: unknown;
      meta: {
        tool_used: string;
        latency_ms: number;
        classify_ms?: number;
        tool_ms?: number;
        result_count?: number;
        cost_usd?: number;
        trace_id?: string;
        fallback_used?: boolean;
        fallback_from?: string;
        ai_classification?: { type?: string; domain?: string; depth?: string; reasoning?: string };
      };
    }>(`/api/v1/router/${capability}`, {
      method: 'POST',
      body: JSON.stringify({
        query,
        ...(options?.strategy && { strategy: options.strategy }),
        ...(options?.tools?.length && { priority_tools: options.tools }),
      }),
    });
    const success = !raw.meta.trace_id?.startsWith('trace_fail_');
    const fallback_chain = raw.meta.fallback_used
      ? [
          ...(raw.meta.fallback_from ? [{ tool: raw.meta.fallback_from, success: false, latency_ms: 0 }] : []),
          { tool: raw.meta.tool_used, success: true, latency_ms: raw.meta.latency_ms },
        ]
      : [];
    return {
      tool: raw.meta.tool_used,
      latency_ms: raw.meta.latency_ms,
      classify_ms: raw.meta.classify_ms ?? null,
      tool_ms: raw.meta.tool_ms ?? null,
      resultCount: raw.meta.result_count ?? 0,
      relevance: 0,
      success,
      ai_routing_summary: raw.meta.ai_classification?.reasoning,
      fallback_chain,
      cost_usd: raw.meta.cost_usd,
      response_preview: typeof raw.data === 'object' && raw.data !== null
        ? JSON.stringify(raw.data).slice(0, 500)
        : undefined,
    };
  }

  /**
   * Get account info for the authenticated API key.
   */
  async account(): Promise<AccountInfo> {
    const raw = await this.request<{ account: AccountInfo }>('/api/v1/router/account');
    return raw.account;
  }

  /**
   * Get usage statistics for the current billing period.
   */
  async usage(): Promise<UsageInfo> {
    return this.request<UsageInfo>('/api/v1/router/usage');
  }

  /**
   * List recent routing calls, optionally filtered by capability, strategy, tool, or date.
   * @param filters - Optional filters: capability, strategy, tool, dateFrom, dateTo, limit, page
   */
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
    const raw = await this.request<{ calls: CallRecord[]; total?: number; page?: number; pageSize?: number }>(
      `/api/v1/router/calls${qs ? `?${qs}` : ''}`
    );
    return raw.calls;
  }

  /**
   * Set the default routing strategy for all calls made with this API key.
   * @param strategy - One of MOST_ACCURATE | FASTEST | CHEAPEST | BALANCED | AUTO | MANUAL
   */
  async setStrategy(strategy: Strategy): Promise<void> {
    await this.request('/api/v1/router/strategy', {
      method: 'POST',
      body: JSON.stringify({ strategy }),
    });
  }

  /**
   * Configure monthly cost budget and alert threshold for this API key.
   * @param config - { monthly_usd, alert_at_pct } where alert_at_pct is 0–100
   */
  async setBudget(config: BudgetConfig): Promise<void> {
    await this.request('/api/v1/router/budget', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  /**
   * Check API health and measure authenticated round-trip latency.
   * Returns status 'ok' or 'degraded', plus measured latency_ms and server version.
   */
  async health(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/v1/router/health');
  }
}
