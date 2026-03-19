# TASK_CLAUDE_CODE.md — Cycle 6 (Backend / API)

**Agent:** Claude Code
**Source:** NEXT_VERSION.md (2026-03-18)
**QA baseline:** 50/51 — 1 open P1 (QA script typo, assigned to Codex)
**Do NOT touch any file listed in TASK_CODEX.md**

---

## Files to Create / Modify

| Action | File |
|--------|------|
| MODIFY | `src/app/mcp/route.ts` |
| MODIFY | `src/lib/router/handler.ts` |
| MODIFY | `src/lib/router/sdk.ts` |
| MODIFY (if needed) | `prisma/schema.prisma` + new migration |

---

## Task 1 — Add `agentpick_search` to MCP Server + `source: "mcp"` Tracking (Must-Have #3, backend)

### Context
`GET /mcp` already returns a valid MCP 1.0 JSON-RPC manifest with 8 tools
(`src/app/mcp/route.ts`). The spec requires a 9th tool — `agentpick_search` — that
internally calls `POST /api/v1/route/search` with the caller's `Authorization` header
passed through. MCP-sourced calls must be stored with `source: "mcp"` so they appear
tagged in `/usage` and the dashboard.

---

### 1a — Add `agentpick_search` tool definition to `SERVER_INFO`

**File:** `src/app/mcp/route.ts`

In `SERVER_INFO.tools` (currently ends at line ~192), append one new tool object
**before** the closing `]`:

```ts
{
  name: 'agentpick_search',
  description:
    'Route a search query to the best AI search tool for your use case, selected by AgentPick rankings. Requires Authorization: Bearer ah_live_sk_... header.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to route',
      },
      strategy: {
        type: 'string',
        enum: ['balanced', 'best_performance', 'cheapest'],
        default: 'balanced',
        description: 'Routing strategy',
      },
      domain: {
        type: 'string',
        description: 'Optional domain hint (e.g. "finance", "legal", "ecommerce")',
      },
      type: {
        type: 'string',
        description: 'Optional result type filter',
      },
    },
    required: ['query'],
  },
},
```

---

### 1b — Implement `agentpickSearch` handler

**File:** `src/app/mcp/route.ts`

Add the following async function after `arenaCompare` (~line 460):

```ts
async function agentpickSearch(
  args: { query: string; strategy?: string; domain?: string; type?: string },
  authHeader: string | null,
) {
  if (!authHeader || !authHeader.startsWith('Bearer ah_')) {
    return { error: 'Authorization: Bearer ah_live_sk_... header required for agentpick_search.' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  let httpRes: Response;
  try {
    httpRes = await fetch(`${appUrl}/api/v1/route/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        'x-mcp-source': 'true',
      },
      body: JSON.stringify({
        params: {
          query: args.query,
          ...(args.strategy ? { strategy: args.strategy } : {}),
        },
        ...(args.domain ? { domain: args.domain } : {}),
        ...(args.type   ? { type: args.type }     : {}),
      }),
    });
  } catch (err) {
    return { error: `Internal fetch failed: ${String(err)}` };
  }

  const body = await httpRes.json();
  if (!httpRes.ok) {
    return { error: body?.error ?? `Search failed (HTTP ${httpRes.status})`, status: httpRes.status };
  }
  return body;
}
```

---

### 1c — Update `handleMCPRequest` to accept and forward the auth header

**File:** `src/app/mcp/route.ts`

1. Change the function signature at line ~669 from:
   ```ts
   async function handleMCPRequest(req: MCPRequest) {
   ```
   to:
   ```ts
   async function handleMCPRequest(req: MCPRequest, authHeader: string | null) {
   ```

2. Inside the `tools/call` switch (after the `arena_compare` case, ~line 701), add:
   ```ts
   case 'agentpick_search':
     result = await agentpickSearch(
       args as Parameters<typeof agentpickSearch>[0],
       authHeader,
     );
     break;
   ```

3. In the `POST` handler (~line 747), update the call site to pass the header:
   ```ts
   // Before:
   const response = await handleMCPRequest(body);
   // After:
   const response = await handleMCPRequest(body, request.headers.get('authorization'));
   ```

---

### 1d — Read `x-mcp-source` header in the route handler and pass `source` downstream

**File:** `src/lib/router/handler.ts`

In `handleRouteRequest` (starts at ~line 67), after headers are read but before calling
`recordRouterCall`, add:

```ts
const isMcpSource = request.headers.get('x-mcp-source') === 'true';
```

Then pass `isMcpSource` to `recordRouterCall`. Find both call sites (~lines 312, 374) and
add `isMcpSource` as the final argument. The function signature change is in step 1e.

---

### 1e — Accept `source` in `recordRouterCall` and write it to the DB

**File:** `src/lib/router/sdk.ts`

1. Add an optional `isMcpSource = false` parameter at the end of `recordRouterCall`
   signature (line ~302):
   ```ts
   export async function recordRouterCall(
     developerId: string,
     capability: string,
     query: string,
     request: RouterRequest,
     response: InternalRouterResponse,
     strategyUsed: RouterStrategyValue,
     byokUsed: boolean,
     fallbackChain: string[],
     isOverageCall = false,
     isMcpSource = false,       // ← add this
   ) {
   ```

2. In `fullData` (~line 323), add:
   ```ts
   source: isMcpSource ? 'mcp' : 'router',
   ```

---

### 1f — Ensure `RouterCall` schema has a `source` field

**File:** `prisma/schema.prisma`

Check the `RouterCall` model. If `source` is not present, add:
```prisma
source   String  @default("router")
```

Then run:
```bash
npx prisma migrate dev --name add-router-call-source
npx prisma generate
```

If the field already exists, skip the migration.

---

### Acceptance

- `GET /mcp` JSON includes `agentpick_search` in the `tools` array
- `POST /mcp` `tools/call` with `{ name: "agentpick_search", arguments: { query: "…" } }` and
  valid `Authorization: Bearer ah_live_sk_...` header returns `{ tool_used, latency_ms, results[] }`
- RouterCall row from an MCP call has `source = "mcp"`; direct API call has `source = "router"` (no regression)
- QA 51/51 stays green (the P1 voyage-embed fix is in Codex's task)

---

## Verification Checklist (Claude Code)

- [ ] `agentpick_search` tool definition appended to `SERVER_INFO.tools` in `src/app/mcp/route.ts`
- [ ] `agentpickSearch()` handler implemented with auth guard and `x-mcp-source` passthrough
- [ ] `handleMCPRequest` accepts `authHeader` and passes it to `agentpickSearch`
- [ ] `POST /mcp` call site passes `request.headers.get('authorization')`
- [ ] `handleRouteRequest` reads `x-mcp-source` header and passes `isMcpSource` to `recordRouterCall`
- [ ] `recordRouterCall` writes `source: isMcpSource ? 'mcp' : 'router'` to DB
- [ ] Schema migration created if `RouterCall.source` did not exist
- [ ] Zero overlap with files in TASK_CODEX.md

---

## DO NOT TOUCH (owned by Codex)

- `agentpick-router-qa.py`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/connect/page.tsx`
- `src/app/benchmarks/page.tsx`
- `src/app/rankings/page.tsx`
- `src/app/agents/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/RouterAnalyticsDashboard.tsx`
- `src/components/dashboard/UsagePanel.tsx`
