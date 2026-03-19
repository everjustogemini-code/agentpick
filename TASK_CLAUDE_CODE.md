# TASK_CLAUDE_CODE.md — cycle 24
**Agent:** Claude Code (Sonnet 4.6)
**Date:** 2026-03-19
**QA baseline:** 57/58 — P0: none | P1: 1 open
**Source:** NEXT_VERSION.md — Must-Have #1 (P1 envelope fix + Python SDK) + Must-Have #3 (playground backend)
**Do NOT touch:** Any file listed in TASK_CODEX.md

---

## Task 1 — P1 Fix: Add `meta` Envelope to Router Search Response

**Source:** NEXT_VERSION.md Must-Have #1

**Problem:** `POST /api/v1/router/search` wraps routing metadata (`tool`, `latencyMs`, `resultCount`, `strategy`) inside the `data` key. SDK consumers can't access these fields without drilling into `data`.

### 1a — Primary search route

**File:** `src/app/api/v1/route/search/route.ts`

Read this file first. Find the `NextResponse.json(...)` call that returns the search response.

- Extract `tool`, `latencyMs`, `resultCount`, `strategy` from wherever they are computed (likely local variables or a result object from the routing logic).
- Restructure the response to:
  ```json
  {
    "meta": { "tool": "tavily", "latencyMs": 151, "resultCount": 10, "strategy": "balanced" },
    "data": { "query": "...", "answer": "...", "results": [...] }
  }
  ```
- Keep the existing `data` object intact — do NOT move any `data` fields to top level. This is an additive change: add `meta`, preserve `data`.
- If `latencyMs` is computed as `Date.now() - startTime`, ensure that variable exists before the response; add it if missing.

### 1b — Audit other router routes for same pattern

**Files (read each, apply same `meta` envelope if they return search results):**
- `src/app/api/v1/router/strategy/route.ts`
- `src/app/api/v1/router/priority/route.ts`
- `src/app/api/v1/router/fallbacks/route.ts`
- `src/app/api/v1/router/[capability]/route.ts`

For each: if the route returns a search-result-style JSON response with `data`, add the same `meta` object at the top level. If a route doesn't return search results (e.g. it returns a config), leave it unchanged.

---

## Task 2 — Python SDK: Expose `response.meta` as First-Class Attribute

**Source:** NEXT_VERSION.md Must-Have #1, bullet 4

**Files:** `sdk-python/agentpick/client.py`, `sdk-python/agentpick/__init__.py`

Read both files first to understand current structure.

**`sdk-python/agentpick/client.py`:**
- Find the response parsing / return logic in the `search()` method (or equivalent).
- The current implementation likely returns `response.json()` directly as a dict.
- Wrap the parsed JSON in a lightweight response object so callers can write `result.meta.tool`, `result.meta.latency_ms`, `result.data`:

```python
from dataclasses import dataclass
from typing import Any

@dataclass
class SearchMeta:
    tool: str = ""
    latency_ms: int = 0      # snake_case mapping of latencyMs
    result_count: int = 0    # snake_case mapping of resultCount
    strategy: str = ""

class SearchResponse:
    def __init__(self, raw: dict):
        self._raw = raw
        meta_raw = raw.get("meta", {})
        self.meta = SearchMeta(
            tool=meta_raw.get("tool", ""),
            latency_ms=meta_raw.get("latencyMs", 0),
            result_count=meta_raw.get("resultCount", 0),
            strategy=meta_raw.get("strategy", ""),
        )
        self.data = raw.get("data", raw)  # fallback: if no data key, expose whole response

    def __getitem__(self, key):
        return self._raw[key]  # keep dict-style access for backwards compat
```

- Change `search()` to return `SearchResponse(response.json())` instead of `response.json()`.
- Ensure backwards compat: `result["data"]` and `result.data` both work.

**`sdk-python/agentpick/__init__.py`:**
- Export `SearchResponse` and `SearchMeta` alongside `AgentPick`:
  ```python
  from .client import AgentPick, SearchResponse, SearchMeta
  __all__ = ["AgentPick", "SearchResponse", "SearchMeta"]
  ```

---

## Task 3 — Playground Backend: Anonymous Rate-Limited API

**Source:** NEXT_VERSION.md Must-Have #3

**Goal:** Anonymous users (no API key) can call the playground endpoint up to 10 times per day per IP. Server-side enforcement. Shareable `?q=` links supported.

### 3a — Prisma schema

**File:** `prisma/schema.prisma`

Read the file first. If a `PlaygroundAnonymousUsage` model does not already exist, add:

