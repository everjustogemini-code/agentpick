type Strategy = 'MOST_ACCURATE' | 'FASTEST' | 'CHEAPEST' | 'BALANCED' | 'AUTO' | 'MANUAL' | 'auto';
interface RouteOptions {
    strategy?: Strategy;
    budget?: number;
    tools?: string[];
}
interface FallbackAttempt {
    tool: string;
    success: boolean;
    latency_ms: number;
    error?: string;
}
interface RouteResult {
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
interface CallRecord {
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
interface AccountInfo {
    id: string;
    email: string;
    plan: string;
    calls_remaining: number;
}
interface UsageInfo {
    calls_today: number;
    calls_this_month: number;
    cost_this_month: number;
}
interface HealthStatus {
    status: 'ok' | 'degraded';
    latency_ms: number;
}
interface BudgetConfig {
    max_cost_per_call?: number;
    max_cost_per_day?: number;
}
interface CallFilters {
    capability?: string;
    strategy?: Strategy;
    tool?: string;
    from?: string;
    to?: string;
    limit?: number;
}
interface AgentPickClientOptions {
    apiKey: string;
    baseUrl?: string;
}

declare class AgentPickClient {
    private apiKey;
    private baseUrl;
    constructor(options: AgentPickClientOptions);
    private request;
    /** Route a query to the best available tool for the given capability. */
    route(capability: string, query: string, options?: RouteOptions): Promise<RouteResult>;
    /** Get account info for the authenticated API key. */
    account(): Promise<AccountInfo>;
    /** Get usage stats for current billing period. */
    usage(): Promise<UsageInfo>;
    /** List recent routing calls, optionally filtered. */
    calls(filters?: CallFilters): Promise<CallRecord[]>;
    /** Set the default routing strategy for this API key. */
    setStrategy(strategy: Strategy): Promise<void>;
    /** Configure cost budget limits. */
    setBudget(budget: BudgetConfig): Promise<void>;
    /** Check API health. */
    health(): Promise<HealthStatus>;
}

declare class AgentPickError extends Error {
    status?: number;
    fallback_reported: boolean;
    constructor(message: string, status?: number);
}

export { type AccountInfo, AgentPickClient, type AgentPickClientOptions, AgentPickError, type BudgetConfig, type CallFilters, type CallRecord, type FallbackAttempt, type HealthStatus, type RouteOptions, type RouteResult, type Strategy, type UsageInfo, AgentPickClient as default };
