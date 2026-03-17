# TASK_CLAUDE_CODE.md
**Cycle:** 9
**Agent:** Claude Code
**Date:** 2026-03-17
**Source:** NEXT_VERSION.md — Must-Have #1 (CI restore) + Must-Have #3 (OpenAI-compat endpoint)

---

## Coverage Summary

| Must-Have | Item | Owner |
|-----------|------|-------|
| #1 | Restore `.github/workflows/ci.yml` to `main` | **CLAUDE CODE** |
| #2 | Glassmorphism UI upgrade (pure frontend) | Codex |
| #3 | `POST /v1/chat/completions` endpoint (new files) | **CLAUDE CODE** |
| #3 | `src/lib/openai-compat.ts` request normalizer + response shaper | **CLAUDE CODE** |
| #3 | 3 new vitest tests for the new endpoint | **CLAUDE CODE** |
| #3 | `public/llms.txt` documentation update | **CLAUDE CODE** |
| #3 | `src/components/HeroCodeBlock.tsx` snippet swap | Codex |

---

## Files to Create / Modify

| Action | File |
|--------|------|
| COMMIT (already on disk, untracked) | `.github/workflows/ci.yml` |
| **CREATE** | `src/app/v1/chat/completions/route.ts` |
| **CREATE** | `src/lib/openai-compat.ts` |
| **CREATE** | `src/__tests__/openai-compat.test.ts` |
| **MODIFY** | `public/llms.txt` |

> **DO NOT TOUCH** any file listed in the TASK_CODEX.md "Files to Create/Modify" table.
> Specifically: `src/app/globals.css`, `src/app/page.tsx`, `src/app/layout.tsx`,
> `src/components/SiteHeader.tsx`, `src/components/HeroCodeBlock.tsx`,
> `src/components/ProductCard.tsx`, `src/components/ScoreBreakdown.tsx`,
> `src/components/StrategyCards.tsx`, `src/components/PricingSection.tsx`,
> `src/app/rankings/page.tsx`.

---

## Task 1 — Restore CI (`/.github/workflows/ci.yml`)

`git status` shows `.github/` as **untracked** (`?? .github/`).
The file `.github/workflows/ci.yml` exists on disk but was not committed (deleted in commit `d2238178`).

**Action:** Stage and commit `.github/workflows/ci.yml` to `main`.

Before committing, open the file and confirm it contains at minimum:
- `on: push: branches: [main]` trigger
- A job step that runs `npm test` or `npx vitest run`

If the file is missing those, add them. The NEXT_VERSION.md spec example:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      BENCHMARK_SECRET: test-secret
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

**Acceptance:** `ci.yml` on `main`; CI runs on next push; all 51+ tests pass in CI.

---

## Task 2 — New File: `src/lib/openai-compat.ts`

Request normalizer + response shaper. No dependencies outside the existing codebase.

```typescript
// Types
export interface ParsedOpenAIRequest {
  query: string        // extracted from messages[-1].content
  domain: string       // inferred or pinned from model string
  capability: string   // e.g. "search", "finance", "auto"
  stream: boolean
  model: string        // original model field, e.g. "agentpick/auto"
}

export interface OpenAIChatCompletion {
  id: string                  // "chatcmpl-" + random
  object: "chat.completion"
  created: number             // Unix seconds
  model: string
  choices: Array<{
    index: number
    message: { role: "assistant"; content: string }
    finish_reason: "stop"
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  "x-agentpick-tool": string
  "x-agentpick-latency-ms": number
}

export interface OpenAIChatCompletionChunk {
  id: string
  object: "chat.completion.chunk"
  created: number
  model: string
  choices: Array<{
    index: number
    delta: { content?: string; role?: "assistant" }
    finish_reason: "stop" | null
  }>
}

// Functions to implement:

/**
 * Parse an incoming OpenAI-format request body.
 * Extracts the last user message as query.
 * Derives capability from model: "agentpick/search" → "search", "agentpick/auto" → "auto".
 */
export function parseOpenAIRequest(body: unknown): ParsedOpenAIRequest

/**
 * Shape a router result into an OpenAI chat.completions response object.
 */
export function shapeOpenAIResponse(opts: {
  content: string
  tool: string
  latencyMs: number
  model: string
}): OpenAIChatCompletion

/**
 * Yield SSE lines for a streaming response.
 * Format: "data: <JSON>\n\n" for each chunk, then "data: [DONE]\n\n".
 * Splits content into ~10-word chunks to simulate streaming.
 */
export async function* streamOpenAIChunks(opts: {
  content: string
  tool: string
  model: string
}): AsyncGenerator<string>
```

