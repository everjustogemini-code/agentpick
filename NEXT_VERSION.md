# NEXT_VERSION.md — v-next (cycle 7)
**Date:** 2026-03-18
**Prepared by:** AgentPick PM (Claude Code, Sonnet 4.6)
**QA baseline:** QA_REPORT.md (2026-03-18) — score **50/51** | P0: none | P1: 1 open (QA script typo only)
**Recently shipped (cycle 6):** agentpick_search MCP tool, RouterCall source tracking

---

## Must-Have #1 — Fix P1: QA Script `voyage-ai` → `voyage-embed` Assertion

**Type:** Bug fix (test correctness)
**QA ref:** B.1-embed (the only remaining issue; score goes 51/51 after this)

**What:** The QA script valid list for `POST /api/v1/route/embed` still contains `"voyage-ai"`, but the backend was renamed to `"voyage-embed"` in a prior cycle. The product works correctly (200 OK, dimensions: 1024, latency 96ms). Only the test assertion is stale.

**Exact change required:**
```python
# Before
valid = ["cohere-embed", "voyage-ai", "jina-embeddings"]

# After
valid = ["cohere-embed", "voyage-embed", "jina-embeddings"]
```

**Acceptance:** QA suite reports **51/51**. No backend changes needed.

---

## Must-Have #2 — Complete Dark-Glass Design System (Site-Wide Consistency)

**Type:** UI upgrade
**Why now:** The homepage hero has dark-glass CSS tokens. Benchmarks, rankings, agents, `/connect`, and `/dashboard` still show a mixed aesthetic. Developer-tool buyers (Vercel, Linear, Resend standard) expect a consistent, polished dark UI throughout.

**Deliverables:**

1. **Glass cards everywhere** — Apply `backdrop-filter: blur(16px)` + `rgba(255,255,255,0.04)` background + 1px border at 12% white opacity to: benchmark domain tiles, rankings rows, agent directory cards, dashboard stat tiles, and `/connect` strategy blocks. Reuse existing `--glass-bg` / `--glass-border` tokens.

2. **Hero depth upgrade** — Radial glow orb behind the homepage headline: `#2fe92b` at 8% opacity, 800px radius. Gradient text on the primary value-prop phrase (`#2fe92b → #00d4ff`). Hero `h1` → `clamp(2.8rem, 5vw, 4.5rem)`, `font-weight: 800`, `letter-spacing: -1.5px`.

3. **ScrollReveal on all pages** — Wire the existing `.scroll-reveal → .visible` IntersectionObserver transition (currently homepage-only) to stat bars, feature cards, and "How it works" steps on `/connect`, `/benchmarks`, `/rankings`, and `/dashboard`. Stagger siblings at 60ms.

4. **Count-up stats** — Homepage "agent count" and "calls routed" figures animate from 0 → final value on first viewport entry (one-shot per session, `sessionStorage` flag).

5. **Micro-interactions** — Card hover: `translateY(-4px)` + elevated box-shadow. Primary CTA: shimmer sweep on hover (CSS `@keyframes`, 600ms). Strategy pills: subtle pulse. All gated on `prefers-reduced-motion: no-preference`.

6. **Monospace data** — Latency values, scores, and call counts use `font-variant-numeric: tabular-nums` + JetBrains Mono across all pages.

**Acceptance:** Visually consistent dark-glass on all pages. No white flash on any route. Lighthouse Performance ≥ 90, LCP < 2.5s, CLS < 0.1. QA 51/51 stays green.

---

## Must-Have #3 — Multi-Language Code Switcher on `/connect` + `/sdk/snippets` Endpoint

**Type:** New feature (developer adoption)
**Why:** MCP is now shipped (cycle 6). The next biggest drop-off point is language-specific onboarding — developers in TypeScript, Go, and cURL workflows hit `/connect`, see only a Python snippet, and leave. A tab switcher removes that friction at the top of the funnel. The machine-readable `/sdk/snippets` endpoint lets Copilot, Cursor, and Claude auto-suggest correct AgentPick usage — a zero-marginal-cost distribution channel.

**Spec:**

**Tab switcher on `/connect`:**
- Tabs: `Python` | `TypeScript` | `cURL` | `Go` — keyboard navigable (`←` `→`), ARIA roles, last tab persisted in `localStorage`.
- Each tab shows: install command + a ~10-line working example for `POST /api/v1/route/search`.
- Python: uses the `agentpick` PyPI package.
- TypeScript: `fetch` with inline response type interface, zero extra deps.
- cURL: raw `Authorization: Bearer` call with copy-to-clipboard button.
- Go: `net/http` standard library only.

**New API endpoint `GET /api/v1/sdk/snippets`:**
```json
{
  "python": { "install": "pip install agentpick", "example": "..." },
  "typescript": { "install": "# no install needed", "example": "..." },
  "curl": { "install": "", "example": "curl -X POST ..." },
  "go": { "install": "# stdlib only", "example": "..." }
}
```
No auth required. Used by the `/connect` page itself and consumable by LLM tooling.

**Acceptance:**
- `/connect` shows 4-tab code switcher; each tab renders correct, runnable snippet
- Tab selection persists across page reloads
- `GET /api/v1/sdk/snippets` returns 200 with all 4 languages
- QA 51/51 stays green

---

## Definition of Done

- [ ] QA script: `voyage-ai` → `voyage-embed`; suite reports **51/51**
- [ ] Glass cards on benchmarks, rankings, agents, connect, dashboard
- [ ] No white flash; all pages use `var(--bg-base)` body background
- [ ] ScrollReveal active on all pages (not homepage-only)
- [ ] Count-up stat animations on homepage hero
- [ ] Card hover lift + CTA shimmer + strategy pulse (respects `prefers-reduced-motion`)
- [ ] Lighthouse Performance ≥ 90 on `/` and `/benchmarks`; LCP < 2.5s; CLS < 0.1
- [ ] `/connect` shows 4-tab code switcher (Python, TypeScript, cURL, Go)
- [ ] `GET /api/v1/sdk/snippets` returns 200 with all 4 language snippets
- [ ] Tab selection persists in `localStorage`

## Out of Scope (This Cycle)
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — tracked by Pclaw in `/workspace/agentpick-benchmark/`
- New routing strategies or tool integrations
- Stripe/billing changes
- Team/org accounts
- OpenAI-compatible `/v1/tools` shim (evaluate after SDK adoption data)
