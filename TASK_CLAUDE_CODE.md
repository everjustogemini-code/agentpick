# TASK_CLAUDE_CODE.md — cycle 19
**Agent:** Claude Code (Sonnet 4.6)
**Date:** 2026-03-19
**QA baseline:** 50/51 — P1 open (embed B.1 failing)
**Target:** 51/51
**Scope:** Must-Have #1 backend (router logging + registry cleanup + CI lint + QA script) + Must-Have #3 backend (OpenAI-compat endpoint + DB recording + QA test)
**Do NOT touch:** Any file listed in TASK_CODEX.md

---

## Task 1 — Fix P1: Router Logging + Registry Cleanup (Must-Have #1, backend half)

### 1a. Add structured logging when cohere-embed is skipped

**File:** `src/lib/router/index.ts`

- Locate `routeRequest()` and the tool selection / health-check logic.
- When any tool is deprioritized or skipped during selection, emit:
  ```typescript
  console.log(JSON.stringify({
    event: "tool_skipped",
    tool: skippedToolId,
    capability,
    reason: healthCheckResult ?? "unknown",
    ts: new Date().toISOString(),
  }));
  ```
- This must fire specifically when `cohere-embed` is bypassed so the reason is visible in the ops dashboard log stream.

### 1b. Remove cohere-embed probe if present (retired tool)

**File:** `src/lib/ops/service-probes.ts`

- Search for any probe entry keyed to `cohere-embed` or `cohere`.
- If found: remove the probe entry entirely. Cohere-embed is retired; leaving it causes silent health-check noise that masks real failures.
- If not found: no change needed.

### 1c. Update CI lint test to reflect corrected allowlist

**File:** `src/__tests__/router-registry-sync.test.ts`

- Confirm a test exists that asserts every tool in `CAPABILITY_TOOLS.embed` is present in a `QA_EMBED_ALLOWLIST`.
- The allowlist must be exactly:
  ```typescript
  const QA_EMBED_ALLOWLIST = ["voyage-embed", "cohere-embed"];
  ```
- `voyage-embed` is the current primary; `cohere-embed` stays in the allowlist (not the registry primary) so the QA script B.1 test still accepts it as a valid fallback.
- Do not remove or restructure any other existing tests in this file.

**Acceptance for Task 1:**
- Router logs emit `{"event":"tool_skipped","tool":"cohere-embed",...}` when cohere-embed is bypassed.
- No cohere-embed probe generating spurious health noise.
- CI lint test uses updated allowlist and passes.

---

## Task 2 — Fix P1: QA Script B.1 Embed Test (Must-Have #1, QA half)

**File:** `agentpick-router-qa.py`

### 2a. Replace stale `voyage-ai` references

Scan for every occurrence of the slug `voyage-ai`:
```bash
grep -n "voyage-ai" agentpick-router-qa.py
```
Replace every hit with `voyage-embed`.

### 2b. Ensure B.1 embed test exists with correct allowlist

If a `TestEmbedRouter` class or B.1 embed test does NOT already exist, insert the following **before** the `if __name__ == "__main__":` block:

```python
KEY_EMBED = os.environ.get('QA_TEST_KEY_EMBED', KEY_499)

class TestEmbedRouter(unittest.TestCase):

    def test_b1_embed_tool_used(self):
        """B.1 — embed route must return meta.tool_used in valid_embed_tools."""
        r = requests.post(
            f"{BASE_URL}/api/v1/route/embed",
            headers={"Authorization": f"Bearer {KEY_EMBED}"},
            json={"params": {"query": "semantic similarity for developer tools"}},
            timeout=15,
        )
        self.assertEqual(r.status_code, 200)
        body = r.json()
        valid_embed_tools = ["voyage-embed", "cohere-embed"]  # must match QA_EMBED_ALLOWLIST
        tool_used = body.get("meta", {}).get("tool_used", "")
        self.assertIn(
            tool_used,
            valid_embed_tools,
            f"Expected tool_used in {valid_embed_tools}, got: {tool_used!r}",
        )
```

