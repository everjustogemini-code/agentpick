import { decryptSecret } from "./crypto";

export interface ProbeResult {
  ok: boolean;
  status: string;
  latencyMs: number;
  details?: Record<string, unknown>;
  error?: string;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    const latencyMs = Date.now() - startedAt;
    const text = await response.text();
    let data: unknown = text;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return { response, latencyMs, data };
  } finally {
    clearTimeout(timeout);
  }
}

export async function probeVaultKey(service: string, encryptedKey: string): Promise<ProbeResult> {
  const apiKey = decryptSecret(encryptedKey);
  if (!apiKey) {
    return { ok: false, status: "missing", latencyMs: 0, error: "No API key stored." };
  }

  try {
    switch (service) {
      case "tavily": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.tavily.com/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ api_key: apiKey, query: "AgentPick health check", max_results: 1 }),
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "exa":
      case "exa-search": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.exa.ai/search", {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": apiKey },
          body: JSON.stringify({ query: "AgentPick health check", numResults: 1 }),
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "serper": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://google.serper.dev/search", {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": apiKey },
          body: JSON.stringify({ q: "AgentPick health check" }),
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "brave": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.search.brave.com/res/v1/web/search?q=AgentPick%20health%20check", {
          headers: { Accept: "application/json", "X-Subscription-Token": apiKey },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "firecrawl": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ url: "https://example.com", formats: ["markdown"] }),
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "jina": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://r.jina.ai/http://example.com", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: typeof data === "string" ? data.slice(0, 180) : data } };
      }
      case "anthropic": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.anthropic.com/v1/models", {
          headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "openai": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "google": {
        const { response, latencyMs, data } = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
          headers: { Accept: "application/json" },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "deepseek": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.deepseek.com/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      default:
        return { ok: false, status: "unsupported", latencyMs: 0, error: `No test probe is configured for ${service}.` };
    }
  } catch (error) {
    return {
      ok: false,
      status: error instanceof Error && error.name === "AbortError" ? "timeout" : "failed",
      latencyMs: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function runToolProbe(service: string, encryptedKey: string, query: string): Promise<ProbeResult> {
  const apiKey = decryptSecret(encryptedKey);
  if (!apiKey) {
    return { ok: false, status: "missing", latencyMs: 0, error: `Missing key for ${service}.` };
  }

  try {
    switch (service) {
      case "tavily": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.tavily.com/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ api_key: apiKey, query, max_results: 3 }),
        });
        const results = ((data as any)?.results ?? []) as Array<any>;
        return { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: results.length } };
      }
      case "exa":
      case "exa-search": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.exa.ai/search", {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": apiKey },
          body: JSON.stringify({ query, numResults: 3 }),
        });
        const results = ((data as any)?.results ?? []) as Array<any>;
        return { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: results.length } };
      }
      case "serper": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://google.serper.dev/search", {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": apiKey },
          body: JSON.stringify({ q: query }),
        });
        const results = ((data as any)?.organic ?? []) as Array<any>;
        return { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: results.length } };
      }
      case "brave": {
        const { response, latencyMs, data } = await fetchWithTimeout(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, {
          headers: { Accept: "application/json", "X-Subscription-Token": apiKey },
        });
        const results = ((data as any)?.web?.results ?? []) as Array<any>;
        return { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: results.length } };
      }
      case "firecrawl": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ query, limit: 3 }),
        });
        const results = ((data as any)?.data ?? []) as Array<any>;
        return { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: results.length } };
      }
      case "jina": {
        const { response, latencyMs } = await fetchWithTimeout(`https://s.jina.ai/${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: response.ok ? 1 : 0 } };
      }
      default:
        return { ok: false, status: "unsupported", latencyMs: 0, error: `No benchmark probe exists for ${service}.` };
    }
  } catch (error) {
    return {
      ok: false,
      status: error instanceof Error && error.name === "AbortError" ? "timeout" : "failed",
      latencyMs: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
