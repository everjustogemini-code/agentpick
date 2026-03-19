// src/app/api/v1/chat/completions/route.ts
// OpenAI-compatible drop-in endpoint.
// Accepts standard OpenAI SDK requests, routes through existing routeRequest(),
// and returns an OpenAI-schema response with AgentPick metadata headers.
// Calls are recorded in DB exactly like normal router calls (via routeRequest internals).

import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { routeRequest } from "@/lib/router";
import type { RouterRequest } from "@/lib/router";
import { checkRateLimit, routerSdkLimiter } from "@/lib/rate-limit";
import { ensureDeveloperAccount, recordRouterCall } from "@/lib/router/sdk";

const TOOL_CAPABILITY_MAP: Record<string, string> = {
  web_search: "search",
  search: "search",
  crawl: "crawl",
  scrape: "crawl",
  embed: "embed",
  embeddings: "embed",
  code: "code",
  translate: "translation",
  finance: "finance",
  ocr: "ocr",
};

export async function POST(req: NextRequest) {
  // 1. Auth — reuse same authenticateAgent used by handler.ts
  let agent: Awaited<ReturnType<typeof authenticateAgent>>;
  try {
    agent = await authenticateAgent(req);
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid API key", type: "invalid_request_error" } },
      { status: 401 }
    );
  }
  if (!agent || !agent.id) {
    return NextResponse.json(
      { error: { message: "Invalid API key", type: "invalid_request_error" } },
      { status: 401 }
    );
  }

  // 2. Rate limit
  const { limited, retryAfter } = await checkRateLimit(routerSdkLimiter, agent.id);
  if (limited) {
    return NextResponse.json(
      { error: { message: "Too many requests", type: "rate_limit_error", retry_after: retryAfter } },
      { status: 429 }
    );
  }

  // 3. Parse OpenAI request body
  let body: { messages?: Array<{ role: string; content: unknown }>; tools?: Array<{ type?: string; function?: { name?: string; description?: string }; name?: string }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body", type: "invalid_request_error" } },
      { status: 400 }
    );
  }
  const { messages = [], tools = [] } = body;

  // 4. Extract capability from tools[]
  let capability = "search"; // default
  for (const tool of tools) {
    const name: string = (tool?.function?.name ?? (tool as { name?: string })?.name ?? "").toLowerCase();
    const mapped = TOOL_CAPABILITY_MAP[name];
    if (mapped) { capability = mapped; break; }
    // keyword fallback on description
    const desc: string = (tool?.function?.description ?? "").toLowerCase();
    for (const [kw, cap] of Object.entries(TOOL_CAPABILITY_MAP)) {
      if (desc.includes(kw)) { capability = cap; break; }
    }
  }

  // 5. Derive query from last user message
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const query: string = typeof lastUser?.content === "string"
    ? lastUser.content
    : JSON.stringify(lastUser?.content ?? "");

  if (!query.trim()) {
    return NextResponse.json(
      { error: { message: "A non-empty query is required", type: "invalid_request_error" } },
      { status: 400 }
    );
  }

  // 6. Load account settings (non-fatal)
  let account: Awaited<ReturnType<typeof ensureDeveloperAccount>> | undefined;
  try {
    account = await ensureDeveloperAccount(agent.id);
  } catch {
    // fail-open
  }

  // 7. Route through existing logic
  const routerRequest: RouterRequest = {
    params: { query },
    strategy: "balanced",
  };

  const start = Date.now();
  let routerResult: Awaited<ReturnType<typeof routeRequest>>;
  try {
    routerResult = await routeRequest(agent.id, capability, routerRequest, {
      developerId: account?.id,
      storedByokKeys: account?.byokKeys,
      excludedTools: account?.excludedTools as string[] | undefined,
      latencyBudgetMs: account?.latencyBudgetMs,
      maxFallbacks: account?.maxFallbacks,
      source: "openai-compat",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Routing failed";
    return NextResponse.json(
      { error: { message, type: "server_error" } },
      { status: 502 }
    );
  }
  const latencyMs = Date.now() - start;
  const { response, headers: extraHeaders } = routerResult;
  const meta = response.meta;
  const result = response.data;

  // 8. Record the call for analytics (best-effort, same as handler.ts)
  if (account) {
    recordRouterCall(
      account.id,
      capability,
      query,
      routerRequest,
      response,
      "BALANCED",
      Boolean(meta.byok_used),
      meta.tried_chain?.length
        ? [...new Set(meta.tried_chain)]
        : [meta.tool_used].filter(Boolean),
      false,
      false,
    ).catch((e) => console.error("[OpenAI-compat] recordRouterCall failed:", e));
  }

  // 9. Return OpenAI-schema response
  const responseHeaders: Record<string, string> = {
    "X-AgentPick-Tool-Used": String(meta.tool_used ?? ""),
    "X-AgentPick-Latency-Ms": String(meta.latency_ms ?? latencyMs),
    "X-AgentPick-Cost-Usd": String(meta.cost_usd ?? "0"),
    "X-AgentPick-Fallback-Used": String(meta.fallback_used ?? false),
    ...(extraHeaders ?? {}),
  };

  return NextResponse.json(
    {
      id: `chatcmpl-${crypto.randomUUID()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: String(meta.tool_used ?? capability),
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: typeof result === "string" ? result : JSON.stringify(result),
        },
        finish_reason: "stop",
      }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    },
    { headers: responseHeaders }
  );
}