If it already exists, just update `valid_embed_tools` to `["voyage-embed", "cohere-embed"]`.

**Acceptance for Task 2:**
- `grep "voyage-ai" agentpick-router-qa.py` → 0 hits.
- QA suite reports **51/51**.

---

## Task 3 — New Feature: OpenAI-Compatible Drop-In Endpoint (Must-Have #3, backend)

**Goal:** `POST /v1/chat/completions` accepts standard OpenAI SDK requests, routes through existing `routeRequest()`, returns OpenAI-schema response with AgentPick metadata headers. Calls recorded in DB same as normal router calls.

### 3a. Implement the route

**File:** `src/app/api/v1/chat/completions/route.ts`

Read the current file first; if a stub exists, fully replace it. Implement:

```typescript
// src/app/api/v1/chat/completions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { routeRequest } from "@/lib/router";

export async function POST(req: NextRequest) {
  // 1. Auth
  const authHeader = req.headers.get("authorization") ?? "";
  const apiKey = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!apiKey.startsWith("ap_")) {
    return NextResponse.json(
      { error: { message: "Invalid API key", type: "invalid_request_error" } },
      { status: 401 }
    );
  }

  // 2. Parse OpenAI request body
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: { message: "Invalid JSON body", type: "invalid_request_error" } },
      { status: 400 }
    );
  }
  const { messages = [], tools = [] } = body;

  // 3. Extract capability from tools[]
  const TOOL_CAPABILITY_MAP: Record<string, string> = {
    web_search: "search", search: "search",
    crawl: "crawl", scrape: "crawl",
    embed: "embed", embeddings: "embed",
    code: "code", translate: "translation",
    finance: "finance", ocr: "ocr",
  };
  let capability = "search"; // default
  for (const tool of tools) {
    const name: string = (tool?.function?.name ?? tool?.name ?? "").toLowerCase();
    const mapped = TOOL_CAPABILITY_MAP[name];
    if (mapped) { capability = mapped; break; }
    const desc: string = (tool?.function?.description ?? "").toLowerCase();
    for (const [kw, cap] of Object.entries(TOOL_CAPABILITY_MAP)) {
      if (desc.includes(kw)) { capability = cap; break; }
    }
  }

  // 4. Derive query from last user message
  const lastUser = [...messages].reverse().find((m: { role: string }) => m.role === "user");
  const query: string = typeof lastUser?.content === "string"
    ? lastUser.content
    : JSON.stringify(lastUser?.content ?? "");

  // 5. Route through existing logic
  const start = Date.now();
  let result: unknown;
  let meta: Record<string, unknown> = {};
  try {
    const response = await routeRequest({ capability, query, apiKey });
    result = response.result ?? response;
    meta = response.meta ?? {};
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Routing failed";
    return NextResponse.json(
      { error: { message, type: "server_error" } },
      { status: 502 }
    );
  }
  const latencyMs = Date.now() - start;

  // 6. Return OpenAI-schema response
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
    {
      headers: {
        "X-AgentPick-Tool-Used": String(meta.tool_used ?? ""),
        "X-AgentPick-Latency-Ms": String(meta.latency_ms ?? latencyMs),
        "X-AgentPick-Cost-Usd": String(meta.cost_usd ?? "0"),
        "X-AgentPick-Fallback-Used": String(meta.fallback_used ?? false),
      },
    }
  );
}
```

**Notes:**
- Read `src/lib/router/index.ts` to confirm the exact signature of `routeRequest()` and adapt the call.
- DB call recording: `routeRequest` already writes to DB internally. Do NOT add a second DB write.
- If `routeRequest` does not accept `apiKey` directly, thread it the same way `src/lib/router/handler.ts` does.

### 3b. Add QA test for new endpoint

**File:** `agentpick-router-qa.py`

Append a new test class after `TestEmbedRouter`:

