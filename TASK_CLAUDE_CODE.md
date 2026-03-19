# TASK_CLAUDE_CODE.md — Cycle 10 (Backend / API)

**Agent:** Claude Code (Sonnet 4.6)
**Cycle:** 10
**Date:** 2026-03-18
**QA baseline:** 62/63 — P0 embed chain fix below brings `fallback_used` to false
**Do NOT touch:** Any file listed in TASK_CODEX.md

---

## Must-Have #1 — Fix P1-1: Remove dead providers from embed chain

**Bug:** `POST /api/v1/route/embed` returns `tried_chain: ["openai-embed", "cohere-embed", "voyage-embed"]` with `fallback_used: true` on every call. Cycle 9 updated `CAPABILITY_TOOLS.embed` in `src/lib/router/index.ts:43` to `['voyage-embed', 'jina-embed', 'edenai-embed']`, but dead-provider references in downstream config files still inject openai-embed and cohere-embed into the routing path before the CAPABILITY_TOOLS guard fires.

**Acceptance:** `POST /api/v1/route/embed` returns `fallback_used: false` and `tried_chain: ["voyage-embed"]` (length 1) on every normal call.

---

### File 1: `src/lib/ops/constants.ts`

**Location:** Line 41 — the `embedding` capability entry in the domain/capability config array.

**Current (broken):**
```typescript
suggestedTools: ["openai-embed", "cohere-embed", "voyage-ai", "jina-embed"]
```

**Fix:** Replace with:
```typescript
suggestedTools: ["voyage-embed", "jina-embed", "edenai-embed"]
```

Rationale: `openai-embed` and `cohere-embed` have no configured platform API keys. `voyage-ai` is a stale slug — the live slug is `voyage-embed`. `edenai-embed` is already in `CAPABILITY_TOOLS.embed`. This list must exactly mirror `CAPABILITY_TOOLS.embed` so any code that reads `suggestedTools` cannot re-introduce dead providers.

---

### File 2: `src/lib/ops/service-probes.ts`

**Location:** Lines 217–220 — embed provider entries in the probe slug map.

**Current (broken):**
```typescript
"openai-embed": "openai",
"cohere-embed": "cohere",
"voyage-ai": "voyage",
"voyage-embed": "voyage", // backward-compat alias
```

**Fix:** Remove `openai-embed`, `cohere-embed`, and `voyage-ai` entries. Retain (or add if needed) only the active embed tools:
```typescript
"voyage-embed": "voyage",
"jina-embed": "jina",
"edenai-embed": "edenai",
```

Rationale: Service probes run health checks against configured providers. Probing openai-embed and cohere-embed (no keys) generates noise and may trigger health-check failures that affect circuit-breaker state, indirectly influencing fallback ordering.

---

### File 3: `src/lib/router/index.ts`

**Location:** Lines 73–74 — `TOOL_CHARACTERISTICS` map.

**Current (broken):**
```typescript
'openai-embed':  { quality: 4.5, cost: 0.0001, latency: 150, stability: 0.99 },
'cohere-embed':  { quality: 4.0, cost: 0.0001, latency: 120, stability: 0.98 },
```

**Fix:** Delete both lines (73 and 74).

Rationale: `TOOL_CHARACTERISTICS` keys feed the `latencyBudgetMs` filter and circuit breaker logic at lines 520 and 615. While `CAPABILITY_TOOLS.embed` is the authoritative allowlist (line 242 guard), removing dead entries from TOOL_CHARACTERISTICS eliminates any future risk of these providers being re-introduced via a characteristics-keyset scan.

---

### File 4: `src/lib/router/handler.ts`

**Location:** Audit only — no specific line known.

Search `handler.ts` for any of: `openai-embed`, `cohere-embed`, `voyage-ai`, `suggestedTools`. If any of these strings appear in code that constructs a tool list, fallback list, or request body passed to `routeRequest`, remove the dead entries. The `CAPABILITY_TOOLS[capability]` guard in `index.ts:242` is authoritative — nothing in handler.ts should bypass it by injecting extra slugs.

---

### File 5: `src/app/api/v1/router/skill.md/route.ts`

**Location:** Line 55 — the embed row in the capability table (documentation endpoint).

**Current:**
```
| embed | `/router/embed` | openai-embed, cohere-embed, voyage-ai, jina-embed, edenai-embed |
```

**Fix:**
```
| embed | `/router/embed` | voyage-embed, jina-embed, edenai-embed |
```

---

## Verification

After making all changes, run:
```bash
curl -s -X POST http://localhost:3000/api/v1/route/embed \
  -H "Authorization: Bearer $TEST_KEY" \
  -H "Content-Type: application/json" \
  -d '{"params":{"text":"test embedding"}}' | jq '{tried_chain:.meta.tried_chain, fallback_used:.meta.fallback_used}'
```
Expected output:
```json
{ "tried_chain": ["voyage-embed"], "fallback_used": false }
```

Also run: `grep -r "openai-embed\|cohere-embed" src/lib/router/ src/lib/ops/` — must return zero results in active routing/probing code.

---

## Out of Scope for This Agent

- `agentpick-router-qa.py` — assigned to Codex (P1-2 slug fix)
- All frontend page files under `src/app/` (pages) and `src/components/`
- `src/app/globals.css`
- Dark-glass UI, ScrollReveal, count-up animations
- Playground page (`src/app/playground/page.tsx`, `src/components/PlaygroundShell.tsx`)
- Benchmark runner endpoint — explicitly out of scope this cycle (NEXT_VERSION.md § Out of Scope)
