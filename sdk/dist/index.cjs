"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AgentPickClient: () => AgentPickClient,
  AgentPickError: () => AgentPickError,
  default: () => AgentPickClient
});
module.exports = __toCommonJS(index_exports);

// src/retry.ts
var AgentPickError = class extends Error {
  constructor(message, status) {
    super(message);
    this.fallback_reported = false;
    this.name = "AgentPickError";
    this.status = status;
  }
};
async function withRetry(fn, maxAttempts = 3) {
  const delays = [200, 400];
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const apiErr = err instanceof AgentPickError ? err : new AgentPickError(String(err));
      lastError = apiErr;
      if (apiErr.status && apiErr.status < 500) throw apiErr;
      if (attempt < maxAttempts - 1) await new Promise((r) => setTimeout(r, delays[attempt] ?? 400));
    }
  }
  lastError.fallback_reported = true;
  throw lastError;
}

// src/client.ts
var AgentPickClient = class {
  constructor(options) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://agentpick.dev";
  }
  async request(path, options) {
    return withRetry(async () => {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...options?.headers ?? {}
        }
      });
      if (!res.ok) throw new AgentPickError(await res.text(), res.status);
      return res.json();
    });
  }
  /** Route a query to the best available tool for the given capability. */
  async route(capability, query, options) {
    const raw = await this.request(`/api/v1/router/${capability}`, {
      method: "POST",
      body: JSON.stringify({
        query,
        ...options?.strategy && { strategy: options.strategy },
        ...options?.budget !== void 0 && { budget: options.budget },
        ...options?.tools?.length && { priority_tools: options.tools }
      })
    });
    const success = !raw.meta.trace_id?.startsWith("trace_fail_");
    const fallback_chain = raw.meta.fallback_used ? [
      ...raw.meta.fallback_from ? [{ tool: raw.meta.fallback_from, success: false, latency_ms: 0 }] : [],
      { tool: raw.meta.tool_used, success: true, latency_ms: raw.meta.latency_ms }
    ] : [];
    return {
      tool: raw.meta.tool_used,
      latency_ms: raw.meta.latency_ms,
      resultCount: raw.meta.result_count ?? 0,
      relevance: 0,
      success,
      ai_routing_summary: raw.meta.ai_classification?.reasoning,
      fallback_chain,
      cost: raw.meta.cost_usd,
      response_preview: typeof raw.data === "object" && raw.data !== null ? JSON.stringify(raw.data).slice(0, 500) : void 0
    };
  }
  /** Get account info for the authenticated API key. */
  async account() {
    const raw = await this.request("/api/v1/router/account");
    const acc = raw.account;
    return {
      id: acc.id,
      email: acc.email ?? "",
      plan: acc.plan,
      calls_remaining: acc.usage?.monthlyRemaining ?? acc.usage?.monthlyLimit ?? 0
    };
  }
  /** Get usage stats for current billing period. */
  async usage() {
    const raw = await this.request("/api/v1/router/usage");
    return {
      calls_today: raw.daily_used ?? 0,
      calls_this_month: raw.callsThisMonth ?? 0,
      cost_this_month: raw.stats?.totalCostUsd ?? 0
    };
  }
  /** List recent routing calls, optionally filtered. */
  async calls(filters) {
    const params = new URLSearchParams();
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== void 0 && value !== null) {
          params.set(key, String(value));
        }
      }
    }
    const qs = params.toString();
    const raw = await this.request(`/api/v1/router/calls${qs ? `?${qs}` : ""}`);
    return raw.calls.map((c) => ({
      id: c.id,
      query: c.query,
      capability: c.capability,
      strategy: c.strategyUsed,
      tool_used: c.toolUsed,
      latency_ms: c.latencyMs,
      classification_ms: null,
      total_ms: null,
      cost: c.costUsd,
      success: c.success,
      ai_routing_summary: c.aiClassification?.reasoning,
      fallback_chain: c.fallbackChain ?? [],
      created_at: c.createdAt
    }));
  }
  /** Set the default routing strategy for this API key. */
  async setStrategy(strategy) {
    await this.request("/api/v1/router/strategy", {
      method: "POST",
      body: JSON.stringify({ strategy })
    });
  }
  /** Configure cost budget limits. */
  async setBudget(budget) {
    await this.request("/api/v1/router/budget", {
      method: "POST",
      body: JSON.stringify(budget)
    });
  }
  /** Check API health. */
  async health() {
    return this.request("/api/v1/router/health");
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentPickClient,
  AgentPickError
});
