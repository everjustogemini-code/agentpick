# TASK_CLAUDE_CODE.md — Cycle 8
**Agent:** Claude Code (Sonnet 4.6)
**Source:** NEXT_VERSION.md (2026-03-18, cycle 8)
**QA baseline:** 50/51 — P1 open (B.1-embed slug mismatch)
**Scope:** Must-Have #1 backend fix + Must-Have #3 new endpoint (backend only)
**Must NOT touch:** `agentpick-router-qa.py`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/benchmarks/`, `src/app/rankings/`, `src/app/agents/`, `src/app/dashboard/`, `src/app/connect/`, `src/components/`

---

## Task 1 — Fix P1: Align `voyage-embed` Slug in Backend (Option A)

**Goal:** `POST /api/v1/route/embed` must return `tool_used: "voyage-ai"`. Apply Option A: update the backend adapter to emit `"voyage-ai"`.

### Files to modify:

**1a. `src/lib/benchmark/adapters/voyage-embed.ts`**

Find the adapter's name/slug identifier (typically a `name`, `id`, `slug`, or `tool_used` constant near the top of the file, or inside the exported adapter object/class). Change the value from `"voyage-embed"` → `"voyage-ai"`.

Example pattern to find and fix:
```ts
// before
export const voyageEmbedAdapter = { name: 'voyage-embed', ... }
// after
export const voyageEmbedAdapter = { name: 'voyage-ai', ... }
```

**1b. `src/app/api/v1/route/embed/route.ts`**

Search for any hardcoded `"voyage-embed"` string in this file's response construction or tool selection logic. Replace all occurrences with `"voyage-ai"`.

**1c. `src/lib/router/handler.ts`**

Search for `"voyage-embed"` in the handler's routing logic or response builder. Replace with `"voyage-ai"`. (You may already be editing this file for Task 2 below — do both changes in one pass.)

**1d. `src/app/api/v1/sdk/snippets/route.ts`** (created in cycle 7)

Find the embed-related snippet example. It likely contains `tool_used: "voyage-embed"` or `tool: "voyage-embed"` in a sample response object. Update to `"voyage-ai"`.

### Verification:
```bash
grep -r "voyage-embed" src/
```
Must return zero results.

---

## Task 2 — New OpenAI-Compatible Proxy Endpoint (`POST /v1/responses`)

**Goal:** Zero-migration adoption path. Developers change only `base_url`; AgentPick routes automatically. Usage tagged as `source: "openai-compat"` in dashboard.

### Files to create:

**2a. `src/app/v1/responses/route.ts`** ← NEW FILE (top-level `/v1/`, not `/api/v1/`)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { parseOpenAIRequest, buildOpenAIResponse } from '@/lib/openai-compat';
import { validateApiKey } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { routeRequest } from '@/lib/router/handler';

export async function POST(req: NextRequest) {
  const startMs = Date.now();

  // 1. Auth — reuse existing Bearer key validation
  const authHeader = req.headers.get('authorization') ?? '';
  const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  const keyResult = await validateApiKey(apiKey);
  if (!keyResult.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Rate limit — same plan limits as /api/v1/route/*
  const limited = await checkRateLimit(keyResult.keyId);
  if (limited) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // 3. Parse OpenAI-format request body
  const body = await req.json();
  const { query, capability } = parseOpenAIRequest(body);

  // 4. Route through AgentPick
  const routingResult = await routeRequest({
    capability,
    query,
    keyId: keyResult.keyId,
    source: 'openai-compat',   // ← tag for dashboard
  });

  const latencyMs = Date.now() - startMs;
  const traceId = routingResult.traceId ?? crypto.randomUUID();

  // 5. Return OpenAI-compatible envelope
  const response = buildOpenAIResponse(routingResult, traceId, body.model ?? 'auto');

  return NextResponse.json(response, {
    headers: {
      'x-agentpick-tool-used': routingResult.tool_used ?? '',
      'x-agentpick-latency-ms': String(latencyMs),
      'x-agentpick-trace-id': traceId,
    },
  });
}
```

