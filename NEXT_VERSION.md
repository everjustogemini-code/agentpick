# NEXT_VERSION.md — AgentPick v1.next

Generated: 2026-03-16 | QA: Round 16 (56/57) | Branch: main

---

## Must-Have #1 — Fix P1 Bug: `/api/v1/account/register` Returns 404

**Source:** QA_REPORT.md Round 16, P1 Issue #1

**Problem:** `POST /api/v1/account/register` returns `404 NOT_FOUND`. The canonical registration path is `POST /api/v1/router/register`. Any integration docs, third-party clients, or agent tooling referencing the `/account/register` path silently fails — lost signups, broken onboarding.

**Fix:** Add a Next.js route handler at `src/app/api/v1/account/register/route.ts` that proxies or 301-redirects to `/api/v1/router/register`. Must preserve request body, return identical `{ apiKey, plan, monthlyLimit }` JSON response, and emit a `Deprecation: true` header so callers can detect the alias.

**Acceptance:**
- `POST /api/v1/account/register` with valid payload → same response shape as `/api/v1/router/register`
- QA Round 17 test for `/api/v1/account/register` passes → score 57/57
- Zero regression on existing `/api/v1/router/register` behavior

---

## Must-Have #2 — Major UI Upgrade: Glassmorphism + Micro-animations + Typography Overhaul

**Context:** Current design is clean and functional but flat — no depth, no motion, no visual hierarchy that guides visitors to the CTA. Competitors (Tavily, Exa, Jina) ship immersive animated developer-first landing pages. This upgrade converts first-time visitors into signups.

**Scope:**

1. **Glassmorphism cards** — apply `backdrop-filter: blur(12px)` + `bg-white/5` + `border border-white/10` to all stat cards, feature cards, and the agent-counter widget on homepage and `/connect`. Drop the current flat card backgrounds.

2. **Hero stat counter animation** — CSS keyframe counter on the live network stats ("395 active agents / 880+ benchmark runs / 11,500+ calls"): count up 0 → final value on page load, 800ms ease-out, triggered by `IntersectionObserver`.

3. **Typography overhaul** — upgrade homepage `h1` to `clamp(2.5rem, 6vw, 4.5rem)` with a `background-clip: text` gradient (blue → purple). Switch all inline code and code blocks to `JetBrains Mono` or `Geist Mono`. Increase code block background contrast to `#0d1117`.

4. **Animated routing diagram on `/connect`** — add a simple CSS/SVG flow animation (agent icon → AgentPick logo → tool icons with a traveling pulse dot) above the code example. Must convey the routing concept in under 2 seconds without a library dependency.

5. **CTA button shimmer** — primary "Get API Key" and "Install AgentPick" buttons get a `@keyframes shimmer` sweep on hover (white highlight travels left → right over the button).

**Acceptance:**
- Lighthouse Performance score ≥ 90 on mobile (no regression from animation weight)
- All 4 QA page load checks still pass 200 OK
- No Cumulative Layout Shift on 375px viewport
- Animations respect `prefers-reduced-motion: reduce`

---

## Must-Have #3 — New Feature: Official `agentpick` Python Package on PyPI

**Goal:** Reduce developer integration time from ~30 min (reading docs, crafting curl) to under 2 minutes (`pip install agentpick`). Every major competitor ships a Python SDK. This directly increases adoption and makes AgentPick citable in agent framework repos.

**Deliverables:**

1. **PyPI package:** `agentpick` version `0.1.0`, pure Python, no heavy deps (only `httpx` or `requests`).

2. **Core interface:**
```python
from agentpick import AgentPick

ap = AgentPick(api_key="ah_live_sk_...")

# Route a search
result = ap.search("SEC filings NVDA 2025")
print(result["data"]["results"])

# Recommend a tool
rec = ap.recommend(capability="search", domain="finance")

# Report telemetry
ap.telemetry(tool="tavily", success=True, latency_ms=195)
```

3. **Auto-registration:** `AgentPick(auto_register=True, agent_name="my-bot")` registers on first call and persists the key to `~/.agentpick/config.json` — zero-friction onboarding for new agents.

4. **Surface it:** Add `pip install agentpick` block prominently to `/connect` quick start (above the curl examples). Update `skill.md` to include the pip install path. Add PyPI badge to homepage.

**Acceptance:**
- `pip install agentpick && python -c "from agentpick import AgentPick; print('ok')"` exits 0
- `ap.search("test")` returns structured results via `/api/v1/router/search`
- PyPI README matches `/connect` docs
- `/connect` page updated; QA page load check still passes 200 OK

---

## Ship Order

```
1. #1 — /account/register alias   → < 1 hour, zero risk, QA score 57/57
2. #2 — UI upgrade                → parallel track, no API changes
3. #3 — PyPI package              → ships after #1 is live and confirmed
```

**Rule:** No new features deploy until #1 is confirmed 57/57 by QA.
