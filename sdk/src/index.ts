export { AgentPickClient } from './client';
export { AgentPickClient as default } from './client';
export { AgentPickError } from './retry';
export type {
  Strategy, RouteOptions, RouteResult, FallbackAttempt,
  CallRecord, CallFilters, AccountInfo, UsageInfo,
  HealthStatus, BudgetConfig, AgentPickClientOptions
} from './types';

import { AgentPickClient } from './client';
import type { RouteOptions, RouteResult } from './types';

let _defaultClient: AgentPickClient | null = null;

function getDefaultClient(): AgentPickClient {
  const apiKey = process.env.AGENTPICK_API_KEY ?? '';
  if (!_defaultClient) {
    _defaultClient = new AgentPickClient({ apiKey });
  }
  return _defaultClient;
}

/** Convenience top-level search function. Wraps AgentPickClient.route('search', query, options). */
export function search(query: string, options?: RouteOptions): Promise<RouteResult> {
  return getDefaultClient().route('search', query, options);
}
