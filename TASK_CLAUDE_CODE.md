# TASK_CLAUDE_CODE.md — cycle 13 (post-cycle-12)

**Agent:** Claude Code (Sonnet 4.6)
**Date:** 2026-03-18
**QA baseline:** 50/51 — P0: 1 open | P1: 3 open (P1-2 assigned to Codex)
**Scope:** Bug fixes ONLY — no new features, no UI changes, no refactors
**Do NOT touch:** `agentpick-router-qa.py` (owned by Codex)

---

## P0-1 — Embed endpoint drops vector data

**File:** `src/lib/benchmark/adapters/voyage-embed.ts`
**Line:** ~43

**Current (buggy):**
```typescript
response: { dimensions: embeddings[0]?.embedding?.length ?? 0, tokens, count: embeddings.length },
```

**Fix:**
```typescript
response: {
  dimensions: embeddings[0]?.embedding?.length ?? 0,
  tokens,
  count: embeddings.length,
  embeddings: embeddings.map((e: { embedding: number[] }) => e.embedding),
},
```

No other files need to change. The router passes `response` through as `data` unchanged.

**Acceptance:** `POST /api/v1/route/embed` response `data` contains an `embeddings` key with an array of float arrays; `data.embeddings[0].length === data.dimensions`.

---

## P1-1 — Remove dead embed providers from ALL routing/config paths

**Priority:** P1 — four cycles of partial fixes; this time grep everything first.

### Step 0: Mandatory exhaustive grep BEFORE ANY EDITS

```bash
grep -rn "openai-embed\|cohere-embed" src/ --include="*.ts" --include="*.tsx" --include="*.js"
```

Fix EVERY occurrence in routing, fallback chains, tool lists, capability registries, health probes, and docs. Do not commit until the grep returns zero hits in `src/`.

### Files to fix (known locations):

**1. `src/lib/router/index.ts` (~line 43)**
- `CAPABILITY_TOOLS.embed` must be `['voyage-embed']` — no other slugs.
- `TOOL_CHARACTERISTICS` must have no `openai-embed` or `cohere-embed` entries.
- Check for any secondary fallback array or inline tool-list that bypasses `CAPABILITY_TOOLS`.

**2. `src/lib/ops/constants.ts` (~line 41)**
- `suggestedTools` for embed must contain only `["voyage-embed"]`.
- Remove `"openai-embed"` and `"cohere-embed"` if present.

**3. `src/lib/ops/service-probes.ts` (~lines 217–220)**
- Probe slug map must contain no `openai-embed`, `cohere-embed`, or `voyage-ai` entries.
- Dead-provider probes corrupt circuit-breaker state and inject dead slugs into the fallback chain.

**4. `src/app/api/v1/router/skill.md/route.ts` (~line 55)**
- Remove `openai-embed` and `cohere-embed` from the embed row in the capability table.

**5. Any additional file flagged by the Step 0 grep — fix ALL occurrences.**

### Verification
```bash
# Must return zero hits:
grep -rn "openai-embed\|cohere-embed" src/ --include="*.ts" --include="*.tsx" --include="*.js"
```

**Acceptance:** `POST /api/v1/route/embed` returns `fallback_used: false` and `tried_chain: ["voyage-embed"]` (length exactly 1) on every normal call.

---

## P1-3 — AI classifier fires on non-search/non-finance capabilities (wastes Haiku call, wrong type)

**File:** `src/lib/router/ai-classify.ts`
**Function:** `getClassification(query: string, capability: string)`

**Fix — add early-return guard at top of `getClassification`, before any `fastClassify` or LLM call:**
```typescript
export async function getClassification(
  query: string,
  capability: string
): Promise<{ context: QueryContext; cached: boolean; classificationMs: number }> {
  // Classification is only meaningful for search and finance routing.
  // For other capabilities (embed, crawl, code, etc.) return a neutral default immediately.
  if (capability !== 'search' && capability !== 'finance') {
    return {
      context: { type: 'simple', domain: 'general', depth: 'shallow', freshness: 'any' },
      cached: false,
      classificationMs: 0,
    };
  }
  // ... existing logic unchanged below this point ...
```

No other files need to change.

**Acceptance:** `POST /api/v1/route/embed` with body `{"params":{"text":"machine learning fundamentals"}}` returns `meta.ai_classification.type` of `"simple"` (NOT `"news"`). No Haiku LLM call is made for embed requests.

---

## Files owned by CLAUDE_CODE

| File | Bug |
|------|-----|
| `src/lib/benchmark/adapters/voyage-embed.ts` | P0-1 |
| `src/lib/router/index.ts` | P1-1 |
| `src/lib/ops/constants.ts` | P1-1 |
| `src/lib/ops/service-probes.ts` | P1-1 |
| `src/app/api/v1/router/skill.md/route.ts` | P1-1 |
| `src/lib/router/ai-classify.ts` | P1-3 |
| *(any additional file from grep)* | P1-1 |

**DO NOT touch:** `agentpick-router-qa.py` — owned by Codex.

---

## Progress log

After each fix, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] <brief description>
```
