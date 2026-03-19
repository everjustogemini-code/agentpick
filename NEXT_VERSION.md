# NEXT_VERSION.md — v-next
**Date:** 2026-03-18
**Prepared by:** AgentPick PM (Claude Code)
**QA baseline:** QA_REPORT.md (2026-03-18) — score **58/58** | P0: none | P1: 1 | P2: 2
**Live site:** https://agentpick.dev — dark neon, animated metrics, 3-tier pricing, functional
**Rule:** Bugs first. No features while P1/P2 remain.

> **PM note:** One P1 (API field naming inconsistency) and two P2s (missing `/api/v1/account` alias, null `meta.ai_classification` for non-AUTO strategies) must ship before any new features. All three are low-effort fixes — no functional breakage, but they will bite external SDK consumers. After bugs: UI consistency pass (dark-glass tokens are defined but inconsistently applied), then one high-leverage adoption feature.

---

## Must-Have #1 — Fix All P1/P2 API Contract Bugs

**Why it's first:** Developers building against our API will hit these before they hit any UI. Docs that lie and null fields that shouldn't be null erode trust faster than any design gap.

### Fix A — P1: Align `apiKey` field name in registration response
- `POST /api/v1/router/register` currently returns `{"apiKey": "..."}`.
- Audit all internal tooling, SDK examples, and docs for any reference to `{"key": "..."}`. Standardize on `apiKey` everywhere.
- If a breaking rename is needed, add a `key` alias field with a deprecation comment in the response JSON: `"key": "<same value>", "_note": "key is deprecated, use apiKey"`.

### Fix B — P2: Add `/api/v1/account` alias endpoint
- `GET /api/v1/account` currently 404s. Account data lives at `GET /api/v1/router/usage`.
- Add a route alias so both paths return the same payload. Include response header `Deprecation: true` on `/api/v1/account`.
- Update `/connect` API reference to document both paths with the canonical clearly marked.

### Fix C — P2: Return structured `meta.ai_classification` for non-AUTO strategies
- Currently `null` for `balanced`, `best_performance`, `cheapest` — only populated for `auto`.
- Return a consistent object for all strategies: `{"mode": "balanced", "reason": "strategy_override", "query_type": null}`.
- SDK consumers should never need to null-check a field that exists in every response envelope.

**Acceptance:** `GET /api/v1/account` → 200. `meta.ai_classification` never null. `apiKey` consistent. All 51 automated QA checks remain green.

---

## Must-Have #2 — Dark-Glass Design System Consistency Pass

**Why it's second:** The CSS already has the dark-glass token set (`--bg-base`, `glass-card`, `hero-mesh`, `gradient-border-card`) and ScrollReveal is wired — but the body still defaults to light mode and key sections use inconsistent styling. This is activation work, not a rewrite.

**Exact changes:**

1. **Dark by default** — In `globals.css`, flip `body { background: var(--bg-primary) }` to `var(--bg-base)`. Remap `--bg-card` to `rgba(255,255,255,0.05)` and `--text-primary` to `#E2E8F0`. Eliminates the white flash on load.

2. **Hero mesh + glass panel** — Apply the `hero-mesh` class (already defined, not yet applied) to the homepage hero wrapper. Wrap headline + CTA in a `glass-card` frosted container. Upgrade headline to `clamp(2.8rem, 5vw, 4.5rem)` weight-800 with white-to-orange gradient text.

3. **Card consistency** — Apply `glass-card gradient-border-card` to all three feature cards and all three pricing tier cards. Add `shadow-glow-orange` on hover for the primary CTA card.

4. **ScrollReveal activation** — The `.scroll-reveal` + `.visible` CSS and `<ScrollReveal>` component are wired but not applied to the live-feed stats bar, feature cards, pricing section, or "How it works" steps. Wire them.

5. **Monospace data typography** — Apply `font-jetbrains-mono` (already loaded) to all latency, score, and call-count values site-wide. Currently only applied inconsistently.

**Acceptance:** No white flash on load. Consistent dark-glass on `/`, `/connect`, and `/products/[slug]`. Lighthouse LCP < 2.5s, CLS < 0.1. All 51 QA checks green.

---

## Must-Have #3 — Public Leaderboard API (Developer Adoption)

**Why it's third:** AgentPick's benchmark data is the core value prop, but it's locked behind registration. A zero-auth read endpoint lets developers embed rankings in README badges, Grafana dashboards, and routing logic — all before they even create an account. This is the lowest-friction path to distribution.

**New route:** `GET /api/v1/leaderboard`
```
Query params:
  ?domain=finance|devtools|news|general   (optional)
  ?task=research|realtime|simple          (optional)
  ?limit=10                               (default 10, max 50)

Response 200 (no auth required):
{
  "updated_at": "2026-03-18T00:00:00Z",
  "tools": [
    {
      "rank": 1,
      "slug": "tavily",
      "name": "Tavily",
      "score": 8.4,
      "latency_p50_ms": 898,
      "success_rate": 1.0,
      "best_for": ["research", "realtime"],
      "domains": ["general", "news"]
    }
  ]
}
```
- No auth. Rate limit: 60 req/min per IP.
- Cache TTL: 5 min. Data source: same benchmark scores already powering `/products/*` — no new computation.

**Badge SVG route:** `GET /api/v1/leaderboard/badge/[slug]`
- Returns Shields.io-compatible SVG: rank + score.
- Enables GitHub README badge: `[![Ranked #1](https://agentpick.dev/api/v1/leaderboard/badge/tavily)](https://agentpick.dev/products/tavily)`
- SVG cached 5 min with ETag.

**`/connect` page addition:** New "Leaderboard API" section with a `curl` one-liner, a live "Try it" button, and copy-paste badge Markdown for each top-ranked tool.

**Acceptance:**
- `curl https://agentpick.dev/api/v1/leaderboard` → 200 JSON, no API key.
- Badge SVG renders correctly in a GitHub README (CORS header: `Access-Control-Allow-Origin: *`).
- All 51 automated QA checks remain green.

---

## Definition of Done

- [ ] `GET /api/v1/account` → 200 + `Deprecation: true` header (no 404)
- [ ] `apiKey` field consistent across registration response and all docs
- [ ] `meta.ai_classification` never null for any routing strategy
- [ ] Body defaults to dark; no white flash; `hero-mesh` on homepage hero
- [ ] `glass-card gradient-border-card` on all feature + pricing cards
- [ ] `ScrollReveal` wired to stat bar, feature cards, pricing, How-It-Works
- [ ] `GET /api/v1/leaderboard` → 200 JSON, unauthenticated, rate-limited
- [ ] `GET /api/v1/leaderboard/badge/[slug]` → SVG, renders in GitHub README
- [ ] `/connect` shows Leaderboard API section with curl + badge snippet
- [ ] All 51 automated QA checks green post-deploy

## Out of Scope (This Cycle)
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — tracked in BENCHMARK_UPGRADE_SPEC.md, blocked on `BENCHMARK_SECRET` env config
- New routing strategies or tool integrations
- Stripe/billing changes