Token counts: estimate `prompt_tokens` as `Math.ceil(query.length / 4)`,
`completion_tokens` as `Math.ceil(content.length / 4)`, sum for `total_tokens`.

---

## Task 3 — New File: `src/app/v1/chat/completions/route.ts`

Next.js App Router POST handler at `/v1/chat/completions`.
Reuse existing utilities — **no new auth surface, no new billing logic**.

Implementation:

```typescript
export async function POST(req: Request): Promise<Response>
```

Steps inside the handler:
1. Read `Authorization: Bearer <key>` header → call `validateApiKey()` from `src/lib/auth.ts`.
   Return `401` on invalid key (use the same error shape as other API routes).
2. Parse request body via `parseOpenAIRequest()` from `src/lib/openai-compat.ts`.
3. Route via existing `routeToBestTool()` in `src/lib/router/handler.ts`.
   Pass `capability` as the domain hint. `"auto"` = fully automatic.
4. Meter usage via the same billing path as `/api/v1/route/*` (no new billing code).
5. If `stream: false` → return `Response.json(shapeOpenAIResponse(...))` with headers:
   - `x-agentpick-tool: <tool>`
   - `x-agentpick-latency-ms: <number>`
6. If `stream: true` → return a `ReadableStream` response with `Content-Type: text/event-stream`,
   yielding from `streamOpenAIChunks(...)`.
7. Non-tool / general LLM queries: fall through to `process.env.FALLBACK_MODEL ?? "gpt-4o-mini"`.
   Include in the response `model` field but still shape as `OpenAIChatCompletion`.

---

## Task 4 — New File: `src/__tests__/openai-compat.test.ts`

Exactly **3 vitest tests**. Follow the same import/setup patterns as other tests in `src/__tests__/`.

```typescript
// Test 1 — Normal (non-streaming) request returns valid OpenAI response shape
it('POST /v1/chat/completions stream:false returns valid OpenAI response', async () => {
  // Call the route handler directly (or via fetch to localhost if other tests do that).
  // Assert:
  //   response.status === 200
  //   body.id starts with "chatcmpl-"
  //   body.object === "chat.completion"
  //   body.choices[0].message.role === "assistant"
  //   typeof body.choices[0].message.content === "string"
  //   body.usage.total_tokens > 0
})

// Test 2 — Streaming request returns SSE
it('POST /v1/chat/completions stream:true returns text/event-stream', async () => {
  // Assert:
  //   response.headers.get('content-type') includes "text/event-stream"
  //   Response body text includes "data: " and ends with "data: [DONE]"
})

// Test 3 — Invalid API key returns 401
it('POST /v1/chat/completions with invalid key returns 401', async () => {
  // Send Authorization: Bearer invalid-key-xyz
  // Assert: response.status === 401
})
```

---

## Task 5 — Update `public/llms.txt`

Read the file first. Append the following block at the end (do not replace existing content):

```
## OpenAI-Compatible Endpoint (added cycle 9)

POST /v1/chat/completions
Authorization: Bearer <agentpick-router-key>

Drop-in replacement for OpenAI chat completions. Point any OpenAI SDK at AgentPick:

  import OpenAI from 'openai'
  const client = new OpenAI({ baseURL: 'https://agentpick.dev/v1', apiKey: '<your-key>' })
  const res = await client.chat.completions.create({
    model: 'agentpick/auto',
    messages: [{ role: 'user', content: 'What is the AAPL stock price?' }],
  })

Supported model strings:
  agentpick/auto      — automatic routing (recommended)
  agentpick/search    — pin to web search capability
  agentpick/finance   — pin to finance/market data capability
  agentpick/<domain>  — pin to any supported capability

Streaming: supported (stream: true → SSE, data: [DONE] terminator)
Auth: same API keys as /api/v1/route/*
Metering: identical to /api/v1/route/* calls
Response: OpenAI-compatible schema + x-agentpick-tool + x-agentpick-latency-ms extensions
```

---

## Acceptance Criteria

- [ ] `.github/workflows/ci.yml` committed to `main`; CI runs on next push; 51+ tests pass
- [ ] `POST /v1/chat/completions` with valid key + `stream: false` → OpenAI-shaped JSON (`id`, `object`, `choices`, `usage`)
- [ ] `POST /v1/chat/completions` with `stream: true` → `text/event-stream`, ends with `data: [DONE]`
- [ ] Invalid key → `401`
- [ ] `npx vitest run` passes (3 new tests + all 51 existing)
- [ ] `public/llms.txt` documents the new endpoint
- [ ] Zero files from TASK_CODEX.md were modified
