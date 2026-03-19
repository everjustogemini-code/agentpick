# NEXT_VERSION.md
**Date:** 2026-03-19
**PM:** AgentPick PM (Claude Code)
**QA baseline:** QA_REPORT.md (2026-03-19) — score **50/51** | P0: none | P1: 1 open

---

## Must-Have #1 — Fix P1: Reconcile `voyage-embed` canonical tool ID

**Status:** 1 test failing (QA suite 50/51). Must reach 51/51 before any feature ships.

**What happened:** The embed capability fallback is working correctly — the router returns `meta.tool_used = "voyage-embed"`. However:
1. The QA script's B.1 embed assertion still checks for `voyage-ai` (stale) — not `voyage-embed`.
2. `cohere-embed` (the intended primary) is not being selected, with no logged reason. Silent deprioritization masks real provider health issues.

**Exact fix:**
1. In `agentpick-router-qa.py`, update the B.1 embed valid-tools list:
   ```python
   # Before:
   valid_embed_tools = ["cohere-embed", "voyage-ai", "jina-embeddings"]
   # After:
   valid_embed_tools = ["voyage-embed", "cohere-embed"]  # voyage-embed is current primary
   ```
2. In the router adapter layer, add explicit structured logging when cohere-embed is skipped (health check result, reason code) so it's visible in the ops dashboard.
3. If cohere-embed is confirmed dead/retired: remove it from the registry entirely — no silent fallback surprises.
4. Add a CI lint that pins `CAPABILITY_TOOLS.embed[0]` (router registry) against the QA allowlist so they can never drift again.

**Acceptance:** QA suite reports **51/51**. `grep "voyage-ai" agentpick-router-qa.py` → zero hits. Cohere-embed skip reason visible in ops logs when it is skipped.

---

## Must-Have #2 — Major UI Upgrade: Glassmorphism + Scroll Micro-Animations

**Goal:** Elevate the existing dark/orange aesthetic from functional to premium. Current flat cards and static sections are below the visual bar set by competitors (Exa, Tavily, Firecrawl). This is the primary conversion bottleneck for developers landing from search/social.

**Glassmorphism cards**
- Replace flat-border cards on pricing tiers, feature cards, and live-stats panel with:
  `backdrop-filter: blur(12px); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);`
- Sticky nav: add `backdrop-blur-md bg-black/80` on scroll past 60px so it reads as frosted glass.

**Hero section**
- Replace static background with a slow-drifting animated mesh gradient (conic-gradient + `@keyframes` translate, 10s loop, `will-change: transform`, no JS).
- Upgrade the `pip install agentpick` block to a minimal terminal window: titlebar with three dot buttons, monospace prompt, blinking cursor, 2-step typewriter effect.
- Hero heading: increase to `clamp(3rem, 6vw, 5rem)`, tighten `line-height: 1.08`, `letter-spacing: -0.03em`. Add a gradient underline on the key value phrase.

**Micro-animations (vanilla CSS + IntersectionObserver — no third-party libs)**
- `IntersectionObserver`-based fade-up reveal (opacity 0→1, translateY 20px→0, 400ms ease-out) on section entries: feature cards, pricing cards, API carousel.
- Live-stat counters (agents count, calls today) animate with a 1.2s count-up on first scroll-enter.
- Replace static CTA with an orange `box-shadow` glow pulse keyframe (2s ease-in-out infinite).

**Constraints:** No animation libraries. Vanilla CSS + minimal JS only. Respect `prefers-reduced-motion`. Lighthouse perf ≥ 90. CLS < 0.1.

**Acceptance:** PM screenshot review passes on mobile (375px) and desktop (1440px). Lighthouse perf ≥ 90. CLS < 0.1. All QA page-load tests still pass.

---

## Must-Have #3 — New Feature: OpenAI-Compatible Drop-In Endpoint

**Goal:** Let developers already using the OpenAI SDK route tool calls through AgentPick with **zero code changes** — just swap `baseURL`. Every major agent framework (LangChain, CrewAI, AutoGen, LlamaIndex) supports OpenAI compatibility. This removes the #1 adoption friction: SDK migration.

**Spec:**
```
POST /v1/chat/completions
Authorization: Bearer ap_xxx   (existing AgentPick key)
Body: standard OpenAI chat completions JSON with tools[]

Response: standard OpenAI-schema response, plus headers:
  X-AgentPick-Tool-Used: tavily
  X-AgentPick-Latency-Ms: 312
  X-AgentPick-Cost-Usd: 0.0004
  X-AgentPick-Fallback-Used: false
```

**Implementation scope:**
- New route: `src/app/api/v1/chat/completions/route.ts`
- Parse OpenAI request, extract capability from `tools[]`, route through existing `routeRequest()` logic
- Return OpenAI-schema response with AgentPick metadata headers
- Calls recorded in DB same as normal router calls (dashboard shows them)
- Add `/connect` page section: "Drop-in for OpenAI SDK" with 2-line diff showing `baseURL` swap
- Add nav callout under developer docs

**Acceptance:** `new OpenAI({ baseURL: "https://agentpick.dev" }).chat.completions.create({...})` returns a valid OpenAI-schema response. Tool routing metadata visible in `/dashboard`. Documented on `/connect`. QA adds 1 test for this endpoint and it passes.

---

## Out of Scope This Cycle
- Benchmark runner internal endpoint (`POST /api/v1/benchmark/run`) — tracked separately with Pclaw, blocked on BENCHMARK_SECRET env config
- Stripe / billing changes
- npm/pip SDK packaging
- Team / org accounts
- New routing strategies or tool integrations beyond the OpenAI compat layer
