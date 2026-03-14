# TASK_CLAUDE_CODE.md
**Agent:** Claude Code
**Date:** 2026-03-14
**Source:** NEXT_VERSION.md — Bugfix Cycle 5 (QA Round 7, score 37/49)

---

## Files to Modify / Create

| Action | File |
|--------|------|
| MODIFY | `src/lib/router/sdk-handler.ts` |
| VERIFY / MODIFY | `prisma/schema.prisma` |
| MODIFY | `src/middleware.ts` |
| MODIFY | `next.config.ts` |
| VERIFY / MODIFY | `src/lib/router/index.ts` |
| VERIFY / MODIFY | `src/lib/router/sdk.ts` |
| MODIFY (export) | `src/app/mcp/route.ts` |
| CREATE | `src/app/api/v1/mcp/tools/list/route.ts` |

**DO NOT TOUCH:** `src/components/**`, `src/app/dashboard/**`, `src/app/playground/**`, or any other frontend file.

---

## Bug P0-2 — `toolUsed` empty/unknown in `/api/v1/router/calls`

### Fix 1 — `src/lib/router/sdk-handler.ts:186` (and ~line 242)

Both `.catch(() => {})` calls silently swallow DB write errors, causing records to be stored with default/empty `toolUsed`. Change both occurrences:

```typescript
// BEFORE:
).catch(() => {});

// AFTER:
).catch((e) => console.error('[recordRouterCall] write failed:', e));
```

### Fix 2 — `src/lib/router/sdk-handler.ts` error-path catch block (~line 220)

The inline `tool_used` computation uses hardcoded `'balanced'` instead of the actual `coreStrategy`. Replace the inline expression with a named variable:

```typescript
// BEFORE (line ~220):
tool_used: modifiedRequest.tool ?? modifiedRequest.priority_tools?.[0] ?? getRankedToolsForCapability(capability, 'balanced')[0] ?? `${capability}-unavailable`,

// AFTER:
// Add ABOVE the failureResponse object:
const resolvedToolUsed =
  modifiedRequest.tool ??
  modifiedRequest.priority_tools?.[0] ??
  getRankedToolsForCapability(capability, coreStrategy)[0] ??
  capability;

// In failureResponse.meta:
tool_used: resolvedToolUsed,
```

### Fix 3 — `prisma/schema.prisma`

Read the schema and verify `RouterCall.toolUsed` is `String` (non-nullable). If it is `String?` (nullable):
1. Change to `String @default("")`
2. Run: `npx prisma migrate dev --name fix-router-call-tool-used-nullable`
3. Backfill: `UPDATE "RouterCall" SET "toolUsed" = '' WHERE "toolUsed" IS NULL;`

---

## Bug P0-3 — XSS risk: missing effective Content-Security-Policy

### Fix 1 — `src/middleware.ts:190`

Current value (page-route CSP):
```
"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self'"
```

Replace with (remove `'unsafe-inline'` and `'unsafe-eval'` from `script-src`; tighten `frame-ancestors`):
```
"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'"
```

**Note:** Removing `'unsafe-eval'` may break Next.js hydration in dev mode. Test in staging. If it breaks production, fall back to `'unsafe-eval'` only and remove only `'unsafe-inline'`.

### Fix 2 — `next.config.ts`

The file currently has an empty `nextConfig`. Add a `headers()` function:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## Bug P1-1 — Strategy differentiation: auto/balanced/cheapest all pick same tool

### Fix 1 — `src/lib/router/index.ts`

Read the file and verify `TOOL_CHARACTERISTICS` (or equivalent cost/quality data) for `search` capability produces distinct rankings per strategy:
- `cheapest` → `brave-search` first (cost ~0.0001)
- `balanced` → `tavily` first (quality ≥ 4.0, best cost-efficiency)
- `best_performance` → `exa-search` first (quality ~4.6)

If the rankings collapse to the same tool, inspect the scoring function. Add a temporary `console.log` in staging to trace `getRankedToolsForCapability('search', strategy)` output for each strategy. Fix the cost/quality values if incorrect.

### Fix 2 — `src/lib/router/sdk.ts:150`

Read the file and verify `applyStrategy()` receives the per-request `strategyUsed` value (already confirmed in `sdk-handler.ts:159` as `strategy: strategyUsed`). If `applyStrategy` internally re-reads `account.strategy` instead of the passed argument, fix it to use the argument.

No code change needed if both routing through the argument correctly — add a staging log to confirm.

---

## Bug P1-3 — MCP endpoints 404 at `/api/v1/mcp/tools/list`

`src/app/api/v1/mcp/route.ts` already re-exports `GET`/`POST` from `/mcp/route.ts` (manifest + JSON-RPC), so `/api/v1/mcp` is already resolved. Only `/tools/list` is missing.

### Fix 1 — `src/app/mcp/route.ts`

Read the file and verify `SERVER_INFO` is exported. If it is declared as `const SERVER_INFO = { ... }` without `export`, add the `export` keyword:
```typescript
// BEFORE:
const SERVER_INFO = {
// AFTER:
export const SERVER_INFO = {
```
This is the **only** change allowed in this file.

### Fix 2 — Create `src/app/api/v1/mcp/tools/list/route.ts`

```typescript
/**
 * GET /api/v1/mcp/tools/list — REST convenience route returning the MCP tools array.
 * Actual MCP server lives at /mcp (JSON-RPC 2.0) and at /api/v1/mcp (re-exported).
 */
import { SERVER_INFO } from '@/app/mcp/route';

export async function GET() {
  return Response.json(
    { tools: SERVER_INFO.tools },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    }
  );
}
```

---

## Verification Checklist

- [ ] `GET /api/v1/router/calls` — every record has non-empty `toolUsed` (no empty string, no "unknown")
- [ ] Any API response includes `X-Content-Type-Options: nosniff`
- [ ] Page routes: CSP header does NOT contain `unsafe-eval`
- [ ] `POST /api/v1/router/search {"strategy":"cheapest"}` picks a different tool than `{"strategy":"best_performance"}`
- [ ] `GET /api/v1/mcp/tools/list` returns 200 with a `tools` array
