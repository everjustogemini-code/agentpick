# NEXT_VERSION.md — Bugfix Cycle (post-cycle-12)
**Date:** 2026-03-18
**Prepared by:** AgentPick PM (Claude Code, Sonnet 4.6)
**QA baseline:** QA_REPORT.md (2026-03-18) — score **50/51** | P0: 1 open | P1: 3 open
**Scope:** Bug fixes ONLY. No new features, no UI changes, no refactors.

---

## P0-1: Embed endpoint returns no embedding vector

**QA issue:** P0-1
**Symptom:** `POST /api/v1/route/embed` response `data` contains only `{dimensions, tokens, count}` — no `embedding`, `embeddings`, or `vector` key. Clients cannot use the endpoint for semantic search or RAG.

**Root cause:**
`src/lib/benchmark/adapters/voyage-embed.ts` line 43 builds the `response` object but silently drops the embedding arrays:
```typescript
// BUG — vectors extracted but never returned:
response: { dimensions: embeddings[0]?.embedding?.length ?? 0, tokens, count: embeddings.length },
```
The local variable `embeddings` holds the full `data.data` array (each item has an `.embedding` float array), but only metadata fields are forwarded.

**Fix — `src/lib/benchmark/adapters/voyage-embed.ts` line 43:**
Include the actual vectors in the returned `response` object:
```typescript
response: {
  dimensions: embeddings[0]?.embedding?.length ?? 0,
  tokens,
  count: embeddings.length,
  embeddings: embeddings.map((e: { embedding: number[] }) => e.embedding),
},
```
No other files need to change for this fix — the router passes `response` through as `data` in the API response body unchanged.

**Acceptance:** `POST /api/v1/route/embed` response `data` contains an `embeddings` key with an array of float arrays. `data.embeddings[0].length` equals `data.dimensions`.

---

## P1-1: Two of three embed providers are down — dead providers still in chain

**QA issue:** P1-1
**Symptom:** Every embed call returns `tried_chain: ["openai-embed", "cohere-embed", "voyage-embed"]` with `fallback_used: true`. Both `openai-embed` and `cohere-embed` are unavailable — no API keys configured for them. Three previous fix cycles have not resolved this.

**Root cause:** Multiple config locations still reference the dead providers. Previous fixes patched `CAPABILITY_TOOLS` in `src/lib/router/index.ts` (already `['voyage-embed']`) but left dead slugs in at least one other location that is injected at routing time.

**Required exhaustive grep before any edits:**
```bash
grep -rn "openai-embed\|cohere-embed" src/ --include="*.ts" --include="*.tsx" --include="*.js"
```
Fix every occurrence in routing, fallback chains, tool lists, capability registries, health probes, and docs. Do not stop until the grep returns zero hits in routing/config paths.

**Known files to check and fix:**

1. **`src/lib/router/index.ts` ~line 43** — verify `CAPABILITY_TOOLS.embed` is `['voyage-embed']` (no other slugs). Verify `TOOL_CHARACTERISTICS` has no `openai-embed` or `cohere-embed` entries.

2. **`src/lib/ops/constants.ts` ~line 41** — `suggestedTools` for embed must contain only `["voyage-embed"]`. Remove `openai-embed` and `cohere-embed` if present.

3. **`src/lib/ops/service-probes.ts` ~lines 217–220** — probe slug map must contain no `openai-embed`, `cohere-embed`, or `voyage-ai` entries. A probe for a dead provider influences circuit-breaker state and causes those tools to appear in the fallback chain.

4. **`src/app/api/v1/router/skill.md/route.ts` ~line 55** — remove `openai-embed` and `cohere-embed` from the embed row in the capability table.

5. **Any additional file flagged by the grep** — fix all occurrences.

**Acceptance:** `POST /api/v1/route/embed` returns `fallback_used: false` and `tried_chain: ["voyage-embed"]` (length exactly 1) on every normal call.

---

## P1-2: QA script B.1-embed check uses wrong slug `voyage-ai`

**QA issue:** P1-2
**Symptom:** QA test `B.1-embed` checks `tool in ["cohere-embed", "voyage-ai", "jina-embeddings"]` but the live tool slug is `voyage-embed` (not `voyage-ai`). This causes a false failure on every QA run, keeping the automated score below 51/51.

