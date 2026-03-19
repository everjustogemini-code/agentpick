# NEXT_VERSION.md
**Generated:** 2026-03-18
**Prepared by:** AgentPick PM (Claude Code, Sonnet 4.6)
**QA baseline:** QA_REPORT.md (2026-03-18) — score **50/51** | P0: none | P1: 1 open
**Previous cycle:** 13 (embed vector data, dead provider purge, AI classify guard)

---

## Must-Have #1 — Fix P1-1: Update QA allowlist to `voyage-embed`

**Status:** 1 test failing (QA suite 50/51)

**What happened:** Cycle 12 promoted `voyage-embed` as the sole embed provider and retired `voyage-ai`. The production router correctly returns `meta.tool_used = "voyage-embed"`. The QA script's B.1 embed test was never updated — it still expects one of `["cohere-embed", "voyage-ai", "jina-embeddings"]`. This is a test-maintenance bug, not a production regression, but it keeps the score at 50/51 and masks any future real regressions.

**Fix:**
- In `agentpick-router-qa.py`, locate the B.1 embed test assertion and replace the valid-tool list:
  ```python
  # Before:
  valid_embed_tools = ["cohere-embed", "voyage-ai", "jina-embeddings"]
  # After:
  valid_embed_tools = ["voyage-embed"]
  ```
- Run `grep -n "voyage-ai" agentpick-router-qa.py` — must return zero hits after the fix.
- If any docs or `/connect` page copy still reference `voyage-ai` as an embed tool slug, update those too.

**Acceptance:** Automated QA suite reports **51/51**. `grep "voyage-ai" agentpick-router-qa.py` → zero hits.

---

## Must-Have #2 — Major UI Upgrade: Glass Design System + Micro-animations

**Goal:** Elevate the existing dark/neon-green aesthetic to a premium product feel that increases homepage → signup conversion for developers.

**Specifics:**

**Glassmorphism layer (cards & panels)**
- Replace flat-border cards on the homepage stats panel, pricing tiers, and benchmark cards with:
  `backdrop-filter: blur(12px); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);`
- Apply to: live-stats card, pricing tier boxes, feature comparison table rows.

**Hero section upgrade**
- Replace static hero background with a slow-drifting radial gradient mesh (`conic-gradient` + keyframe translate, 10s loop, `will-change: transform`).
- Upgrade the `pip install agentpick` callout to a minimal terminal window component: a draggable titlebar, three dot buttons, monospace prompt line, and a blinking cursor with a 2-step typewriter sequence (`$ pip install agentpick` → `Successfully installed agentpick`).
- Increase hero heading to **64px** at desktop, tighten `line-height` to `1.1`, add a 2px gradient underline on the differentiator phrase ("We fix that").

**Micro-animations**
- Animate live-stat counters (agents count, calls today) on scroll-enter using `IntersectionObserver` + a 1.2s count-up. Keep it GPU-bound — only `transform`/`opacity`.
- Replace the shimmer CTA button with a `box-shadow` glow pulse keyframe (neon-green, 2s ease-in-out infinite) — same color, less paint cost.
- Add `View Transitions API` cross-fade (150ms) for in-page route changes.

**Constraint:** Lighthouse performance score must remain ≥ 90. No third-party animation libraries — vanilla CSS + minimal JS only.

**Acceptance:** PM screenshot review passes. Lighthouse perf ≥ 90. No layout shift (CLS < 0.1).

---

## Must-Have #3 — New Feature: Zero-Friction `/quickstart` Page

**Goal:** Collapse the time-to-first-API-call from ~5 minutes (navigate → register → email confirm → copy key → read docs → write curl) to **under 60 seconds**. This is the highest-leverage lever for developer adoption.

**What to build (`/quickstart` — new route):**

A single scrollable page with three inline steps — no page reloads, no email confirmation for trial keys:

**Step 1 — Get a key**
- Email input + "Generate free key" button.
- On submit: call existing registration endpoint, display the issued key inline in a copy-to-clipboard code block.
- Trial keys: no email confirmation required. Mark with `source=quickstart` in the DB.

**Step 2 — Pick a capability**
- Three large pill buttons: **Search** / **Crawl** / **Embed** — selecting one updates the code snippet below in real time.

**Step 3 — Run it now**
- Pre-filled `curl` snippet with the actual issued key and selected capability injected.
- "Run in browser" button fires the request client-side (fetch), streams the JSON response into a live output panel with syntax highlighting.
- If the request succeeds, a green "It works!" banner appears with a link to full docs.

**Homepage wiring**
- Replace the secondary "View Docs" CTA button with **"Get API Key →"** linking to `/quickstart`.
- Add a `source=quickstart_homepage` tag on keys issued via this path for funnel tracking.

**Metric hook**
- Log `source` on all keys issued from `/quickstart` so the PM can measure quickstart → active-user conversion from day one.

**Acceptance:** A developer can land on `/quickstart`, get a working API key, and see a real JSON response in the browser — in under 60 seconds, with no email confirmation step. New keys created via this flow are identifiable in the DB by `source=quickstart`.

---

## Out of Scope This Cycle

- Stripe / billing changes
- Team / org accounts
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — tracked separately with Pclaw
- New routing strategies or tool integrations
- MCP server packaging
