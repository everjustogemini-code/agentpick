import { decryptSecret } from "./crypto";
import { trackVaultUsage } from "./usage";
import { extractTicker } from "@/lib/benchmark/adapters/polygon";

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
    const resolvedSvc = SLUG_TO_PROBE_SERVICE[service] || service;
    switch (resolvedSvc) {
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
      // --- New search probes ---
      case "perplexity": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "sonar", messages: [{ role: "user", content: "health check" }], max_tokens: 10 }),
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "you": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.ydc-index.io/search?query=health+check&num_web_results=1", {
          headers: { "X-API-Key": apiKey, Accept: "application/json" },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "serpapi": {
        const { response, latencyMs, data } = await fetchWithTimeout(`https://serpapi.com/search.json?q=health+check&engine=google&num=1&api_key=${apiKey}`, {
          headers: { Accept: "application/json" },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "bing": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.bing.microsoft.com/v7.0/search?q=health+check&count=1", {
          headers: { "Ocp-Apim-Subscription-Key": apiKey, Accept: "application/json" },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      // --- Crawling probes ---
      case "apify": {
        const { response, latencyMs, data } = await fetchWithTimeout(`https://api.apify.com/v2/acts?token=${apiKey}&limit=1`, {
          headers: { Accept: "application/json" },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "scrapingbee": {
        const { response, latencyMs, data } = await fetchWithTimeout(`https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=https://example.com&render_js=false`, {});
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: typeof data === "string" ? data.slice(0, 180) : data } };
      }
      case "browserbase": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://www.browserbase.com/v1/sessions?limit=1", {
          headers: { "x-bb-api-key": apiKey, Accept: "application/json" },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      // --- Finance probes ---
      case "polygon": {
        const { response, latencyMs, data } = await fetchWithTimeout(`https://api.polygon.io/v2/aggs/ticker/AAPL/prev?adjusted=true&apiKey=${apiKey}`, {
          headers: { Accept: "application/json" },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "alphavantage": {
        const { response, latencyMs, data } = await fetchWithTimeout(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&outputsize=compact&apikey=${apiKey}`, {
          headers: { Accept: "application/json" },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "fmp": {
        const { response, latencyMs, data } = await fetchWithTimeout(`https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${apiKey}`, {
          headers: { Accept: "application/json" },
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      // --- Embedding probes ---
      case "cohere": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.cohere.com/v1/embed", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "embed-english-v3.0", texts: ["health check"], input_type: "search_query", truncate: "END" }),
        });
        return { ok: response.ok, status: response.ok ? "active" : "failed", latencyMs, details: { sample: data } };
      }
      case "voyage": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.voyageai.com/v1/embeddings", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "voyage-3", input: ["health check"], input_type: "query" }),
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

// Maps product slugs to the service names used in probe switch cases
const SLUG_TO_PROBE_SERVICE: Record<string, string> = {
  "polygon-io": "polygon",
  "alpha-vantage": "alphavantage",
  "financial-modeling-prep": "fmp",
  "perplexity-api": "perplexity",
  "perplexity-search": "perplexity",
  "you-search": "you",
  "serpapi-google": "serpapi",
  "bing-web-search": "bing",
  "voyage-embed": "voyage",
  "jina-embed": "jina",
  "edenai-embed": "edenai",
  "apify-scraper": "apify",
  "scrapingbee-api": "scrapingbee",
  "browserbase-api": "browserbase",
  "exa-search": "exa",
  "jina-ai": "jina",
  "firecrawl-api": "firecrawl",
  "brave-search": "brave",
  "serper-api": "serper",
};

export async function runToolProbe(service: string, encryptedKey: string, query: string): Promise<ProbeResult> {
  const resolvedService = SLUG_TO_PROBE_SERVICE[service] || service;
  const apiKey = decryptSecret(encryptedKey);
  if (!apiKey) {
    return { ok: false, status: "missing", latencyMs: 0, error: `Missing key for ${service}.` };
  }

  try {
    let result: ProbeResult;
    switch (resolvedService) {
      case "tavily": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.tavily.com/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ api_key: apiKey, query, max_results: 3 }),
        });
        const results = ((data as any)?.results ?? []) as Array<any>;
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: results.length } };
        break;
      }
      case "exa":
      case "exa-search": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.exa.ai/search", {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": apiKey },
          body: JSON.stringify({ query, numResults: 3 }),
        });
        const results = ((data as any)?.results ?? []) as Array<any>;
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: results.length } };
        break;
      }
      case "serper": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://google.serper.dev/search", {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": apiKey },
          body: JSON.stringify({ q: query }),
        });
        const results = ((data as any)?.organic ?? []) as Array<any>;
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: results.length } };
        break;
      }
      case "brave": {
        const { response, latencyMs, data } = await fetchWithTimeout(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, {
          headers: { Accept: "application/json", "X-Subscription-Token": apiKey },
        });
        const results = ((data as any)?.web?.results ?? []) as Array<any>;
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: results.length } };
        break;
      }
      case "firecrawl": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ query, limit: 3 }),
        });
        const results = ((data as any)?.data ?? []) as Array<any>;
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: results.length } };
        break;
      }
      case "jina": {
        const { response, latencyMs } = await fetchWithTimeout(`https://s.jina.ai/${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: response.ok ? 1 : 0 } };
        break;
      }
      // --- New search probes ---
      case "perplexity": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "sonar", messages: [{ role: "user", content: query }], max_tokens: 256, return_citations: true }),
        });
        const citations = ((data as any)?.citations ?? []) as Array<any>;
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: citations.length || (response.ok ? 1 : 0) } };
        break;
      }
      case "you": {
        const { response, latencyMs, data } = await fetchWithTimeout(`https://api.ydc-index.io/search?query=${encodeURIComponent(query)}&num_web_results=3`, {
          headers: { "X-API-Key": apiKey, Accept: "application/json" },
        });
        const hits = ((data as any)?.hits ?? []) as Array<any>;
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: hits.length } };
        break;
      }
      case "serpapi": {
        const { response, latencyMs, data } = await fetchWithTimeout(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=google&num=3&api_key=${apiKey}`, {
          headers: { Accept: "application/json" },
        });
        const organic = ((data as any)?.organic_results ?? []) as Array<any>;
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: organic.length } };
        break;
      }
      case "bing": {
        const { response, latencyMs, data } = await fetchWithTimeout(`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=3`, {
          headers: { "Ocp-Apim-Subscription-Key": apiKey, Accept: "application/json" },
        });
        const webResults = ((data as any)?.webPages?.value ?? []) as Array<any>;
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: webResults.length } };
        break;
      }
      // --- Crawling probes ---
      case "apify": {
        const { response, latencyMs, data } = await fetchWithTimeout(`https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items?token=${apiKey}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ startUrls: [{ url: query.startsWith("http") ? query : `https://${query}` }], maxPagesPerCrawl: 1 }),
        }, 60000);
        const items = Array.isArray(data) ? data : [];
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: items.length } };
        break;
      }
      case "scrapingbee": {
        const { response, latencyMs } = await fetchWithTimeout(`https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(query.startsWith("http") ? query : `https://${query}`)}&render_js=true`, {}, 45000);
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: response.ok ? 1 : 0 } };
        break;
      }
      case "browserbase": {
        // Simplified probe — just create+delete a session to test connectivity
        const { response, latencyMs } = await fetchWithTimeout("https://www.browserbase.com/v1/sessions", {
          method: "POST",
          headers: { "content-type": "application/json", "x-bb-api-key": apiKey },
          body: JSON.stringify({ projectId: process.env.BROWSERBASE_PROJECT_ID || "default" }),
        });
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: response.ok ? 1 : 0 } };
        break;
      }
      // --- Finance probes ---
      case "polygon": {
        const ticker = extractTicker(query);
        const encodedTicker = encodeURIComponent(ticker);
        const { response, latencyMs, data } = await fetchWithTimeout(`https://api.polygon.io/v2/aggs/ticker/${encodedTicker}/prev?adjusted=true&apiKey=${apiKey}`, {
          headers: { Accept: "application/json" },
        }, 10000);
        const results = ((data as any)?.results ?? []) as Array<any>;
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: results.length } };
        break;
      }
      case "alphavantage": {
        const ticker = extractTicker(query);
        const { response, latencyMs, data } = await fetchWithTimeout(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=compact&apikey=${apiKey}`, {
          headers: { Accept: "application/json" },
        });
        const tsKey = Object.keys((data as any) || {}).find((k: string) => k.startsWith("Time Series"));
        const count = tsKey ? Object.keys(((data as any)[tsKey]) || {}).length : 0;
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: count } };
        break;
      }
      case "fmp": {
        const ticker = extractTicker(query);
        const { response, latencyMs, data } = await fetchWithTimeout(`https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${apiKey}`, {
          headers: { Accept: "application/json" },
        });
        const results = Array.isArray(data) ? data : [];
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: results.length } };
        break;
      }
      // --- Embedding probes ---
      case "cohere": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.cohere.com/v1/embed", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "embed-english-v3.0", texts: [query], input_type: "search_query", truncate: "END" }),
        });
        const embeddings = ((data as any)?.embeddings ?? []) as Array<any>;
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: embeddings.length } };
        break;
      }
      case "voyage": {
        const { response, latencyMs, data } = await fetchWithTimeout("https://api.voyageai.com/v1/embeddings", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "voyage-3", input: [query], input_type: "query" }),
        });
        const embeddings = ((data as any)?.data ?? []) as Array<any>;
        result = { ok: response.ok, status: response.ok ? "completed" : "failed", latencyMs, details: { results: embeddings.length } };
        break;
      }
      default:
        return { ok: false, status: "unsupported", latencyMs: 0, error: `No benchmark probe exists for ${service}.` };
    }

    // Fire-and-forget usage tracking for vault keys
    const vaultService = service === "exa-search" ? "exa" : service;
    trackVaultUsage(vaultService).catch(() => {});

    return result;
  } catch (error) {
    return {
      ok: false,
      status: error instanceof Error && error.name === "AbortError" ? "timeout" : "failed",
      latencyMs: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