### Files to modify:

**2b. `src/lib/openai-compat.ts`** (already exists — extend it)

Add / update these exports:

```ts
// Parse OpenAI Responses API body → AgentPick routing params
export function parseOpenAIRequest(body: {
  model?: string;
  input?: string | { role: string; content: string }[];
  tools?: unknown[];
}): { query: string; capability: string } {
  const input = body.input;
  const query = typeof input === 'string'
    ? input
    : Array.isArray(input)
      ? input.map((m) => (typeof m === 'object' && m !== null && 'content' in m ? (m as { content: string }).content : '')).join(' ')
      : '';

  // Infer capability from tools[] or default to 'search'
  const toolNames = (body.tools ?? []).map((t: unknown) => {
    if (typeof t === 'object' && t !== null && 'type' in t) return (t as { type: string }).type;
    return '';
  });
  const capability =
    toolNames.some((n) => n.includes('embed')) ? 'embed' :
    toolNames.some((n) => n.includes('crawl')) ? 'crawl' :
    'search';

  return { query, capability };
}

// Wrap AgentPick routing result in OpenAI Responses API envelope
export function buildOpenAIResponse(
  result: { tool_used?: string; results?: unknown[]; latency_ms?: number },
  traceId: string,
  model: string,
) {
  return {
    id: `resp_${traceId}`,
    object: 'response',
    model,
    output: [
      {
        type: 'text',
        text: JSON.stringify(result.results ?? []),
      },
    ],
    usage: { input_tokens: 0, output_tokens: 0 },  // placeholder
  };
}
```

**2c. `src/lib/router/handler.ts`**

Add `source?: string` to the routing request type/interface (or whatever request shape `routeRequest` accepts). When `source` is provided, pass it through to the usage/analytics write so the dashboard can filter by it.

This file is also modified in Task 1c above — do all three changes in one pass.

**2d. `src/lib/ops/usage.ts`**

Add `"openai-compat"` to the `source` field's allowed values (union type, enum, or Prisma enum). If the DB schema needs a migration, create a Prisma migration file or add a comment `// TODO: run prisma migrate for source enum`.

**2e. `src/app/api/v1/openapi.json`** (if it exists as an editable static file)

Add a path entry for `POST /v1/responses` with a brief request/response schema. If the file is auto-generated, skip this step and add a code comment in `src/app/v1/responses/route.ts` documenting the schema.

---

## Files to Create/Modify (summary)

| Action | File | Task |
|--------|------|------|
| MODIFY | `src/lib/benchmark/adapters/voyage-embed.ts` | 1a — slug → "voyage-ai" |
| MODIFY | `src/app/api/v1/route/embed/route.ts` | 1b — slug → "voyage-ai" |
| MODIFY | `src/lib/router/handler.ts` | 1c + 2c — slug fix + source field |
| MODIFY | `src/app/api/v1/sdk/snippets/route.ts` | 1d — example slug → "voyage-ai" |
| CREATE | `src/app/v1/responses/route.ts` | 2a — OpenAI-compat proxy |
| MODIFY | `src/lib/openai-compat.ts` | 2b — add parse/build helpers |
| MODIFY | `src/lib/ops/usage.ts` | 2d — allow source = "openai-compat" |
| MODIFY | `src/app/api/v1/openapi.json` (if static) | 2e — add /v1/responses spec |

---

## Verification Checklist (Claude Code)

- [ ] `grep -r "voyage-embed" src/` returns zero results
- [ ] `POST /api/v1/route/embed` returns `tool_used: "voyage-ai"` in response body
- [ ] `POST /v1/responses` with valid Bearer key returns OpenAI-format JSON (`id`, `object`, `model`, `output` fields)
- [ ] Response includes headers: `x-agentpick-tool-used`, `x-agentpick-latency-ms`, `x-agentpick-trace-id`
- [ ] Usage row written with `source = "openai-compat"` (verify in DB or analytics log)
- [ ] `POST /v1/responses` with invalid key returns 401
- [ ] QA 51/51 (after Codex updates `agentpick-router-qa.py` valid list)