```prisma
model PlaygroundAnonymousUsage {
  id        String   @id @default(cuid())
  ip        String
  date      String   // YYYY-MM-DD format
  count     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([ip, date])
}
```

After editing, run:
```sh
npx prisma generate
```

### 3b — Playground run endpoint

**File:** `src/app/api/v1/playground/run/route.ts`

Read the file first to understand the existing structure.

Add anonymous-user support:
1. Check if `Authorization` header contains a valid API key (reuse existing auth logic).
2. If **no valid API key** (anonymous request):
   a. Extract IP from `request.headers.get('x-forwarded-for') ?? request.ip ?? '0.0.0.0'`.
   b. Get today's date as `YYYY-MM-DD` (UTC): `new Date().toISOString().slice(0, 10)`.
   c. Upsert `PlaygroundAnonymousUsage` for `{ ip, date }`: increment `count`.
   d. If `count` **after** increment exceeds 10: return `429` JSON:
      ```json
      { "error": "Daily limit reached", "limit": 10, "resetAt": "<YYYY-MM-DDT00:00:00Z next day>" }
      ```
   e. If within limit, proceed with the search using an internal service key (read from `process.env.PLAYGROUND_ANONYMOUS_KEY` — document this env var requirement in a comment).
3. If **valid API key**: bypass IP rate limit entirely, proceed normally.
4. Response must include `meta` at top level (same envelope as Task 1).

### 3c — Shareable `?q=` URL support

**File:** `src/app/api/v1/playground/run/route.ts` (same file as 3b)

- Accept query param `q` in addition to request body `query`:
  ```ts
  const body = await request.json().catch(() => ({}));
  const urlQ = new URL(request.url).searchParams.get('q');
  const query = body.query ?? urlQ ?? '';
  ```
- If `query` is empty string, return `400 { error: "query is required" }`.

---

## Acceptance Criteria

- `POST /api/v1/route/search` returns `{ meta: { tool, latencyMs, resultCount, strategy }, data: {...} }`.
- Python: `from agentpick import AgentPick; r = ap.search("test"); r.meta.tool` works.
- Playground: anonymous users (no key) get real results up to 10/day/IP; 11th call returns 429.
- `POST /api/v1/playground/run?q=hello` and body `{ "query": "hello" }` both work.
- `/connect` QA suite 7/7 still passes (no regression from envelope change).

---

## Files This Task Owns (do NOT edit these in TASK_CODEX.md)

| File | Action |
|------|--------|
| `src/app/api/v1/route/search/route.ts` | Add `meta` top-level envelope |
| `src/app/api/v1/router/strategy/route.ts` | Add `meta` envelope if applicable |
| `src/app/api/v1/router/priority/route.ts` | Add `meta` envelope if applicable |
| `src/app/api/v1/router/fallbacks/route.ts` | Add `meta` envelope if applicable |
| `src/app/api/v1/router/[capability]/route.ts` | Add `meta` envelope if applicable |
| `src/app/api/v1/playground/run/route.ts` | Anonymous rate-limit + `?q=` support + `meta` envelope |
| `prisma/schema.prisma` | Add `PlaygroundAnonymousUsage` model |
| `sdk-python/agentpick/client.py` | Add `SearchResponse`/`SearchMeta` wrapper |
| `sdk-python/agentpick/__init__.py` | Export `SearchResponse`, `SearchMeta` |

**Do NOT touch:** `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/connect/page.tsx`, `src/app/rankings/page.tsx`, `src/app/playground/page.tsx`, or any component file under `src/components/`.

---

## Coverage Verification: Every NEXT_VERSION.md Item Assigned

| NEXT_VERSION.md item | Assigned to |
|---|---|
| Must-Have #1 — Add `meta` to search API response | **This file** |
| Must-Have #1 — Update Python SDK with `response.meta` | **This file** |
| Must-Have #1 — Update `/connect` API reference docs + code example | **TASK_CODEX.md** |
| Must-Have #2 — Glassmorphism UI overhaul (all pages) | **TASK_CODEX.md** |
| Must-Have #2 — Rankings sortable leaderboard table | **TASK_CODEX.md** |
| Must-Have #2 — Mobile responsive pass | **TASK_CODEX.md** |
| Must-Have #3 — Anonymous rate-limited playground API (backend) | **This file** |
| Must-Have #3 — Playground frontend (Monaco editor, response panel, `?q=`) | **TASK_CODEX.md** |

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] Cycle 24: P1 meta envelope + Python SDK SearchResponse + playground anon rate-limit backend
```