```python
class TestOpenAICompat(unittest.TestCase):

    def test_e1_openai_compat_search(self):
        """E.1 — /v1/chat/completions returns valid OpenAI-schema response."""
        r = requests.post(
            f"{BASE_URL}/v1/chat/completions",
            headers={"Authorization": f"Bearer {KEY_499}"},
            json={
                "model": "agentpick",
                "messages": [{"role": "user", "content": "latest AI agent frameworks 2025"}],
                "tools": [{"type": "function", "function": {
                    "name": "web_search",
                    "description": "search the web",
                    "parameters": {"type": "object", "properties": {}},
                }}],
            },
            timeout=20,
        )
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn("choices", body)
        self.assertTrue(len(body["choices"]) > 0)
        self.assertIn("message", body["choices"][0])
        self.assertTrue(r.headers.get("X-AgentPick-Tool-Used", "") != "")
```

**Acceptance for Task 3:**
- `POST /v1/chat/completions` with a valid `ap_xxx` key returns status 200, valid OpenAI-schema JSON, and all four `X-AgentPick-*` headers.
- Call appears in `/dashboard`.
- QA `TestOpenAICompat.test_e1_openai_compat_search` passes.

---

## Files Owned by CLAUDE CODE This Cycle

| Action | File |
|--------|------|
| Modify | `agentpick-router-qa.py` |
| Modify | `src/lib/router/index.ts` |
| Modify if needed | `src/lib/ops/service-probes.ts` |
| Modify if needed | `src/__tests__/router-registry-sync.test.ts` |
| Modify / implement | `src/app/api/v1/chat/completions/route.ts` |

**DO NOT touch** (Codex-owned this cycle):
- `src/app/page.tsx`
- `src/app/connect/page.tsx`
- `src/components/ConnectTabs.tsx`
- `src/components/HeroCodeBlock.tsx`
- `src/components/PricingSection.tsx`
- `src/components/PricingPageClient.tsx`
- `src/app/pricing/page.tsx`
- `src/components/StatsBar.tsx`
- `src/components/SiteHeader.tsx`
- `src/app/globals.css`

---

## Coverage: Every NEXT_VERSION.md Item Assigned

| NEXT_VERSION.md requirement | Task |
|---|---|
| Must-Have #1 — QA B.1 `valid_embed_tools = ["voyage-embed",...]`; 51/51 | Task 2a/2b |
| Must-Have #1 — Cohere-embed skip reason visible in ops logs | Task 1a |
| Must-Have #1 — Remove cohere-embed if retired | Task 1b |
| Must-Have #1 — CI lint pins `CAPABILITY_TOOLS.embed[0]` to QA allowlist | Task 1c |
| Must-Have #2 — All UI/frontend work | **TASK_CODEX.md** |
| Must-Have #3 — `POST /v1/chat/completions` new route | Task 3a |
| Must-Have #3 — Calls recorded in DB (via routeRequest) | Task 3a |
| Must-Have #3 — QA test E.1 for compat endpoint | Task 3b |
| Must-Have #3 — `/connect` page "Drop-in for OpenAI SDK" section | **TASK_CODEX.md** |
| Must-Have #3 — Nav callout under developer docs | **TASK_CODEX.md** |

---

## Acceptance Criteria

- [ ] `grep "voyage-ai" agentpick-router-qa.py` → 0 hits
- [ ] QA suite reports **51/51**
- [ ] Router logs emit `{"event":"tool_skipped","tool":"cohere-embed",...}` when cohere-embed is bypassed
- [ ] `src/app/api/v1/chat/completions/route.ts` handles `POST /v1/chat/completions`
- [ ] Response includes `choices[0].message.content` and all four `X-AgentPick-*` response headers
- [ ] Dashboard shows calls made via the compat endpoint
- [ ] QA `TestOpenAICompat.test_e1_openai_compat_search` passes

---

## Progress Log

After each task, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] <brief description>
```
