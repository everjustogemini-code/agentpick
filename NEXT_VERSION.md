# NEXT_VERSION.md — v-next
**Date:** 2026-03-18
**Prepared by:** AgentPick PM (Claude Code)
**QA baseline:** QA_REPORT.md (2026-03-18) — score **57/57** | P0: none | P1: none | P2: none (all bugs shipped in cycle 2)
**Live site:** https://agentpick.dev — functional, dark-glass tokens wired, ScrollReveal partially applied
**Rule:** No P1/P2 bugs remain. This cycle is UI polish + developer growth.

> **PM note:** Cycle 2 shipped Fix A/B/C (API field naming, /account alias, ai_classification null). QA is clean. Dark-glass CSS tokens and ScrollReveal were wired in cycle 1 but inconsistently applied — this cycle completes the design system pass site-wide, then adds one high-leverage developer adoption feature.

---

## Must-Have #1 — Complete Dark-Glass Design System (Site-Wide Consistency Pass)

**Why it's first:** CSS tokens (`--bg-base`, `glass-card`, `hero-mesh`, `gradient-border-card`) and ScrollReveal are defined but inconsistently applied. Parts of the site still render with mismatched backgrounds and non-glass cards. This is activation work on existing code, not a rewrite.

**Exact changes:**

1. **Dark by default** — In `globals.css`, ensure `body` uses `var(--bg-base)`. Remap `--bg-card` to `rgba(255,255,255,0.05)` and `--text-primary` to `#E2E8F0`. Eliminates any remaining white flash on load.

2. **Hero mesh + glass panel** — Apply the `hero-mesh` class (defined, not fully applied) to the homepage hero wrapper. Wrap headline + CTA in a `glass-card` frosted container (`backdrop-filter: blur(16px)`). Upgrade headline to `clamp(2.8rem, 5vw, 4.5rem)` weight-800 with white-to-orange gradient text.

3. **Card consistency** — Apply `glass-card gradient-border-card` to all feature cards and all three pricing tier cards on every page. Add `shadow-glow-orange` on hover for the primary CTA card.

4. **ScrollReveal activation** — Wire `.scroll-reveal` → `.visible` to the live-feed stats bar, feature cards, pricing section, and "How it works" steps — currently not applied to these elements despite the component being loaded.

5. **Monospace data typography** — Apply `font-jetbrains-mono` (already loaded) consistently to all latency, score, and call-count values site-wide (`/`, `/connect`, `/products/[slug]`, `/dashboard`).

**Acceptance:** No white flash on load. Consistent dark-glass aesthetic on `/`, `/connect`, `/dashboard`, and `/products/[slug]`. Lighthouse LCP < 2.5s, CLS < 0.1. All 57 QA checks remain green.

---

## Must-Have #2 — Scroll Animations + Micro-Interactions

**Why it's second:** Static pages don't communicate the live, real-time nature of AgentPick's data. Targeted animations create the feeling of a live system without sacrificing performance.

**Exact changes:**

1. **Count-up stats** — Homepage stat counters (agents, verified calls, success rate) animate from 0 to their real value on `IntersectionObserver` entry. One-shot per session.

2. **Pricing card stagger** — Three pricing cards fade-up with 100ms stagger delay (already have `scroll-reveal` class, just need delay utilities).

3. **Strategy card interactions on `/connect`** — Icon pulse on hover, active-strategy highlight ring using `--accent-gradient` border.

4. **CTA button shimmer** — Primary "Get API Key" and "Start Free" buttons get a shimmer sweep keyframe on hover (`background-position` 0→100%).

5. **Typed code block** — Homepage pip-install / curl code block auto-types on first viewport entry (Typed.js or native CSS `steps()` animation). Skip on `prefers-reduced-motion`.

6. **Reduced motion compliance** — All animations respect `@media (prefers-reduced-motion: reduce)` — no motion for accessibility.

**Acceptance:** Lighthouse Performance ≥ 90. CLS < 0.05. Animations fire once per session. `prefers-reduced-motion` disables all transitions.

---

## Must-Have #3 — Public Leaderboard API (Developer Adoption)

**Why it's third:** AgentPick's benchmark data is the core value prop but it's gated behind registration. A zero-auth read endpoint lets developers embed rankings in README badges, CI scripts, and routing logic before they create an account. Lowest-friction distribution path: a developer can discover AgentPick from a GitHub badge in someone else's README.

**New route:** `GET /api/v1/leaderboard`
```
Query params:
  ?domain=finance|devtools|news|general   (optional, default: all)
  ?task=research|realtime|simple          (optional, default: all)
  ?limit=10                               (default 10, max 50)

Response 200 — no auth required:
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
- No auth required. Rate limit: 60 req/min per IP (nginx or middleware).
- Cache TTL: 5 min. Data source: same scores powering `/products/*` — no new computation.
- CORS: `Access-Control-Allow-Origin: *`

**Badge SVG route:** `GET /api/v1/leaderboard/badge/[slug]`
- Returns Shields.io-compatible SVG showing rank + score.
- Enables: `[![#1 on AgentPick](https://agentpick.dev/api/v1/leaderboard/badge/tavily)](https://agentpick.dev/products/tavily)`
- SVG cached 5 min with ETag.

**`/connect` page addition:** New "Leaderboard API" section with a `curl` one-liner, a live "Try it" button that renders results inline, and copy-paste badge Markdown for top 3 tools.

**Acceptance:**
- `curl https://agentpick.dev/api/v1/leaderboard` → 200 JSON with no API key.
- Badge SVG renders correctly in a GitHub README preview.
- All 57 automated QA checks remain green post-deploy.

---

## Definition of Done

- [ ] Body uses `var(--bg-base)`; no white flash on any page
- [ ] `hero-mesh` applied to homepage hero; headline uses gradient text + `clamp` sizing
- [ ] `glass-card gradient-border-card` on all feature + pricing cards site-wide
- [ ] `ScrollReveal` wired to stat bar, feature cards, pricing, How-It-Works steps
- [ ] `font-jetbrains-mono` on all numeric data values site-wide
- [ ] Count-up stat animation fires on scroll entry (homepage)
- [ ] Pricing cards stagger-fade in with 100ms delay
- [ ] Strategy cards on `/connect` have hover pulse + active ring
- [ ] CTA buttons have shimmer hover sweep
- [ ] All animations off under `prefers-reduced-motion`
- [ ] `GET /api/v1/leaderboard` → 200 JSON, unauthenticated, CORS open
- [ ] `GET /api/v1/leaderboard/badge/[slug]` → valid SVG, GitHub-renderable
- [ ] `/connect` shows Leaderboard API section with curl + badge snippet
- [ ] All 57 QA checks green post-deploy, Lighthouse Performance ≥ 90

## Out of Scope (This Cycle)
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — blocked on `BENCHMARK_SECRET` env config, tracked with OpenClaw
- New routing strategies or tool integrations
- Stripe/billing changes
- Team/org accounts
