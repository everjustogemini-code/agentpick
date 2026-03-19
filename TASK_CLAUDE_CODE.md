# TASK_CLAUDE_CODE.md — Cycle 9

**Agent:** Claude Code (Sonnet 4.6)
**Source:** NEXT_VERSION.md (2026-03-18, cycle 9)
**QA baseline:** 62/63 — P1-1 fix here brings fallback_used to false
**Scope:** P1-1 embed chain fix (backend only)
**Must NOT touch:** `agentpick-router-qa.py`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/benchmarks/`, `src/app/rankings/`, `src/app/agents/`, `src/app/dashboard/`, `src/app/connect/`, `src/app/playground/`, `src/components/`

---

## Task 1 — P1-1: Promote `voyage-embed` to primary provider in embed chain

**Goal:** `POST /api/v1/route/embed` must return `fallback_used: false` and `tried_chain: ["voyage-embed"]` on a normal call with no user BYOK keys.

**Root cause:** `openai-embed` and `cohere-embed` are at index 0–1 in the embed chain but have no valid platform API keys — they fail silently on every call, forcing a fallthrough to `voyage-embed` (listed as `voyage-ai` at index 2). Fix: promote `voyage-embed` to index 0 and drop the two broken providers from the chain.

---

### 1a. `src/lib/router/index.ts`

**Line 43** — `CAPABILITY_TOOLS.embed` array:

Current:
```ts
embed: ['openai-embed', 'cohere-embed', 'voyage-ai', 'jina-embed', 'edenai-embed'],
```

Change to (Option A — reorder + rename slug to canonical form):
```ts
embed: ['voyage-embed', 'jina-embed', 'edenai-embed'],
```

- Remove `openai-embed` and `cohere-embed` (no valid platform keys; fail every call).
- Rename `voyage-ai` → `voyage-embed` to match the canonical live slug. The `voyage-embed` entry already exists in `TOOL_CHARACTERISTICS` at line 76 (with identical stats).

**Lines 75–76** — `TOOL_CHARACTERISTICS` map has a duplicate `voyage-ai` key alongside `voyage-embed`:

```ts
// line 75 — DELETE this entry:
'voyage-ai':    { quality: 4.2, cost: 0.0001, latency: 130, stability: 0.97 },
// line 76 — KEEP, remove the "// alias" comment:
'voyage-embed': { quality: 4.2, cost: 0.0001, latency: 130, stability: 0.97 },
```

After the edit, run:
```bash
grep -n "voyage-ai" src/lib/router/index.ts
```
Must return zero matches.

---

### 1b. `src/lib/benchmark/adapters/index.ts`

Search for `voyage-ai` in the `ADAPTERS` map key or any adapter import. If present, rename the key from `'voyage-ai'` → `'voyage-embed'` so the map key matches the canonical slug now used in `CAPABILITY_TOOLS`.

Example pattern to find:
```ts
// before
'voyage-ai': voyageEmbedAdapter,
// after
'voyage-embed': voyageEmbedAdapter,
```

If `voyage-ai` does not appear in this file, no change needed.

---

## Files to Modify (summary)

| File | Change |
|------|--------|
| `src/lib/router/index.ts` | Line 43: remove `openai-embed`, `cohere-embed`; rename `voyage-ai` → `voyage-embed`; keep `jina-embed`, `edenai-embed`. Lines 75–76: delete duplicate `voyage-ai` TOOL_CHARACTERISTICS entry. |
| `src/lib/benchmark/adapters/index.ts` | Rename `'voyage-ai'` key → `'voyage-embed'` in ADAPTERS map (if present). |

**Do NOT touch:** Any frontend pages, CSS files, QA script, playground components, or API route handlers.

---

## Verification Checklist

- [ ] `grep -rn "voyage-ai" src/lib/router/index.ts` — zero results
- [ ] `grep -rn "voyage-ai" src/lib/benchmark/adapters/index.ts` — zero results
- [ ] `CAPABILITY_TOOLS.embed` starts with `'voyage-embed'`; length is 3 (`voyage-embed`, `jina-embed`, `edenai-embed`)
- [ ] `TOOL_CHARACTERISTICS` has exactly one entry for voyage: `'voyage-embed'`
- [ ] `POST /api/v1/route/embed` returns `fallback_used: false`, `tried_chain: ["voyage-embed"]`
- [ ] QA 63/63 after Codex also ships P1-2 (QA script slug fix)
