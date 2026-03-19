# TASK_CLAUDE_CODE.md — Cycle 12 (Backend / API)

**Agent:** Claude Code (Sonnet 4.6)
**Cycle:** 12
**Date:** 2026-03-18
**QA baseline:** 62/63 — P1-1 embed chain fix below brings `fallback_used` to false
**Do NOT touch:** Any file listed in TASK_CODEX.md

---

## Must-Have #1 — Fix P1-1: Remove dead providers from embed chain (FOURTH attempt — exhaustive grep required)

**Bug:** `POST /api/v1/route/embed` STILL returns `tried_chain: ["openai-embed", "cohere-embed", "voyage-embed"]` with `fallback_used: true` in post-cycle-11 QA (22:55 UTC). Cycle 9 promoted voyage-embed to primary; cycle 10 attempted to remove dead providers; cycle 11 explicitly targeted "ALL locations." THREE CYCLES HAVE FAILED.

**Root cause (per NEXT_VERSION.md):** Multiple config locations hold the dead providers; previous fixes only patched some of them. A grep across the ENTIRE codebase is mandatory before touching any file — fix ALL occurrences atomically in one commit.

**Acceptance:** `POST /api/v1/route/embed` returns `fallback_used: false` and `tried_chain: ["voyage-embed"]` (length exactly 1) on every normal call.

---

### Step 0: Mandatory exhaustive grep BEFORE ANY EDITS

This is NOT optional. Previous cycles skipped this and failed. Run ALL of the following and record every file+line:

```bash
grep -rn "openai-embed" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.yaml" --include="*.toml"
grep -rn "cohere-embed"  . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.yaml" --include="*.toml"
grep -rn "voyage-ai"     . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.yaml" --include="*.toml"
```

Fix EVERY occurrence that participates in routing, fallback chains, tool lists, capability registries, health probes, or SDK documentation. Do not stop at the files listed below — if the grep reveals additional locations, fix those too. Do not commit until ALL three grep patterns return zero hits in routing/config paths.

---

### File 1: `src/lib/router/index.ts`

**Previous cycles fixed `CAPABILITY_TOOLS.embed` and `TOOL_CHARACTERISTICS` here.** Verify:

- `CAPABILITY_TOOLS.embed` (around line 43) must be `['voyage-embed']` — remove jina-embed and edenai-embed too if voyage-embed is the sole intended provider per NEXT_VERSION.md acceptance criteria.
- `TOOL_CHARACTERISTICS` must have NO entries for `openai-embed` or `cohere-embed` (lines ~73–74).
- Check for any **secondary fallback list** — a separate constant or inline array that lists embed providers outside of `CAPABILITY_TOOLS`. Remove dead slugs from it.
- Check for any runtime logic that dynamically builds a tool chain from provider keys or environment variables — if `openai-embed` or `cohere-embed` keys are absent but the code still enqueues them, add an explicit exclusion.

---

### File 2: `src/lib/ops/constants.ts`

**Cycle 10 targeted `suggestedTools` at line 41.** Verify the fix landed:

```typescript
// Must NOT contain openai-embed, cohere-embed, or voyage-ai:
suggestedTools: ["voyage-embed", "jina-embed", "edenai-embed"]
```

If it still contains dead slugs, fix it now. Also search the entire file for any other array or constant listing embed providers.

---

### File 3: `src/lib/ops/service-probes.ts`

**Cycle 10 targeted probe slug map at lines 217–220.** Verify the fix landed — the map must contain only:

```typescript
"voyage-embed": "voyage",
"jina-embed": "jina",
"edenai-embed": "edenai",
```

No `openai-embed`, `cohere-embed`, or `voyage-ai` entries. A probe for a dead provider can trigger health-check failures that influence circuit-breaker state and cause fallback ordering to inject dead tools.

---

### File 4: `src/lib/router/handler.ts`

Search for `openai-embed`, `cohere-embed`, `voyage-ai`, `suggestedTools`, and any array that constructs a tool list or fallback chain for the embed capability. Remove dead slugs. The `CAPABILITY_TOOLS[capability]` guard in `index.ts` is authoritative — nothing here should bypass it by injecting extra slugs.

---

### File 5: `src/app/api/v1/router/skill.md/route.ts`

Update the embed row in the capability table (line ~55):

```
| embed | `/router/embed` | voyage-embed, jina-embed, edenai-embed |
```

(Remove openai-embed, cohere-embed, voyage-ai from the documented list.)

---

### Any additional files found by Step 0 grep

Fix every remaining occurrence. Common locations to check if grep flags them:
- `src/lib/router/sdk.ts`
- `src/lib/router/sdk-handler.ts`
- Any `*config*`, `*defaults*`, or `*registry*` files under `src/lib/`

---

## Verification

After all changes:
```bash
# Zero results = success:
grep -rn "openai-embed\|cohere-embed" src/lib/router/ src/lib/ops/ --include="*.ts"

# Live check (requires running server):
curl -s -X POST http://localhost:3000/api/v1/route/embed \
  -H "Authorization: Bearer $TEST_KEY" \
  -H "Content-Type: application/json" \
  -d '{"params":{"text":"test embedding"}}' \
  | jq '{tried_chain:.meta.tried_chain, fallback_used:.meta.fallback_used}'
# Expected: { "tried_chain": ["voyage-embed"], "fallback_used": false }
```

---

## Progress Log

After completing the fix, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] P1-1: removed openai-embed + cohere-embed from ALL embed chain locations; voyage-embed is sole provider
```

---

## Out of Scope for This Agent

- `agentpick-router-qa.py` — assigned to Codex (P1-2 slug fix)
- All frontend page files under `src/app/` (pages) and `src/components/`
- `src/app/globals.css`
- Dark-glass UI, ScrollReveal, count-up animations
- Playground page (`src/app/playground/page.tsx`, `src/components/PlaygroundShell.tsx`)
- Benchmark runner endpoint (`POST /api/v1/benchmark/run`) — explicitly out of scope this cycle (NEXT_VERSION.md § Out of Scope)
