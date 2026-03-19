# NEXT_VERSION.md — v-next
**Date:** 2026-03-18
**Prepared by:** AgentPick PM (reviewed & confirmed 2026-03-18)
**QA baseline:** QA_REPORT.md (2026-03-18) — score **60/60, zero P0/P1/P2 bugs**
**Live site:** https://agentpick.dev (checked 2026-03-18 — dark neon design, animated hero metrics, 3-tier pricing, functional)
**Rule:** Bugs first. No features while P1/P2 remain. **All clear — features unlocked.**

> PM review notes: QA 60/60 confirmed clean. One P2 docs/routing gap remains (`/api/v1/account` 404). Live site UI functional but green-neon aesthetic is dated vs current SaaS bar (Vercel/Resend/Linear tier). CSS dark-glass tokens exist but inconsistently applied — no rewrite needed, just activation. Leaderboard API is the highest-leverage zero-auth adoption hook given the product's core value is benchmark data.

---

## Must-Have Item 1 — Fix `/api/v1/account` (P2 — Developer Friction)

**What:** `GET /api/v1/account` returns **404**. Account data lives at `GET /api/v1/router/usage` instead. Any developer following docs, LLM-generated snippets, or older blog posts referencing `/api/v1/account` hits a dead end with no helpful error.

**Exact fix:**

1. Add `GET /api/v1/account` as an alias route that returns the same response as `/api/v1/router/usage` plus a deprecation hint:
   ```json
   {
     "plan": "pro",
     "monthlyLimit": 10000,
     "callsThisMonth": 42,
     "strategy": "auto",
     "_note": "Prefer /api/v1/router/usage — this alias will be removed in v2"
   }
   ```
2. Include response header: `Deprecation: true`.
3. Update the API reference table on `/connect` to document both paths, marking `/account` as a deprecated alias.

**Acceptance:** `GET /api/v1/account` with a valid Bearer key → **200** with account fields (no 404). Deprecation header present.

---

## Must-Have Item 2 — Full Dark-Glass Design System Consistency Pass

**What:** The CSS has two coexisting design systems: a light-mode default (`--bg-primary: #FAFAFA`, white cards) and a dark glass system (`--bg-base: #0a0a0f`, glass-card, hero-mesh, gradient-border-card). The dark tokens are defined and the live site partially uses them, but the body defaults to light mode and key sections are inconsistently styled — light cards on dark backgrounds, glass components scattered without system-level consistency.

**Exact changes:**

1. **Dark by default.** In `globals.css`, change `body { background: var(--bg-primary) }` → `var(--bg-base)`. Remap `--bg-card` to `rgba(255,255,255,0.05)` and `--text-primary` to `#E2E8F0` to complete the dark theme.

2. **Homepage hero (`src/app/page.tsx`).** Apply `hero-mesh` full-bleed (already defined in CSS, not yet applied to the hero wrapper). Wrap headline + CTA in a `glass-card` frosted panel. Upgrade headline to `font-size: clamp(2.8rem, 5vw, 4.5rem); font-weight: 800; letter-spacing: -0.03em` with `bg-gradient-to-r from-white to-orange-400 bg-clip-text text-transparent`.

3. **Feature and pricing cards.** Apply `glass-card gradient-border-card` to all three feature-section cards and all pricing tier cards. Add `shadow-glow-orange` on hover for the primary CTA card, `shadow-glow-cyan` for the secondary.

4. **Scroll-reveal wiring.** The `.scroll-reveal` + `.visible` CSS and `ScrollReveal` component exist but are not applied to stat counters or feature sections on `/`. Wire `<ScrollReveal>` to: live-feed stats bar, feature cards, pricing section, and "How it works" steps.

5. **Typography.** Apply `font-jetbrains-mono` (`data-value` class) to all latency, score, and call-count displays site-wide — currently only on some pages.

**Acceptance:** No white flash on load. Lighthouse LCP < 2.5s. Consistent dark glass appearance on `/`, `/connect`, and `/products/[slug]`. All 51 automated QA checks remain green.

---

## Must-Have Item 3 — Public Leaderboard API (Developer Adoption)

**What:** AgentPick has deep benchmark data but zero programmatic read access without an account. Developers building routing logic, README badges, or Grafana dashboards must sign up just to ask "what's the best search tool right now?" A free, unauthenticated read endpoint removes that wall — it's the lowest-friction path to getting AgentPick into third-party tools.

**Exact spec:**

**New route:** `GET /api/v1/leaderboard`
```
Query params:
  ?domain=finance|devtools|news|general|...   (optional)
  ?task=research|realtime|simple              (optional)
  ?limit=10                                   (default 10, max 50)

Response 200:
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
      "domains": ["general", "news", "finance"]
    }
  ]
}
```
- **No auth required.** Rate-limit: 60 req/min per IP.
- **Cache TTL:** 5 minutes (reuse whatever the app already has for `/products/[slug]` data).
- Data source: same benchmark scores already powering `/products/*` pages — no new computation.

**Badge SVG route:** `GET /api/v1/leaderboard/badge/[slug]`
- Returns a static SVG shield (Shields.io-compatible format) showing current rank and score.
- Enables: `[![Ranked #1](https://agentpick.dev/api/v1/leaderboard/badge/tavily)](https://agentpick.dev/products/tavily)` in any GitHub README.
- SVG cached 5 minutes, ETag for browser caching.

**`/connect` page addition:**
- New "Leaderboard API" section with a `curl` one-liner and a live "Try it" button that hits the endpoint.
- Copy-paste badge Markdown snippet for each top-ranked tool.

**Acceptance:**
- `curl https://agentpick.dev/api/v1/leaderboard` → 200 JSON, no API key required.
- `curl https://agentpick.dev/api/v1/leaderboard/badge/tavily` → SVG image.
- Badge renders correctly in a GitHub README (no CORS block).
- All 51 automated QA checks remain green.

---

## Definition of Done

- [ ] `GET /api/v1/account` → 200 + deprecation hint (no 404)
- [ ] Body defaults to dark glass; no white flash on load; `hero-mesh` applied to homepage hero
- [ ] `glass-card gradient-border-card` applied to all feature + pricing cards
- [ ] `ScrollReveal` wired to stat bar, feature cards, pricing, and How-It-Works sections
- [ ] `GET /api/v1/leaderboard` → 200 JSON, no auth required, rate-limited
- [ ] `GET /api/v1/leaderboard/badge/[slug]` → SVG, renders in GitHub README
- [ ] `/connect` page shows Leaderboard API section with curl example
- [ ] All 51 automated QA checks remain green post-deploy

## Out of Scope (this cycle)
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — tracked separately by Pclaw/OpenClaw; blocked on `BENCHMARK_SECRET` env config
- New routing strategies or tool integrations
- Stripe/billing changes
- Admin panel changes
