# NEXT_VERSION.md
**Date:** 2026-03-19 (refreshed)
**PM:** AgentPick PM (Claude Code)
**QA baseline:** QA_REPORT.md (2026-03-19T00:07Z) — score **53/54** | P0: none | P1: 1 open
**Previous cycle:** 16 (latest deployed)

---

## Must-Have #1 — Fix P1-1: Reconcile `voyage-embed` canonical tool ID

**Status:** 1 test failing (QA suite 50/51). Must reach 51/51 before any feature ships.

**What happened:** Cycle 12 promoted `voyage-embed` as the sole embed provider and retired `voyage-ai`. The production router correctly returns `meta.tool_used = "voyage-embed"`. The QA script's embed test was never updated — it still expects one of `["cohere-embed", "voyage-ai", "jina-embeddings"]`. This is a test-maintenance bug, not a production regression, but it masks future real regressions.

**Fix:**
1. In `agentpick-router-qa.py`, find the B.1 embed assertion and update the valid-tool list:
   ```python
   # Before:
   valid_embed_tools = ["cohere-embed", "voyage-ai", "jina-embeddings"]
   # After:
   valid_embed_tools = ["voyage-embed"]
   ```
2. Run `grep -n "voyage-ai" agentpick-router-qa.py` — must return zero hits after fix.
3. Add a CI assertion that pins `CAPABILITY_TOOLS.embed[0]` (router registry) against the QA allowlist so they can never drift again.
4. Audit `/connect` page copy — if it references `voyage-ai` as an embed slug, update to `voyage-embed`.

**Acceptance:** Automated QA suite reports **54/54**. `grep "voyage-ai" agentpick-router-qa.py` → zero hits.

---

## Must-Have #2 — Major UI Upgrade: Glassmorphism + Scroll Micro-Animations

**Goal:** Elevate the existing dark/neon-green aesthetic from functional to premium. Current flat cards and static sections are below the visual bar set by competitors (Exa, Tavily, Firecrawl). This is the primary conversion bottleneck for developers landing from search/social.

**Glassmorphism cards**
- Replace flat-border cards on pricing tiers, feature cards ("What It Does"), and live-stats panel with:
  `backdrop-filter: blur(12px); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);`
- Sticky nav: add `backdrop-blur-md bg-bg-primary/80` on scroll past 60px so it reads as frosted glass.

**Hero section**
- Replace static background with a slow-drifting animated mesh gradient (conic-gradient + `@keyframes` translate, 10s loop, `will-change: transform`, no JS).
- Upgrade the `pip install agentpick` block to a minimal terminal window: titlebar with three dot buttons, monospace prompt line, blinking cursor, 2-step typewriter effect (`$ pip install agentpick` → `Successfully installed agentpick`).
- Hero heading: increase to `clamp(3rem, 6vw, 5rem)`, tighten `line-height: 1.08`, `letter-spacing: -0.03em`. Add a gradient underline on "We fix that."

**Micro-animations (CSS/JS — no third-party libs)**
- `IntersectionObserver`-based fade-up reveal (opacity 0→1, translateY 20px→0, 400ms ease-out) on all section entries: feature cards, pricing cards, API carousel.
- Live-stat counters (agents count, calls today) animate with a 1.2s count-up on first scroll-enter.
- Replace shimmer CTA with a neon-green `box-shadow` glow pulse keyframe (2s ease-in-out infinite).

**Constraint:** No animation libraries. Vanilla CSS + minimal JS only. Lighthouse perf ≥ 90. CLS < 0.1.

**Acceptance:** PM screenshot review passes on mobile (375px) and desktop (1440px). Lighthouse perf ≥ 90. CLS < 0.1. All 4 page load tests in QA still pass.

---

## Must-Have #3 — New Feature: Zero-Friction `/quickstart` Page

**Goal:** Collapse time-to-first-real-API-response from ~5 minutes (register → email confirm → copy key → read docs → write curl) to **under 60 seconds**. This is the highest-leverage lever for developer adoption.

**Three inline steps — no page reloads:**

**Step 1 — Get a key instantly**
- Email input + "Generate free key" button.
- On submit: call existing `POST /api/v1/auth/register`, display issued API key inline in a copy-to-clipboard code block. No email confirmation required for trial keys. Mark keys with `source=quickstart` in DB.

**Step 2 — Pick a capability**
- Three large pill buttons: **Search** / **Crawl** / **Embed** — selecting one updates the curl snippet below in real time (JS, no reload).

**Step 3 — Run it in the browser**
- Pre-filled `curl` snippet with the issued key and selected capability injected.
- "Run" button fires `fetch()` client-side, streams JSON response into a live output panel with syntax highlighting.
- On success: green "It works! 🎉" banner + link to full `/connect` docs.

**Homepage wiring**
- Replace secondary "View Docs" CTA with **"Get started free →"** linking to `/quickstart`.
- Tag keys issued via this flow as `source=quickstart_homepage` for funnel tracking.

**Acceptance:** A developer can land on `/quickstart`, receive a working API key, and see a real JSON routing response in the browser — in under 60 seconds, no email confirmation. All keys from this flow are identifiable in the DB by `source=quickstart`.

---

## Out of Scope This Cycle
- Stripe / billing changes
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — tracked separately with Pclaw, blocked on BENCHMARK_SECRET env config
- npm/pip SDK packaging
- Team / org accounts
- New routing strategies or tool integrations