**Root cause:** The valid-tool list in `agentpick-router-qa.py` was written when the adapter was registered under the old `voyage-ai` product slug. That slug was renamed to `voyage-embed` in a prior cycle; the QA script was not updated.

**Fix — `agentpick-router-qa.py`:**
Add or update the B.1 embed test class so the valid tool list uses `voyage-embed`:
```python
class TestEmbedRoute(unittest.TestCase):

    def test_B1_embed_uses_known_slug(self):
        """B.1 — /api/v1/route/embed must use a known embed slug."""
        r = requests.post(
            f"{BASE_URL}/api/v1/route/embed",
            headers={"Authorization": f"Bearer {KEY_499}"},
            json={"params": {"text": "machine learning fundamentals"}},
            timeout=15,
        )
        self.assertEqual(r.status_code, 200)
        tool = r.json().get("meta", {}).get("tool_used", "")
        valid_embed_tools = ["voyage-embed", "jina-embed", "edenai-embed", "jina-embeddings"]
        self.assertIn(tool, valid_embed_tools, f"Unexpected embed tool: {tool}")
```
No occurrence of `"voyage-ai"` should remain in the QA script after this fix.

**Acceptance:** QA automated suite reports **51/51**. `grep "voyage-ai" agentpick-router-qa.py` returns zero hits.

---

## P1-3: AI classifier returns wrong type for embed queries

**QA issue:** P1-3
**Symptom:** Embedding `"machine learning fundamentals"` is classified as `type: "news"` with reasoning `"News query + → voyage-embed"`. The classifier has no awareness that the capability is `embed` — search-oriented classification rules fire instead.

**Root cause:**
`src/lib/router/ai-classify.ts` — `getClassification(query, capability)` is called for embed requests but the fast classifier (`fastClassify`) and the Haiku prompt (`CLASSIFY_SYSTEM`) contain no embed-specific rules. The query `"machine learning fundamentals"` matches `genericTopicSignal` (`\bml\b|\bmachine learning\b`) combined with other news heuristics, producing `type: "news"`.

Note: the wrong classification does not affect tool selection today — `aiRoute()` lines 309–311 return `CAPABILITY_TOOLS['embed']` directly for non-search/non-finance capabilities, ignoring `context.type`. However, the classification appears in the API response `meta.ai_classification` field, misleading clients and violating the contract.

**Fix — `src/lib/router/ai-classify.ts`:**

Option A (minimal, correct): In `getClassification`, short-circuit when `capability !== 'search' && capability !== 'finance'`:
```typescript
export async function getClassification(query: string, capability: string): Promise<{ context: QueryContext; cached: boolean; classificationMs: number }> {
  // Classification is only meaningful for search and finance routing.
  // For other capabilities (embed, crawl, code, etc.) return a neutral default immediately.
  if (capability !== 'search' && capability !== 'finance') {
    return { context: { type: 'simple', domain: 'general', depth: 'shallow', freshness: 'any' }, cached: false, classificationMs: 0 };
  }
  // ... existing logic unchanged ...
}
```

Option B (if callers must always receive a result): Add embed-specific examples to `CLASSIFY_SYSTEM` and add an `embed` branch in `fastClassify` that returns `type: 'simple'` for any query when capability is embed. (Option A is preferred — simpler, no LLM call wasted.)

**Acceptance:** `POST /api/v1/route/embed` with body `{"params":{"text":"machine learning fundamentals"}}` returns `meta.ai_classification.type` of `"simple"` (or no `ai_classification` key at all). It must NOT return `type: "news"`.

---

## Definition of Done

- [ ] **P0-1** — `data.embeddings` present and non-empty in embed API response; `data.embeddings[0].length === data.dimensions`
- [ ] **P1-1** — `tried_chain` length is 1, `fallback_used: false` on every embed call; zero grep hits for `openai-embed`/`cohere-embed` in routing/config paths
- [ ] **P1-2** — `agentpick-router-qa.py` B.1 uses `voyage-embed`; QA automated suite reports **51/51**; zero grep hits for `"voyage-ai"` in QA script
- [ ] **P1-3** — `meta.ai_classification.type` is NOT `"news"` for plain embed queries; no Haiku call wasted on non-search capabilities

## Out of Scope This Cycle

- Dark-glass design system / UI polish
- Live API Playground (`/playground`)
- ScrollReveal, count-up animations, micro-interactions
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`)
- New routing strategies or tool integrations
- Stripe/billing changes
- Team/org accounts
