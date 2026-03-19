# NEXT_VERSION.md — v-next
**Date:** 2026-03-18
**Prepared by:** AgentPick PM (Claude Code, Sonnet 4.6)
**QA baseline:** QA_REPORT.md (2026-03-18) — score **50/51** | P0: none | P1: 1 open (QA script typo only)
**Live site:** https://agentpick.dev — functional, cycles 1–5 shipped, 308 redirect fixed, demo-key rate limiter active

---

## Must-Have #1 — Fix P1: QA Script `voyage-ai` → `voyage-embed` Assertion

**Type:** Bug fix (test correctness)
**QA ref:** B.1-embed (the only remaining issue; score would be 51/51 after this)

**What:** The QA script valid list for `POST /api/v1/route/embed` still contains `"voyage-ai"`, but the backend was renamed to `"voyage-embed"` in a prior cycle. The product works correctly (200 OK, dimensions: 1024, latency 96ms). Only the test assertion is wrong.

**Exact change required** (locate the embed QA script):
```python
# Before
valid = ["cohere-embed", "voyage-ai", "jina-embeddings"]

# After
valid = ["cohere-embed", "voyage-embed", "jina-embeddings"]
```

**Acceptance:** Automated QA suite reports **51/51**. No backend changes needed.

---

## Must-Have #2 — Complete Dark-Glass Design System (Site-Wide Consistency)

**Type:** UI upgrade
**Why now:** Cycles 1–2 introduced dark-glass CSS tokens and applied them to the homepage hero only. Benchmarks, rankings, agents, `/connect`, and `/dashboard` still show a mixed aesthetic. The live site design is functional but lacks the depth and polish expected by developer-tool buyers (Vercel, Linear, Resend standard).

**Deliverables:**

1. **Glass cards everywhere** — Apply `backdrop-filter: blur(16px)` + `rgba(255,255,255,0.04)` background + 1px border at 12% white opacity to: benchmark domain tiles, rankings rows, agent directory cards, dashboard stat tiles, and `/connect` strategy blocks. Reuse existing `--glass-bg` / `--glass-border` tokens.

2. **Hero depth upgrade** — Add a radial glow orb behind the homepage headline: `#2fe92b` at 8% opacity, 800px radius. Gradient text on the primary value-prop phrase (`#2fe92b → #00d4ff`). Hero `h1` → `clamp(2.8rem, 5vw, 4.5rem)`, `font-weight: 800`, `letter-spacing: -1.5px`.

3. **ScrollReveal on all pages** — Wire the existing `.scroll-reveal → .visible` `IntersectionObserver` transition (currently homepage-only) to stat bars, feature cards, and "How it works" steps on `/connect`, `/benchmarks`, `/rankings`, and `/dashboard`. Stagger siblings at 60ms.

4. **Count-up stats** — Homepage "agent count" and "calls routed" figures animate from 0 → final value on first viewport entry (one-shot per session, `sessionStorage` flag).

5. **Micro-interactions** — Card hover: `translateY(-4px)` + elevated box-shadow. Primary CTA: shimmer sweep on hover (CSS `@keyframes`, 600ms). Strategy pills: subtle pulse. All gated on `prefers-reduced-motion: no-preference`.

6. **Monospace data** — Latency values, scores, and call counts use `font-variant-numeric: tabular-nums` + JetBrains Mono across all pages.

**Acceptance:** Visually consistent dark-glass on all pages. No white flash on any route. Lighthouse Performance ≥ 90, LCP < 2.5s, CLS < 0.1. QA 51/51 stays green.

---

## Must-Have #3 — MCP Server Endpoint (Developer Adoption)

**Type:** New feature
**Why:** MCP (Model Context Protocol) is the dominant zero-code integration standard for Claude, Cursor, Windsurf, and Zed users. A single config line lets any agent developer plug AgentPick into their stack without installing an SDK or writing routing logic. This directly targets the core ICP (agent builders) and creates a sticky, low-churn integration path that the `/connect` page SDK playground alone cannot cover.

**Spec:**

- **Endpoint:** `GET /mcp` — returns a valid MCP 1.0 server manifest (JSON). No auth required to fetch the manifest.
- **Tool exposed:** `agentpick_search`
  - Input: `{ query: string, strategy?: "balanced"|"best_performance"|"cheapest", domain?: string, type?: string }`
  - Action: calls `POST /api/v1/route/search` internally using the caller's `Authorization: Bearer` key
  - Output: structured results (`tool_used`, `latency_ms`, `results[]`, `ai_classification`)
- **Auth:** Standard `Authorization: Bearer ah_live_sk_...` passthrough — no new auth surface, reuses existing API key system
- **Rate limits:** Enforces the caller's plan limits (FREE = 500/month) identically to direct API calls
- **Usage tracking:** MCP-sourced calls appear in `/usage` and dashboard with `source: "mcp"` tag

**`/connect` page addition** — new "MCP" tab in the integration section:
```json
{
  "mcpServers": {
    "agentpick": {
      "url": "https://agentpick.dev/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

**Acceptance:**
- `GET /mcp` returns manifest that validates against MCP 1.0 schema
- `agentpick_search` is callable from Claude Desktop with a valid API key
- Resulting call appears in `/usage` dashboard
- MCP config block added to `/connect` page docs
- QA 51/51 stays green

---

## Definition of Done

- [ ] QA script updated: `voyage-ai` → `voyage-embed`; suite reports **51/51**
- [ ] Glass cards applied to benchmarks, rankings, agents, connect, dashboard
- [ ] No white flash; all pages use `var(--bg-base)` body background
- [ ] ScrollReveal active on all pages (not homepage-only)
- [ ] Count-up stat animations on homepage hero
- [ ] Card hover lift + CTA shimmer + strategy pulse micro-interactions (respects `prefers-reduced-motion`)
- [ ] Lighthouse Performance ≥ 90 on `/` and `/benchmarks`; LCP < 2.5s; CLS < 0.1
- [ ] `GET /mcp` returns valid MCP 1.0 manifest
- [ ] `agentpick_search` callable from Claude Desktop
- [ ] MCP calls tracked in `/usage` with `source: "mcp"`
- [ ] MCP config block added to `/connect` page

## Out of Scope (This Cycle)
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — tracked by Pclaw in `/workspace/agentpick-benchmark/`
- New routing strategies or tool integrations
- Stripe/billing changes
- Team/org accounts
- OpenAI-compatible `/v1/tools` shim (evaluate after MCP adoption data)
